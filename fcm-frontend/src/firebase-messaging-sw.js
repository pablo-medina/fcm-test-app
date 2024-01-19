importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

/*
const channel = new BroadcastChannel('app-channel');
let ready = false;
*/

self.addEventListener('message', (event) => {
    const message = event.data;
    if (message.action === 'firebase-config') {
        const firebaseConfig = message.value;
        console.debug('Configuración de firebase: [SW]', firebaseConfig);
        firebase.initializeApp(firebaseConfig);

        const messaging = firebase.messaging();        

        messaging.onBackgroundMessage(function (payload) {
            console.log("[SW] Mensaje recibido: ", payload);

            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
    }
})

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());

    console.log('Activando SW. Clientes:', self.clients);

    // Enviar mensaje de activación usando clients.matchAll()
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ action: 'sw-active' });
        });
    });
});

const broadcastStatus = () => {
    channel.postMessage({ action: 'status', ready });
}
