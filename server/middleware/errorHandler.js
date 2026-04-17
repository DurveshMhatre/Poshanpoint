const errorHandler = (err, req, res, next) => {
    const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
    const requestId = req.requestId || 'unknown';

    console.error(`[${requestId}] Server error`, {
        message: err?.message,
        stack: err?.stack,
        path: req.originalUrl,
        method: req.method,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const safeMessage = statusCode >= 500
        ? 'Internal server error'
        : (err?.message || 'Request failed');

    const payload = {
        success: false,
        message: safeMessage,
        requestId,
    };

    if (!isProd) {
        payload.debug = {
            originalMessage: err?.message,
            stack: err?.stack,
        };
    }

    return res.status(statusCode).json(payload);
};

module.exports = errorHandler;
