import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

/*
import { getMessaging, getToken, provideMessaging } from '@angular/fire/messaging';
import { FirebaseAppModule, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
*/

let current_token = '';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), 
    /*
    importProvidersFrom(provideFirebaseApp(
      () => initializeApp(),
      () => getToken(getMessaging(initializeApp(firebaseConfig)), {vapidKey: ""})
        .then(token => {
          console.log('TOKEN:', token);
          current_token = token; 
        })
    )),
    importProvidersFrom(provideMessaging(
      () => getMessaging()
    )),
    */
        
    provideServiceWorker('ngsw-worker.js', {
        //enabled: !isDevMode(),
        enabled: true,
        registrationStrategy: 'registerWhenStable:30000'
    }),
  
    provideServiceWorker('firebase-messaging-sw.js', {
      //enabled: !isDevMode(),
      enabled: true,
      registrationStrategy: 'registerWhenStable:30000'
  })
  ]
};

export function getAppToken() {
  return current_token;
}

/**
 * importProvidersFrom(provideFirebaseApp(
      () => initializeApp(),
      () => getToken(getMessaging(initializeApp({
        "projectId": "push-notifiaction-angular",
        "appId": "1:326320868227:web:22e5ad886e8fb53470c4b6",
        "storageBucket": "push-notifiaction-angular.appspot.com",
        "apiKey": "AIzaSyCbiKpBmIYACS6QSjms4CjfFJ8Jld3Jf0U",
        "authDomain": "push-notifiaction-angular.firebaseapp.com",
        "messagingSenderId": "326320868227"
       }))),
    )),
    importProvidersFrom(provideMessaging(
      () => getMessaging()
    )),
 */
