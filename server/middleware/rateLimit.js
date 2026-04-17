function getClientIp(req) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
        return xff.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
}

function createRateLimiter({
    windowMs = 60 * 1000,
    max = 100,
    keyGenerator = (req) => getClientIp(req),
    message = 'Too many requests, please try again later.',
} = {}) {
    const buckets = new Map();

    return function rateLimiter(req, res, next) {
        const now = Date.now();
        const key = keyGenerator(req);
        const bucket = buckets.get(key);

        if (!bucket || now - bucket.windowStart >= windowMs) {
            buckets.set(key, { count: 1, windowStart: now });
            res.setHeader('X-RateLimit-Limit', String(max));
            res.setHeader('X-RateLimit-Remaining', String(max - 1));
            return next();
        }

        bucket.count += 1;
        buckets.set(key, bucket);

        const remaining = Math.max(0, max - bucket.count);
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(remaining));

        if (bucket.count > max) {
            return res.status(429).json({
                success: false,
                message,
                retryAfterMs: Math.max(0, windowMs - (now - bucket.windowStart)),
            });
        }

        if (buckets.size > 20000) {
            for (const [bucketKey, bucketValue] of buckets.entries()) {
                if (now - bucketValue.windowStart >= windowMs) {
                    buckets.delete(bucketKey);
                }
            }
        }

        return next();
    };
}

module.exports = { createRateLimiter, getClientIp };
