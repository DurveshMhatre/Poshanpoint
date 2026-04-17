const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const { toMoney } = require('../utils/validation');

router.post('/create-order', async (req, res) => {
    try {
        const amount = toMoney(req.body?.amount);
        if (amount === null || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ success: false, message: 'Payment gateway not configured' });
        }

        const receipt = `pp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt,
        };

        const order = await razorpay.orders.create(options);

        await Payment.create({
            razorpayOrderId: order.id,
            amount,
            currency: order.currency || 'INR',
            receipt,
            status: 'created',
            verified: false,
        });

        return res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID,
            }
        });
    } catch (error) {
        console.error(`[${req.requestId}] Razorpay order creation error`, error);
        return res.status(500).json({
            success: false,
            message: 'Payment initiation failed',
        });
    }
});

router.post('/verify', async (req, res) => {
    try {
        const razorpayOrderId = String(req.body?.razorpay_order_id || '').trim();
        const razorpayPaymentId = String(req.body?.razorpay_payment_id || '').trim();
        const razorpaySignature = String(req.body?.razorpay_signature || '').trim();

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
        }

        const body = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(body)
            .digest('hex');

        const isAuthentic = expectedSignature === razorpaySignature;
        const payment = await Payment.findOne({ razorpayOrderId });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment order not found' });
        }

        if (!isAuthentic) {
            payment.status = 'failed';
            payment.verified = false;
            payment.razorpayPaymentId = razorpayPaymentId;
            payment.razorpaySignature = razorpaySignature;
            await payment.save();
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        payment.status = 'paid';
        payment.verified = true;
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        await payment.save();

        return res.json({
            success: true,
            data: {
                razorpayOrderId,
                razorpayPaymentId,
                verified: true,
            }
        });
    } catch (error) {
        console.error(`[${req.requestId}] payment verification error`, error);
        return res.status(500).json({ success: false, message: 'Payment verification error' });
    }
});

module.exports = router;
