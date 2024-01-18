# Backend (versión nativa)

Provee la configuración de firebase para la aplicación cliente y permite enviar mensajes a través de su propia API.
Esta versión alternativa no utiliza firebase-admin para enviar los mensajes, sino que utiliza google-auth-library y node-fetch en su lugar.
La primer dependencia es para poder realizar la autenticación OAuth2 (que pasa a ser obligatorio a partir de Junio de 2024), y la segunda para realizar los HTTP Request.

El objetivo de esta versión es ofrecer una alternativa en aquellos entornos en los que, por restricciones de proxy, la versión con Firebase-Admin no pueda realizar la autenticación OAuth2 incluso aunque se especifique un HTTP Agent.

## Configuración
### API Key y datos de cliente
* Crear el archivo ***firebase.config.json*** en la carpeta raíz del proyecto y agregarle la configuración provista por la consola de Firebase.

#### Formato

```json
{
    "apiKey": "",
    "authDomain": "",
    "projectId": "",
    "storageBucket": "",
    "messagingSenderId": "",
    "appId": ""
}
```

### serviceAccountKey
* Crear el archivo ***serviceAccountKey.json*** y agregarle la información de Cuenta de Servicio provista desde la consola de Firebase. En caso de no tener una, utilizar la opción "Generar nueva clave privada" dentro de la consola. El archivo que descarga es la *serviceAccountKey*.

#### Formato

```json
{
  "type": "",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "",
  "token_uri": "",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": "",
  "universe_domain": ""
}
```

### vapidKey
* Crear el archivo ***vapidKey.json*** y agregarle la información de la clave VAPID provista desde la consola de Firebase (Cloud Messasing / Certificados Push Web).

#### Formato

```json
{
  "vapidKey": ""
}
```

### Configuración de Proxy
Para habilitar el proxy, solo es necesario definir la variable de entorno *HTTP_PROXY* de la siguiente manera:

#### Con usuario/password (en caso de ser necesario)
```
FCM_PROXY=http://<usuario>:<password>@<url_proxy>:<puerto_proxy>.
```
Ejemplo:
```
FCM_PROXY=http://pmedina:123456@proxy.dominioempresa.com:8080
```

#### Sin usuario/password
```
FCM_PROXY=http://proxy.<url_proxy>:<puerto>.
```

Ejemplo:
```
FCM_PROXY=http://proxy.dominioempresa.com:8080
```

### Variables de entorno

| Nombre       | Descripción                                                                                                      | Valor por defecto |
| ------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------- |
| FCM_APP_ID   | Nombre utilizado para validar la aplicación desde el header 'application' en el HTTP Request de la configuración | fcm-test-client   |
| FCM_API_PORT | Puerto donde va a estar escuchando el servidor                                                                   | 10001             |
| HTTP_PROXY   | Configuración del HTTP_Proxy. Para más información ver la sección [Configuración de Proxy][proxy-config]         | No definida       |

## Endpoints
### GET /firebase-config
Devuelve la configuración de firebase provista en el archivo firebase.config.json.
NOTA: Para que este endpoint responda correctamente, el archivo tiene que existir, tener una configuración JSON válida y además, el header 'application' del request debe contener el ID de aplicación indicado en FCM_APP_ID.

### POST /send-message
Envía el mensaje indicado a FCM.

#### Payload

```json
{
    "token": "",
    "titulo": "",
    "texto": "",
    "imagen": "",
    "delay": 0
}
```

#### Descripción de atributos del Payload

| Atributo | Tipo   | Descripción                                             | Valor por defecto |
| -------- | ------ | ------------------------------------------------------- | ----------------- |
| token    | string | Token FCM obtenido por el frontend                      | No definido       |
| titulo   | string | Título del mensaje                                      | Vacío             |
| texto    | string | Contenido prinicpal del mensaje                         | Vacío             |
| imagen   | string | URL a una imagen para incluir en el mensaje             | No definido       |
| delay    | number | Retraso (en milisegundos) para enviar el mensaje a FCM. | 0 (Inmediato)     |

## Scripts

```yarn dev``` para ejecutar el servidor en modo desarrollo (live reload via nodemon).
```yarn start``` para ejecutar el servidor en modo producción (sin nodemon).

[proxy-config]: #configuración-de-proxy