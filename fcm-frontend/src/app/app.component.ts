import { ApplicationConfig, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { environment } from '../environments/environment';
import { MessagingService } from './services/messaging.service';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  title = 'fcm-frontend';
  serviceWorkerReady$ = new BehaviorSubject<boolean>(false);
  private ngDestroy$ = new Subject<void>();

  constructor(messagingService: MessagingService) {

    messagingService.getFirebaseConfig()
      .subscribe(
        {
          next: firebaseConfig => {
            console.debug('Configuración de Firebase: [APP]', firebaseConfig);

            messagingService.serviceWorkerReady$
              .pipe(
                takeUntil(this.ngDestroy$)
              ).subscribe(ready => {
                if (ready) {
                  this.ngDestroy$.next();
                  this.ngDestroy$.complete();

                  console.debug('Service worker listo... Inicializando Firebase...');
                  const fapp = initializeApp(firebaseConfig);
                  const messaging = getMessaging(fapp);

                  // NOTA: Necesito obtener el swRegistration y pasárselo al getToken para que no falle en el primer uso
                  navigator.serviceWorker.register('/firebase-messaging-sw.js')
                    .then(swRegistration => {
                      console.log('Obteniendo token...');
                      //TODO: Agregar la vapidKey
                      getToken(messaging, { serviceWorkerRegistration: swRegistration }).then(token => {
                        console.log('El token es: ', token);
                      });
                    });
                }
              });

          },
          error: err => {
            console.error('No se pudo obtener configuración de firebase:', err);
          }
        }
      );
  }

  ngOnDestroy(): void {
    this.ngDestroy$.next();
    this.ngDestroy$.complete();
  }

}
