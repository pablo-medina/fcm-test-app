import { ApplicationConfig, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'fcm-frontend';

  constructor() {
    const firebaseConfig = environment.firebaseConfig as any;
    if (!firebaseConfig.apiKey) {
      throw new Error('Firebase no configurado. Revisar la configuración en environment.ts.');
    }

    const fapp = initializeApp(environment.firebaseConfig);
    const messaging = getMessaging(fapp);
    getToken(messaging).then(token => {
      console.log('El token es: ', token);
    });
  }

}
