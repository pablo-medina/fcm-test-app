import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  constructor(private http: HttpClient) {
  }

  getFirebaseConfig(): Observable<any> {
    const configApiUrl = `${environment.apiUrl}/firebase-config`;
    const headers = new HttpHeaders(
      {
        'Content-Type': 'application/json',
        'application': environment.appId
      }
    )

    const options = { headers };
    return this.http.get(configApiUrl, options);
  }
}
