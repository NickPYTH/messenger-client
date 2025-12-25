// signaling-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

console.log('🚀 Сигнальный сервер запущен на ws://localhost:8080');

wss.on('connection', (ws) => {
    console.log('🔌 Новый клиент подключен');

    ws.on('message', (message) => {
        console.log('📨 Получено сообщение:', message.toString().slice(0, 100) + '...');

        // Просто ретранслируем всем остальным клиентам
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('🔌 Клиент отключен');
    });
});
