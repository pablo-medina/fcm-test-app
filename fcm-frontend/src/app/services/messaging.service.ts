import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, concatMap, from, map, Observable, of, tap, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IMensaje } from '../models/mensaje.model';
import { FirebaseConfig, Notificacion } from '../models/messaging.model';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private channel = new BroadcastChannel('app-channel');
  private config: any;
  private messagingServiceWorker: ServiceWorker | undefined;
  private firebaseConfig!: FirebaseConfig;
  private messageToken!: string;
  private _serviceWorkerReady$ = new BehaviorSubject<boolean>(false);
  private _notificacion$ = new Subject<Notificacion>();

  constructor(private http: HttpClient) {
  }

  public inicializar() {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(registration => {
          console.log('ServiceWorkerRegistration:', registration, 'Scope:', registration.scope);

          const worker = registration.active || registration.installing;
          if (worker) {
            if (worker.state === 'activated') {
              console.log('El service worker de mensajería ya está activo.');

              this.inicializarFCM(registration).subscribe({
                next: config => {
                  worker.postMessage({ action: 'firebase-config', value: config });
                  this._serviceWorkerReady$.next(true);
                }, error: err => { console.error(err); }
              });
            } else {
              // Escuchar mensajes del Service Worker
              navigator.serviceWorker.addEventListener('message', (event: any) => {
                if (event.data && event.data.action === 'sw-active') {
                  console.log('Service worker de mensajería instalado y activo.');

                  this.inicializarFCM(registration).subscribe({
                    next: config => {
                      worker.postMessage({ action: 'firebase-config', value: config });
                      this._serviceWorkerReady$.next(true);
                    }, error: err => { console.error(err); }
                  });
                }
              })
            }
          }
        });
    } else {
      console.error('Service worker no encontrado. Los mensajes en segundo plano no van a funcionar.');
    }
  }

  private inicializarFCM(registration: ServiceWorkerRegistration): Observable<FirebaseConfig> {
    return this.getFirebaseConfig()
      .pipe(
        map(firebaseConfig => {
          console.log('Config:', firebaseConfig);
          const fapp = initializeApp(firebaseConfig);
          const messaging = getMessaging(fapp);
          return ({ firebaseConfig, messaging });
        }),
        concatMap(({ firebaseConfig, messaging }) => {
          return from(getToken(messaging, {
            vapidKey: firebaseConfig.vapidKey,
            serviceWorkerRegistration: registration
          })).pipe(map((token: string) => ({ firebaseConfig, messaging, token })))
        }),
        map(({ firebaseConfig, messaging, token }) => {
          this.messageToken = token;
          console.log('Token:', token);

          onMessage(messaging, payload => {
            console.log('[APP] Mensaje recibido:', payload);
            this._notificacion$.next({
              titulo: payload.notification?.title,
              mensaje: payload.notification?.body,
              imagen: payload.notification?.image
            })
          });

          //console.debug('Service worker registrado:', sw);
          //this.messagingServiceWorker = sw;
          console.debug('Service worker de mensajería FCM registrado.');
          return firebaseConfig;
        })
      )
  }

  getFirebaseConfig(): Observable<FirebaseConfig> {
    if (this.config) {
      return of(this.config);
    } else {
      const configApiUrl = `${environment.apiUrl}/firebase-config`;
      const headers = new HttpHeaders(
        {
          'Content-Type': 'application/json',
          'application': environment.appId
        }
      );

      return this.http.get<FirebaseConfig>(configApiUrl, { headers })
        .pipe(
          tap(firebaseConfig => {
            this.channel.addEventListener('message', (event) => {
              const message = event.data;

              if (message.action === 'get-firebase-config') {
                this.channel.postMessage({ action: 'firebase-config', value: firebaseConfig })
              }
            })
          })
        );
    }
  }

  enviarMensaje(mensaje: IMensaje): Observable<any> {
    const sendMessageUrl = `${environment.apiUrl}/send-message`;
    const headers = new HttpHeaders(
      {
        'Content-Type': 'application/json',
        'application': environment.appId
      }
    );

    const mensajeCompleto = Object.assign(mensaje, { token: this.messageToken });

    console.debug('enviarMensaje: URL', sendMessageUrl, 'body:', mensajeCompleto, 'headers:', headers);

    return this.http.post(sendMessageUrl, mensajeCompleto, { headers });
  }

  public isServiceWorkerEnabled(): boolean {
    return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
  }

  get notificacion$() {
    return this._notificacion$.asObservable();
  }

  get ready$() {
    return this._serviceWorkerReady$.asObservable();
  }

}
