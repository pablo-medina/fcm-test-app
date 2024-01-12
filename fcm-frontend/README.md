# Frontend

## Configuración
- Modificar la propiedad "firebaseConfig" de environment.ts para que tenga la configuración provista por la Consola de Firebase.
- Hacer lo mismo con la constante "firebaseConfig" del service worker "firebase-messaging-sw.js"

## Ejecución
Usar ```yarn prod``` para levantar la aplicación sobre un servidor ***http-server***.
El puerto por defecto es 10000, para cambiar la configuración, modificar el script "prod" en el package.json, para que el parámetro "-p" tenga el puerto que se quiera utilizar.

