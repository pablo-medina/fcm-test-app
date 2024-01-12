import { ApplicationConfig, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { environment } from '../environments/environment';
import { MessagingService } from './services/messaging.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'fcm-frontend';

  constructor(messagingService: MessagingService) {
    messagingService.getFirebaseConfig()
      .subscribe(
        {
          next: firebaseConfig => {
            console.debug('Configuración de Firebase: [APP]', firebaseConfig);
            const fapp = initializeApp(firebaseConfig);
            const messaging = getMessaging(fapp);
            getToken(messaging).then(token => {
              console.log('El token es: ', token);
            });
          },
          error: err => {
            console.error('No se pudo obtener configuración de firebase:', err);
          }
        }
      );        
  }

}
