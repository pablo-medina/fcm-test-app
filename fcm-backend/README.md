# Backend

Provee la configuración de firebase para la aplicación cliente.

## Configuración
Crear el archivo ***firebase.config.json*** en la carpeta raíz del proyecto y agregarle la configuración provista por la consola de Firebase.

### Variables de entorno

| Nombre | Descripción | Valor por defecto
|-|-|-
|FCM_APP_ID|Nombre utilizado para validar la aplicación desde el header 'application' en el HTTP Request de la configuración|fcm-test-client
|FCM_API_PORT|Puerto donde va a estar escuchando el servidor|10001

## Endpoints
### GET /firebase-config
Devuelve la configuración de firebase provista en el archivo firebase.config.json.
NOTA: Para que este endpoint responda correctamente, el archivo tiene que existir, tener una configuración JSON válida y además, el header 'application' del request debe contener el ID de aplicación indicado en FCM_APP_ID.

## Scripts

```yarn dev``` para ejecutar el servidor en modo desarrollo (live reload via nodemon).
```yarn start``` para ejecutar el servidor en modo producción (sin nodemon).
