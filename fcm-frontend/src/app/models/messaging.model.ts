export interface FirebaseConfig {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
    vapidKey: string
}

export interface Notificacion {
    titulo?: string
    mensaje?: string
    imagen?: string
}
