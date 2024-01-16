import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { MessagePayload, getMessaging, getToken, onMessage } from "firebase/messaging";
import { MessagingService } from './services/messaging.service';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SpinnerComponent, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  title = 'fcm-frontend';
  serviceWorkerReady$ = new BehaviorSubject<boolean>(false);
  private ngDestroy$ = new Subject<void>();
  loading = false;
  notSupported = false;

  token: string = '';

  frmEnviarMensaje = new FormGroup(
    {
      titulo: new FormControl<string | null>('Título'),
      texto: new FormControl<string>('Mensaje de prueba', { validators: Validators.required }),
      imagen: new FormControl<string | null>('https://picsum.photos/200')
    }
  );

  constructor(private messagingService: MessagingService, private toastr: ToastrService) {
    messagingService.getFirebaseConfig()
      .subscribe(
        {
          next: firebaseConfig => {
            console.debug('Configuración de Firebase: [APP]', firebaseConfig);
            this.loading = true;

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

                  this.loading = false;

                  onMessage(messaging, payload => {
                    console.log('MENSAJE RECIBIDO:', payload);
                    this.showToast(payload);
                  })

                  // NOTA: Necesito obtener el swRegistration y pasárselo al getToken para que no falle en el primer uso
                  navigator.serviceWorker.register('/firebase-messaging-sw.js')
                    .then(swRegistration => {
                      console.log('Obteniendo token...');
                      //TODO: Agregar la vapidKey
                      getToken(messaging, { serviceWorkerRegistration: swRegistration }).then(token => {
                        console.log('El token es: ', token);
                        this.token = token;
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

  private showToast(payload: MessagePayload): void {
    const title = payload.notification?.title;
    const body = payload.notification?.body;
    const imageUrl = payload.notification?.image;

    if (imageUrl) {
      this.toastr.info(
        `<div class="fcm-message"><div class="fcm-image-container"><img src="${imageUrl}" alt="${title}"></img></div><div class="fcm-message-content">${body}</div></div>`,
        title,
        { enableHtml: true, closeButton: true, timeOut: 5000 }
      );
    } else {
      this.toastr.info(
        `<div class="fcm-message"><div class="fcm-image-container"></div><div class="fcm-message-content">${body}</div></div>`,
        title,
        { enableHtml: true, closeButton: true, timeOut: 5000 }
      );
    }
  }

  enviarMensaje(): void {
    const formValue = this.frmEnviarMensaje.value;

    this.messagingService.enviarMensaje(
      {
        token: this.token,
        titulo: formValue.titulo || '',
        texto: formValue.texto || '',
        imagen: formValue.imagen || ''
      }
    ).subscribe(
      {
        next: response => {
          console.log('Respuesta:', response);
        },
        error: err => {
          console.error(err);
        }
      }
    )
  }

  ngOnDestroy(): void {
    this.ngDestroy$.next();
    this.ngDestroy$.complete();
  }

}
