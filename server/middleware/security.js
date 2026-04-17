const crypto = require('crypto');

function requestId(req, res, next) {
    const inboundId = req.headers['x-request-id'];
    const reqId = typeof inboundId === 'string' && inboundId.trim()
        ? inboundId.trim()
        : (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    req.requestId = reqId;
    res.setHeader('X-Request-Id', reqId);
    next();
}

function securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
}

module.exports = { requestId, securityHeaders };
