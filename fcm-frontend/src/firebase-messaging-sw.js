importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

self.addEventListener('activate', (event) => {
    console.log('Activando SW...');
    const channel = new BroadcastChannel('app-channel');
    channel.postMessage({action: 'get-firebase-config'});

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
        }

        // Indica que el Service Worker está activo
        return self.clients.claim();
    })
});
