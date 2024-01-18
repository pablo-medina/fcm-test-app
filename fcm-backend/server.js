const express = require('express');
const fs = require('fs');
const cors = require('cors');
const admin = require('./firebase-admin');

const app = express();
// Configuración CORS
app.use(cors());
app.use(express.json());

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

app.post('/send-message', validateApplicationHeader, (req, res) => {
    const { titulo, texto, imagen, token } = req.body;
    console.log('send-message: ', JSON.stringify(req.body));
    try {
        const message = {
            notification: {
                title: titulo || '',
                body: texto || '',
                image: imagen // Lo dejo de referencia para saber que aqui se envian las URLs con las imágenes
            },
            token
        }

        admin.messaging().send(message)
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
})
app.post('/send-message-topic', validateApplicationHeader, (req, res) => {

    const { titulo, texto, imagen, topic } = req.body;
    // const condition =  '\'rojo\' in topics || \'amarillo\' in topics';
    console.log('send-messageee: ', JSON.stringify(req.body));
    try {
        const message = {
            notification: {
                title: `${titulo}.. From Topics`  || '',
                body: `${texto}` || '',
                image: imagen // Lo dejo de referencia para saber que aqui se envian las URLs con las imágenes
            },
            topic            
        }

        admin.messaging().send(message)
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
})
app.post('/subscribe-to-topic', validateApplicationHeader, (req, res) => {
    const { token, topic, status } = req.body;
   
    const registrationToken =token;
    const registerToTopic = topic;
    if(status == "true"){
     console.log('subscribing-to-topicTRUE: ', JSON.stringify(req.body));
     try{
      // Subscribe the devices corresponding to the registration tokens to the
      // topic.
        admin.messaging().subscribeToTopic(registrationToken, `/topics/${registerToTopic}`)
        .then((response) => {
          // See the MessagingTopicManagementResponse reference documentation
          // for the contents of response.
          console.log('Successfully subscribed to topic:', response);
          res.status(200).send(response)
        })
        .catch((error) => {
          console.log('Error subscribing to topic:', error);
        });
     }catch(error) {
        console.log('Error subscribing to topic:', error);
     }
    }else{
        console.log('subscribing-to-topicFALSE: ', JSON.stringify(req.body));
        try{
            // Subscribe the devices corresponding to the registration tokens to the
            // topic.
            admin.messaging().unsubscribeFromTopic(registrationToken, `/topics/${registerToTopic}`)
              .then((response) => {
                // See the MessagingTopicManagementResponse reference documentation
                // for the contents of response.
                console.log('Successfully Unsubscribed to topic:', response);
                res.status(200).send(response)
              })
              .catch((error) => {
                console.log('Error Unsubscribing to topic:', error);
              });
            }catch(error) {
              console.log('Error Unsubscribing to topics:', error);
            };
    }
      
})

// Iniciar el servidor
app.listen(FCM_API_PORT, () => {
    console.log(`Servidor Express corriendo en http://localhost:${FCM_API_PORT}`);
});