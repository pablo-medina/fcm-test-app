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
const HttpsProxyAgent = require('https-proxy-agent');
const fetch = require('node-fetch');
const { readFileSync } = require('fs');

const PROXY_ENV_VAR = 'HTTP_PROXY';
const DEFAULT_TOKEN_EXPIRATION_SECONDS = 3600;

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
    _accessToken = undefined;
    _tokenExpirationTime = undefined;

    constructor(serviceAccountKeyPath) {
        this._serviceAccountKeyPath = serviceAccountKeyPath;
        this._serviceAccountKey = JSON.parse(readFileSync(serviceAccountKeyPath));
    }

    async init() {
        this._proxyAgent = getProxyAgent();
        // Precargar un token, no es necesario, pero evita el lazy load y ayuda a verificar errores al iniciar el servidor
        this._authToken = await this._getAccessToken();
    }

    async sendNotification({ token, title, body, image }) {        
        let response = await this._doNotificationRequest({ token, title, body, image });
        let jsonResponse;        
        
        if (!response.ok) {
            if (response.status === 401) {
                console.warn('El servidor no autorizó la solicitud. Intentando nuevamente con nuevo token OAuth2...');
                await this._renewAccessToken();
                response = await this._doNotificationRequest({ token, title, body, image });
                if (!response.ok) {
                    throw new Error('El servidor volvió a rechazar la solicitud tras la renovación de token OAuth.');
                }
            } else {
                console.error(response);
                throw new Error('Se ha producido un error al intentar enviar el mensaje.');
            }
        }

        // Respuesta OK
        jsonResponse = await response.json();

        return jsonResponse;
    }

    async _doNotificationRequest({ token, title, body, image }) {
        if (!this._serviceAccountKey) {
            throw new Error('Service Account Key no inicializada correctamente.');
        }
        const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${this._serviceAccountKey.project_id}/messages:send`;

        // Obtener token OAuth2
        const currentAccessToken = await this._getAccessToken();

        // Crea el mensaje de la notificación    
        const payload = {
            message: {
                "token": token,
                "notification": {
                    title,
                    body,
                    image
                }
            }
        };

        const payloadJSON = JSON.stringify(payload);
        console.debug('Mensaje enviado a FCM:', payloadJSON);

        // Envía la notificación mediante node-fetch
        return fetch(fcmEndpoint, {
            method: 'POST',
            body: payloadJSON,
            headers: {
                Authorization: `Bearer ${currentAccessToken}`
            },
            agent: this._proxyAgent
        });
    }

    async _renewAccessToken() {
        // Obtener autenticación OAuth2 para usar FCM
        const auth = new GoogleAuth({
            keyFile: this._serviceAccountKeyPath,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging']
        });

        try {
            // Obtener token de acceso
            const client = await auth.getClient();
            const tokenInfo = await client.getAccessToken();

            let expires_in;
            if (tokenInfo.res && tokenInfo.res.data && tokenInfo.res.data.expires_in) {
                expires_in = tokenInfo.res.data.expires_in;
            } else {
                expires_in = DEFAULT_TOKEN_EXPIRATION_SECONDS;
                console.warn(`El servidor OAuth no indicó la duración del token, se asume ${DEFAULT_TOKEN_EXPIRATION_SECONDS} segundos.`);
            }

            const tokenExpirationTime = Date.now() + (expires_in - 300) * 1000;

            this._accessToken = tokenInfo.token;
            this._tokenExpirationTime = tokenExpirationTime;

            console.debug('Nuevo token obtenido. Válido hasta:', new Date(tokenExpirationTime));

            return this._accessToken;
        } catch (error) {
            throw new Error('Error al realizar autenticación OAuth2');
        }
    }

    async _getAccessToken() {
        // Si aún no tenemos token, o el mismo está vencido, solicitar un nuevo token
        if (!this._accessToken || this._tokenExpirationTime < Date.now()) {
            console.log('Solicitando token OAuth2...');
            const renewedToken = await this._renewAccessToken();
            return renewedToken;
        }

        // Si ya tenemos un token y no está vencido, devolver el token actual
        return this._accessToken;
    }
}

module.exports = FCMClient;