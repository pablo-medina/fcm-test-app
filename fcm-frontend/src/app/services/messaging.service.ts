import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, interval, Observable, Subscription, of, tap, fromEvent } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
        )
    }
  }
}
