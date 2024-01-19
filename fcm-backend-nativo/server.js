import express from 'express';
import { readFileSync } from 'fs';
import cors from 'cors';
import FCMClient from './lib/fcm-client.js';
import * as ConfigValidator from './config-validator.js';
import chalk from 'chalk';
import ServerConfig from './config.js';

// Validar configuración. Si hay al menos algún error, mostrar los mensajes y salir con código de error 1.
ConfigValidator.validateOrExit();

const llamarFuncion = (fn, delay) => {
    if (delay > 0) {
        setTimeout(fn, delay);
    } else {
        fn();
    }
}

const validateApplicationHeader = (req, res, next) => {
    const applicationHeaderValue = req.get('application');

    if (applicationHeaderValue === ServerConfig.fcm.appId) {
        next();
    } else {
        res.status(403).json({ error: 'Aplicación no válida' });
    }
};

async function main() {
    console.log('Cargando configuración...');
    const fcmClient = new FCMClient(ServerConfig.serviceAccountKeyPath);
    await fcmClient.inicializar();

    console.log('Inicialiando servidor...');
    const app = express();

    // Configuración CORS
    app.use(cors());
    app.use(express.json());

    // Endpoint para obtener la configuración
    app.get('/firebase-config', validateApplicationHeader, (req, res) => {
        try {
            const configFile = readFileSync(ServerConfig.clientConfigPath);
            const vapidKeyFile = readFileSync(ServerConfig.vapidKeyPath);
            const configJSON = JSON.parse(configFile);
            const vapidKeyJSON = JSON.parse(vapidKeyFile);
            const response = Object.assign(configJSON, vapidKeyJSON);
            console.log('Configuración: ', response);
            res.json(response);
        } catch (error) {
            console.error('Error al leer el archivo de configuración:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // Endpoint para enviar mensajes
    app.post('/send-message', validateApplicationHeader, (req, res) => {
        const { titulo, texto, imagen, token, delay } = req.body;
        console.log('send-message: ', JSON.stringify(req.body));

        let _delay = parseInt(delay, 10) || 0;
        llamarFuncion(() => {
            try {
                fcmClient.enviarMensaje({ token, titulo, mensaje: texto, imagen })
                    .then(response => {
                        console.log('Mensaje recibido de FCM:', response);
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
        }, _delay);
    });


    // Iniciar el servidor
    app.listen(ServerConfig.fcm.apiPort, () => {
        const address = `http://localhost:${ServerConfig.fcm.apiPort}`;
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
