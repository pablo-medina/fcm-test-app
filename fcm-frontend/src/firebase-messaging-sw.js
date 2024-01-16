importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const channel = new BroadcastChannel('app-channel');
let ready = false;

self.addEventListener('activate', (event) => {
    console.log('Activando SW...');
    channel.postMessage({ action: 'get-firebase-config' });

    channel.addEventListener('message', (event) => {
        const message = event.data;
        if (message.action === 'firebase-config') {
            const firebaseConfig = message.value;
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

            ready = true;
            channel.addEventListener('message', (event) => {
                const message = event.data;
                if (message.action === 'status_request') {
                    broadcastStatus();
                }
            });
        }

        // Indica que el Service Worker está activo
        return self.clients.claim();
    })
});

const broadcastStatus = () => {
    channel.postMessage({ action: 'status', ready });
}
