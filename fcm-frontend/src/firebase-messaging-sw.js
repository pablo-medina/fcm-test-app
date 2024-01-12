importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    // TODO: Copiar de environment.ts - firebaseConfig    
};

if (!firebaseConfig.apiKey) {
    throw new Error('Firebase no configurado. Revisar configuración en firebase-messasing-sw.js');
}

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log("Received background message ", payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

/*
fetch('https://jsonplaceholder.typicode.com/todos/1')
      .then(response => response.json())
      .then(json => console.log(json));
*/
    