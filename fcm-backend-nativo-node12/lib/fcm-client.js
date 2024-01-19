/**
 * 
 * Cliente Firebase Cloud Messaging
 * 
 * Este cliente se comunica con Firebase utilizando google-auth-library + node-fetch en lugar de usar firebase-admin.
 * Esta versión puede ser útil en algunos entornos en los que puede haber restricciones de proxy que impidan completar la autenticación
 * OAuth correctamente.
 * 
 * Autor: Pablo Medina
 * 
 */
const { GoogleAuth } = require('google-auth-library');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fetch = require('node-fetch');
const { readFileSync } = require('fs');

const PROXY_ENV_VAR = 'HTTP_PROXY';

const getProxyAgent = () => {
    // Inicializar proxy-agent en caso de ser necesario
    const PROXY_URL = process.env[PROXY_ENV_VAR] || '';
    if (PROXY_URL && PROXY_URL.trim().length > 0) {
        console.log('Configuración de proxy detectada.');
        return new HttpsProxyAgent(PROXY_URL);
    } else {
        console.log('Configuración de proxy no detectada.');
        return undefined;
    }
}

class FCMClient {
    _serviceAccountKey = undefined;
    _serviceAccountKeyPath = undefined;
    _proxyAgent = undefined;
    _authToken = undefined;

    constructor(serviceAccountKeyPath) {
        this._serviceAccountKeyPath = serviceAccountKeyPath;
        this._serviceAccountKey = JSON.parse(readFileSync(serviceAccountKeyPath));
    }

    async inicializar() {
        this._proxyAgent = getProxyAgent();
        this._authToken = await this._getAuthToken();
    }

    async enviarMensaje({ token, titulo, mensaje, imagen }) {
        if (!this._serviceAccountKey) {
            throw new Error('Service Account Key no inicializada correctamente.');
        }
        const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${this._serviceAccountKey.project_id}/messages:send`;

        // Crea el mensaje de la notificación    
        const payload = {
            message: {
                "token": token,
                "notification": {
                    "title": titulo,
                    "body": mensaje,
                    "image": imagen
                }
            }
        };

        // Envía la notificación mediante Axios
        const response = await fetch(fcmEndpoint, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${this._authToken}`
            },
            agent: this._proxyAgent
        });
        const data = await response.json();
        console.debug('Respuesta:', data);
        return data;
    }

    async _getAuthToken() {
        // Obtener autenticación OAuth2 para usar FCM
        const auth = new GoogleAuth({
            keyFile: this._serviceAccountKeyPath,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging']
        });

        try {
            // Obtiene el token de acceso
            const client = await auth.getClient();
            const token = await client.getAccessToken();
            return token.token;
        } catch (error) {
            throw new Error('Error al autenticar:', error.message);
        }
    }
}

module.exports = FCMClient;