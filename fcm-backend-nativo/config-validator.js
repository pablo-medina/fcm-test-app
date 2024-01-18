import { accessSync, constants } from 'fs';
import chalk from 'chalk';
import ServerConfig from './config.js';

const fileExists = filePath => {
    try {
        accessSync(filePath, constants.F_OK);
        return true;
    } catch (_err) {
        return false;
    }
}

const validateOrExit = () => {
    const errors = [];

    if (!fileExists(ServerConfig.clientConfigPath)) {
        errors.push(`No se pudo abrir el archivo de configuración de API de Firebase (${chalk.yellowBright(ServerConfig.clientConfigPath)}).`);
    }

    if (!fileExists(ServerConfig.serviceAccountKeyPath)) {
        errors.push(`No se pudo abrir el archivo de configuración de clave de Cuenta de Servicio de Firebase (${chalk.yellowBright(ServerConfig.serviceAccountKeyPath)}).`);
    }

    if (!fileExists(ServerConfig.vapidKeyPath)) {
        errors.push(`No se pudo abrir el archivo de configuración de clave VAPID (${chalk.yellowBright(ServerConfig.vapidKeyPath)}).`);
    }

    if (errors.length > 0) {
        errors.forEach(error => { console.error(chalk.redBright(error)) });
        console.log(chalk.whiteBright('Verifique que los archivos estén incluidos tal como se describe en la documentación e intente nuevamente.'));
        process.exit(1);
    }
}

export {
    validateOrExit
}

