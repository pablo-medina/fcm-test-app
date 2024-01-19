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
import { Notificacion } from './models/messaging.model';

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

  permitirNotificaciones = false;

  frmEnviarMensaje = new FormGroup(
    {
      titulo: new FormControl<string | null>('Título'),
      texto: new FormControl<string>('Mensaje de prueba', { validators: Validators.required }),
      imagen: new FormControl<string | null>('https://picsum.photos/200'),
      delay: new FormControl<number | null>(2500)
    }
  );

  constructor(private messagingService: MessagingService, private toastr: ToastrService) {
    this.loading = true;
    messagingService.ready$
      .pipe(
        takeUntil(this.ngDestroy$)
      ).subscribe(ready => {
        if (ready) {
          this.loading = false;
          console.debug('MessagingService: Service Worker listo.');
        }
      });

    messagingService.notificacion$
      .pipe(
        takeUntil(this.ngDestroy$)
      ).subscribe(notificacion => {
        this.showToast(notificacion);
      });

    Notification.requestPermission()
      .then(permission => {
        this.permitirNotificaciones = !!(permission === 'granted');
        if (this.permitirNotificaciones) {
          messagingService.inicializar();
        } else {
          this.loading = false;
        }
      });
  }

  private showToast(notificacion: Notificacion): void {
    const title = notificacion.titulo;
    const body = notificacion.mensaje;
    const imageUrl = notificacion.imagen;

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
    // Enviar mensaje
    const formValue = this.frmEnviarMensaje.value;

    this.messagingService.enviarMensaje(
      {
        titulo: formValue.titulo || '',
        texto: formValue.texto || '',
        imagen: formValue.imagen || '',
        delay: formValue.delay || undefined
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
    );
  }

  ngOnDestroy(): void {
    this.ngDestroy$.next();
    this.ngDestroy$.complete();
  }

}
