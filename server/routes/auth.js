const router = require('express').Router();
const OTP = require('../models/OTP');
const Customer = require('../models/Customer');
const { generateToken, requireAuth, isAdminCustomer } = require('../middleware/auth');
const smsService = require('../services/sms');
const { createRateLimiter, getClientIp } = require('../middleware/rateLimit');
const { sanitizePhone, sanitizeText } = require('../utils/validation');

const otpLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: Number(process.env.OTP_RATE_LIMIT_MAX || 5),
    keyGenerator: (req) => sanitizePhone(req.body?.phone) || getClientIp(req),
    message: 'Too many OTP requests. Please wait before trying again.',
});

router.post('/send-otp', otpLimiter, async (req, res) => {
    try {
        const cleanPhone = sanitizePhone(req.body?.phone);
        if (!cleanPhone) {
            return res.status(400).json({ success: false, message: 'Valid phone number required' });
        }

        const otp = await OTP.createOTP(cleanPhone);

        try {
            await smsService.sendOTP(cleanPhone, otp);
        } catch (smsErr) {
            console.error(`[${req.requestId}] SMS send failed`, smsErr?.message);
            console.log(`Fallback OTP for ${cleanPhone}: ${otp}`);
        }

        const response = {
            success: true,
            message: 'OTP sent successfully',
        };

        if (!process.env.SMS_PROVIDER || process.env.SMS_PROVIDER === 'console') {
            response.devOtp = otp;
        }

        return res.json(response);
    } catch (error) {
        console.error(`[${req.requestId}] send-otp error`, error);
        return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const cleanPhone = sanitizePhone(req.body?.phone);
        const otp = sanitizeText(String(req.body?.otp || ''), 6);
        const consent = Boolean(req.body?.consent);

        if (!cleanPhone || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ success: false, message: 'Valid phone and 6-digit OTP required' });
        }

        const result = await OTP.verifyOTP(cleanPhone, otp);
        if (!result.valid) {
            return res.status(400).json({ success: false, message: result.reason });
        }

        let customer = await Customer.findOne({ phone: cleanPhone });
        let isNewCustomer = false;

        if (!customer) {
            customer = await Customer.create({
                phone: cleanPhone,
                consentAccepted: consent,
                consentDate: consent ? new Date() : null,
            });
            isNewCustomer = true;
        } else if (consent && !customer.consentAccepted) {
            customer.consentAccepted = true;
            customer.consentDate = new Date();
            await customer.save();
        }

        const token = generateToken(customer._id);

        return res.json({
            success: true,
            message: isNewCustomer ? 'Account created successfully!' : 'Welcome back!',
            data: {
                token,
                customer: {
                    id: customer._id,
                    phone: customer.phone,
                    name: customer.name,
                    email: customer.email,
                    loyaltyPoints: customer.loyaltyPoints,
                    orderCount: customer.orderCount,
                    preferences: customer.preferences,
                    isNewCustomer,
                    isAdmin: isAdminCustomer(customer),
                }
            }
        });
    } catch (error) {
        console.error(`[${req.requestId}] verify-otp error`, error);
        return res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer._id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        return res.json({
            success: true,
            data: {
                id: customer._id,
                phone: customer.phone,
                name: customer.name,
                email: customer.email,
                loyaltyPoints: customer.loyaltyPoints,
                orderCount: customer.orderCount,
                preferences: customer.preferences,
                savedBlends: customer.savedBlends.length,
                subscription: customer.subscription,
                tags: customer.tags,
                memberSince: customer.createdAt,
                isAdmin: isAdminCustomer(customer),
            }
        });
    } catch (error) {
        console.error(`[${req.requestId}] get-profile error`, error);
        return res.status(500).json({ success: false, message: 'Failed to get profile' });
    }
});

module.exports = router;
