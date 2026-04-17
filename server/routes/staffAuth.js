const router = require('express').Router();
const StaffAccount = require('../models/StaffAccount');
const { createRateLimiter, getClientIp } = require('../middleware/rateLimit');
const { generateStaffToken, requireStaffAuth } = require('../middleware/auth');
const { sanitizeText } = require('../utils/validation');
const { verifyPassword } = require('../utils/password');

function normalizeUsername(value) {
    const username = sanitizeText(String(value || ''), 40).toLowerCase();
    return /^[a-z0-9._-]{3,40}$/.test(username) ? username : '';
}

function toStaffProfile(staff) {
    return {
        id: staff._id,
        username: staff.username,
        name: staff.name,
        role: staff.role,
        isAdmin: staff.role === 'admin',
        isStaff: true,
        lastLoginAt: staff.lastLoginAt,
    };
}

const staffLoginLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: Number(process.env.STAFF_LOGIN_RATE_LIMIT_MAX || 10),
    keyGenerator: (req) => {
        const username = normalizeUsername(req.body?.username);
        return username || getClientIp(req);
    },
    message: 'Too many login attempts. Please wait and try again.',
});

router.post('/login', staffLoginLimiter, async (req, res) => {
    try {
        const username = normalizeUsername(req.body?.username);
        const password = String(req.body?.password || '');

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const staff = await StaffAccount.findOne({ username });
        if (!staff || !staff.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const validPassword = verifyPassword(password, staff.passwordSalt, staff.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        staff.lastLoginAt = new Date();
        await staff.save();

        const token = generateStaffToken(staff);
        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                customer: toStaffProfile(staff),
            },
        });
    } catch (error) {
        console.error(`[${req.requestId}] staff-login error`, error);
        return res.status(500).json({ success: false, message: 'Failed to login' });
    }
});

router.get('/me', requireStaffAuth, async (req, res) => {
    try {
        const freshStaff = await StaffAccount.findById(req.staff._id).select('-passwordHash -passwordSalt');
        if (!freshStaff || !freshStaff.isActive) {
            return res.status(401).json({ success: false, message: 'Account not found or inactive' });
        }
        return res.json({ success: true, data: toStaffProfile(freshStaff) });
    } catch (error) {
        console.error(`[${req.requestId}] staff-me error`, error);
        return res.status(500).json({ success: false, message: 'Failed to load staff profile' });
    }
});

module.exports = router;
