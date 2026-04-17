const { sanitizeText } = require('../utils/validation');

const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join-staff', () => {
            socket.join('staff');
            console.log(`Staff joined: ${socket.id}`);
        });

        socket.on('join-order', (orderId) => {
            const safeOrderId = sanitizeText(String(orderId || ''), 40);
            if (!safeOrderId) return;
            socket.join(`order-${safeOrderId}`);
            console.log(`Tracking room joined for order: ${safeOrderId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

module.exports = setupSocket;
