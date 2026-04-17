require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const setupSocket = require('./socket/orderSocket');
const errorHandler = require('./middleware/errorHandler');
const { requestId, securityHeaders } = require('./middleware/security');
const { createRateLimiter } = require('./middleware/rateLimit');

const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const staffAuthRoutes = require('./routes/staffAuth');
const customerRoutes = require('./routes/customers');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('CORS origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
};

const io = new Server(server, { cors: corsOptions });
app.set('io', io);
setupSocket(io);

app.use(requestId);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: process.env.API_BODY_LIMIT || '6mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.API_BODY_LIMIT || '6mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    message: 'Too many requests. Please retry shortly.',
});

app.use('/api', apiLimiter);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/staff-auth', staffAuthRoutes);
app.use('/api/customers', customerRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        env: process.env.NODE_ENV || 'development',
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found', requestId: req.requestId });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`PoshanPoint Server running on port ${PORT}`);
        console.log(`API: http://localhost:${PORT}/api`);
        console.log(`WebSocket: ws://localhost:${PORT}`);
        console.log(`Health: http://localhost:${PORT}/api/health`);
    });
});

function shutdown(signal) {
    console.log(`${signal} received, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
