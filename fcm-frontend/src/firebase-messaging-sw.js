importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const CONFIG_API_URL = 'http://localhost:10001/firebase-config';

const requestOptions = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'application': 'fcm-test-client'
    }
}

fetch(CONFIG_API_URL, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`)
        }
        return response.json();
    })
    .then(firebaseConfig => {
        console.debug('Configuración de firebase: [SW]', firebaseConfig);
        firebase.initializeApp(firebaseConfig);

        const messaging = firebase.messaging();

        messaging.onBackgroundMessage(function (payload) {
            console.log("Mensaje recibido: ", payload);

            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });

    });
