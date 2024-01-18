import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, interval, Observable, Subscription, of, tap, fromEvent } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IMensaje } from '../models/mensaje.model';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private channel = new BroadcastChannel('app-channel');
  private config: any;
  serviceWorkerReady$ = new BehaviorSubject<boolean>(false);

  private intervalSubscription: Subscription | undefined;

  constructor(private http: HttpClient) {
    if (navigator.serviceWorker) {
      this.startPolling();
    }
  }

  private startPolling() {
    this.intervalSubscription = interval(1000).subscribe(() => {
      console.debug('Consultando estado al service worker...');
      this.channel.postMessage({ action: 'status_request' });
    });

    this.channel.addEventListener('message', (event) => {
      const data = event.data;
      if (data.action === 'status' && data.ready === true) {
        this.stopPolling();
        console.log('Service Worker listo.');
        this.serviceWorkerReady$.next(true);
      }
    })
  }

  private stopPolling() {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = undefined;
    }
  }

  getFirebaseConfig(): Observable<any> {
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

      return this.http.get(configApiUrl, { headers })
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

    console.debug('enviarMensaje:', mensaje);

    console.log('URL', sendMessageUrl, 'body:', mensaje, 'headers:', headers);

    return this.http.post(sendMessageUrl, mensaje, { headers })
      .pipe(
        tap(response => {
          console.debug('Mensaje recibido:', response);
        })
      );
  }

  enviarMensajeTopic(mensaje: IMensaje): Observable<any> {
    const sendMessageUrl = `${environment.apiUrl}/send-message-topic`;
    const headers = new HttpHeaders(
      {
        'Content-Type': 'application/json',
        'application': environment.appId
      }
    );

    console.debug('enviarMensajeTopics:', mensaje);

    console.log('URL', sendMessageUrl, 'body:', mensaje, 'headers:', headers);

    return this.http.post(sendMessageUrl, mensaje, { headers })
      .pipe(
        tap(response => {
          console.debug('Mensaje recibido:', response);
        })
      );
  }

  subscribeToTopic(topic:string, token:string, status:boolean){
    const sendMessageUrl = `${environment.apiUrl}/subscribe-to-topic`;
    const headers = new HttpHeaders(
      {
        'Content-Type': 'application/json',
        'application': environment.appId
      }      
    );
    const body = {
      token,topic,status
    }
    console.log('EN SERVICE, TokenTopic', body)
    return this.http.post(sendMessageUrl, body, { headers })
    .pipe(
      tap(response => {
        console.debug('subscripcionTOPIC130:', response);
      })
    );
  }

  public isServiceWorkerEnabled(): boolean {
    return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
  }

}
