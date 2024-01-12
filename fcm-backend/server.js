const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const FCM_API_PORT = process.env.FCM_API_PORT || 10001;
const FCM_APP_ID = process.env.FCM_APP_ID || 'fcm-test-client';

const validateApplicationHeader = (req, res, next) => {
    const applicationHeaderValue = req.get('application');

    if (applicationHeaderValue === FCM_APP_ID) {
        next();
    } else {
        res.status(403).json({ error: 'Aplicación no válida' });
    }
};


// Configuración CORS
app.use(cors());

// Endpoint para obtener la configuración
app.get('/firebase-config', validateApplicationHeader, (req, res) => {
    try {
        const configFile = fs.readFileSync('firebase.config.json');
        const config = JSON.parse(configFile);
        res.json(config);
    } catch (error) {
        console.error('Error al leer el archivo de configuración:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Iniciar el servidor
app.listen(FCM_API_PORT, () => {
    console.log(`Servidor Express corriendo en http://localhost:${FCM_API_PORT}`);
});