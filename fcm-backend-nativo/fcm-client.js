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
import { GoogleAuth } from 'google-auth-library';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';

const PROXY_ENV_VAR = 'HTTP_PROXY';
const SERVICE_ACCOUNT_KEY_FILENAME = './serviceAccountKey.json';

const getProxyAgent = () => {
    // Inicializar proxy-agent en caso de ser necesario
    const PROXY_URL = process.env[PROXY_ENV_VAR] || '';
    if (PROXY_URL && PROXY_URL.trim().length > 0) {
        console.log('Configuración de proxy detectada.');
        return new HttpsProxyAgent(PROXY_URL);
    } else {
        console.warn(`NOTA: No se va a usar configuración de proxy. En caso de necesitarla, setear la variable de entorno ${PROXY_ENV_VAR} con "http://<usuario>:<password>@<url_proxy>:<puerto_proxy>.`);
        return undefined;
    }
}

const getAuthToken = async () => {
    // Obtener autenticación OAuth2 para usar FCM
    const auth = new GoogleAuth({
        keyFile: SERVICE_ACCOUNT_KEY_FILENAME,
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

class FCMClient {
    _serviceAccountKey = undefined;
    _proxyAgent = undefined;
    _authToken = undefined;

    constructor(serviceAccountKeyPath) {
        this._serviceAccountKey = JSON.parse(readFileSync(serviceAccountKeyPath));
    }

    async inicializar() {
        this._proxyAgent = getProxyAgent();
        this._authToken = await getAuthToken();
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
}

export default FCMClient;