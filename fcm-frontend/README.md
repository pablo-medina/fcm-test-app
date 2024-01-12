# Frontend

## Configuración
Modificar el archivo environment.ts para que sea consistente con la configuración de backend.

### Configuración en environment.ts
|Variable|Descripción
|-|-
|apiUrl|Ubicación de la URL base del backend (por ejemplo: http://localhost:10001)
|appId|ID de aplicación enviada al backend. Debe coincidir con el ID esperado por el mismo. Revisar la documentación del mismo para más información.

## Ejecución
Usar ```yarn prod``` para levantar la aplicación sobre un servidor ***http-server***.
El puerto por defecto es 10000, para cambiar la configuración, modificar el script "prod" en el package.json, para que el parámetro "-p" tenga el puerto que se quiera utilizar.

