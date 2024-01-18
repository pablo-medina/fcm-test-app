import express from 'express';
import { readFileSync } from 'fs';
import cors from 'cors';
import FCMClient from './fcm-client.js';
import chalk from 'chalk';

const FCM_API_PORT = process.env.FCM_API_PORT || 10001;
const FCM_APP_ID = process.env.FCM_APP_ID || 'fcm-test-client';
const CLIENT_CONFIG_FILENAME = 'firebase.config.json';
const SERVICE_ACCOUNT_KEY_FILENAME = './serviceAccountKey.json';

let clientConfigFile;

const errors = [];

try {
    clientConfigFile = readFileSync(CLIENT_CONFIG_FILENAME);
} catch (error) {
    errors.push(`No se pudo abrir el archivo de configuración de API de Firebase (${chalk.yellowBright(CLIENT_CONFIG_FILENAME)}).`);
}

try {
    clientConfigFile = readFileSync(SERVICE_ACCOUNT_KEY_FILENAME);
} catch (error) {
    errors.push(`No se pudo abrir el archivo de configuración de clave de Cuenta de Servicio de Firebase (${chalk.yellowBright(SERVICE_ACCOUNT_KEY_FILENAME)}).`);
}

if (errors.length > 0) {
    errors.forEach(error => { console.error(chalk.redBright(error)) });
    console.log(chalk.whiteBright('Verifique que los archivos estén incluidos tal como se describe en la documentación e intente nuevamente.'));
    process.exit(1);
}

const validateApplicationHeader = (req, res, next) => {
    const applicationHeaderValue = req.get('application');

    if (applicationHeaderValue === FCM_APP_ID) {
        next();
    } else {
        res.status(403).json({ error: 'Aplicación no válida' });
    }
};

async function main() {
    console.log('Cargando configuración...');
    const fcmClient = new FCMClient(SERVICE_ACCOUNT_KEY_FILENAME);
    await fcmClient.inicializar();

    console.log('Inicialiando servidor...');
    const app = express();

    // Configuración CORS
    app.use(cors());
    app.use(express.json());

    // Endpoint para obtener la configuración
    app.get('/firebase-config', validateApplicationHeader, (req, res) => {
        try {
            const configFile = readFileSync(CLIENT_CONFIG_FILENAME);
            const config = JSON.parse(configFile);
            res.json(config);
        } catch (error) {
            console.error('Error al leer el archivo de configuración:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // Endpoint para enviar mensajes
    app.post('/send-message', validateApplicationHeader, (req, res) => {
        const { titulo, texto, imagen, token } = req.body;
        console.log('send-message: ', JSON.stringify(req.body));
        try {
            fcmClient.enviarMensaje({ token, titulo, mensaje: texto, imagen })
                .then(response => {
                    console.log('Mensaje enviado:', response);
                    res.status(200).send({ success: true, mensaje: 'Mensaje enviado a FCM' });
                })
                .catch(error => {
                    console.error('Error al enviar el mensaje:', error);
                    res.status(500).send('Error al enviar mensaje a FCM');
                });
        } catch (error) {
            console.error('Error al intentar enviar un mensaje', error);
            res.status(500).send('Error al enviar mensaje a FCM');
        }
    });


    // Iniciar el servidor
    app.listen(FCM_API_PORT, () => {
        const address = `http://localhost:${FCM_API_PORT}`;
        console.log(`${chalk.yellow("Servidor de notificaciones corriendo en")} ${chalk.greenBright(address)}`);
    });
}

main().then(
    () => {
        console.log('Servidor inicializado.');
    }
).catch(err => {
    console.error(err);
});
