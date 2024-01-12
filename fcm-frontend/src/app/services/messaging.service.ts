import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, of, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private channel = new BroadcastChannel('app-channel');
  private config: any;

  constructor(private http: HttpClient) {
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
