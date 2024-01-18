const ServerConfig = {
    fcm: {
        appId: process.env.FCM_APP_ID || 'fcm-test-client',
        apiPort: process.env.FCM_API_PORT || 10001
    },
    clientConfigPath: 'firebase.config.json',
    serviceAccountKeyPath: 'serviceAccountKey.json',
    vapidKeyPath: 'vapidKey.json'
}

export default ServerConfig;
