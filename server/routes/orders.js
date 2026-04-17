const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const { optionalAuth, requireStaffOrAdmin } = require('../middleware/auth');
const {
    sanitizePhone,
    sanitizeText,
    toMoney,
    normalizeOrderItems,
} = require('../utils/validation');

router.post('/', optionalAuth, async (req, res) => {
    try {
        const customerName = sanitizeText(req.body?.customerName, 80);
        const phone = sanitizePhone(req.body?.phone);
        const orderType = req.body?.orderType === 'pickup' ? 'pickup' : 'counter';
        const note = sanitizeText(req.body?.note, 500);
        const disclaimerAccepted = Boolean(req.body?.disclaimerAccepted);
        const razorpayOrderId = sanitizeText(req.body?.razorpayOrderId || '', 100);
        const razorpayPaymentId = sanitizeText(req.body?.razorpayPaymentId || '', 100);
        const totalAmount = toMoney(req.body?.totalAmount);

        if (!disclaimerAccepted) {
            return res.status(400).json({ success: false, message: 'Disclaimer must be accepted' });
        }
        if (!customerName) {
            return res.status(400).json({ success: false, message: 'Customer name is required' });
        }
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Valid phone number is required' });
        }
        if (!razorpayOrderId || !razorpayPaymentId) {
            return res.status(400).json({ success: false, message: 'Payment details are required' });
        }
        if (totalAmount === null || totalAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid total amount' });
        }

        const itemValidation = normalizeOrderItems(req.body?.items);
        if (!itemValidation.valid) {
            return res.status(400).json({ success: false, message: itemValidation.message });
        }

        if (Math.abs(itemValidation.total - totalAmount) > 0.01) {
            return res.status(400).json({
                success: false,
                message: 'Order total mismatch. Please refresh and try again.',
            });
        }

        const payment = await Payment.findOne({
            razorpayOrderId,
            razorpayPaymentId,
            status: 'paid',
            verified: true,
        });

        if (!payment) {
            return res.status(400).json({
                success: false,
                message: 'Payment is not verified for this order',
            });
        }

        if (Math.abs(payment.amount - totalAmount) > 0.01) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount mismatch',
            });
        }

        const existingOrder = await Order.findOne({ razorpayPaymentId });
        if (existingOrder) {
            return res.status(409).json({
                success: false,
                message: 'Order already created for this payment',
                data: { orderId: existingOrder.orderId },
            });
        }

        const order = new Order({
            customerName,
            phone,
            orderType,
            note,
            items: itemValidation.items,
            totalAmount,
            razorpayOrderId,
            razorpayPaymentId,
            paymentStatus: 'paid',
            status: 'confirmed',
            disclaimerAccepted,
            customerId: req.customer ? req.customer._id : null,
            statusLog: [{ status: 'confirmed', timestamp: new Date() }],
        });

        await order.save();

        payment.order = order._id;
        await payment.save();

        if (req.customer) {
            try {
                const customer = await Customer.findById(req.customer._id);
                if (customer) {
                    const pointsEarned = customer.awardPoints(totalAmount, order.orderId);
                    await customer.save();
                    order._doc.pointsEarned = pointsEarned;
                }
            } catch (loyaltyErr) {
                console.error(`[${req.requestId}] loyalty points error`, loyaltyErr);
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.to('staff').emit('new-order', order);
            io.to(`order-${order.orderId}`).emit('order-status-update', {
                orderId: order.orderId,
                _id: order._id,
                status: order.status,
            });
        }

        return res.status(201).json({ success: true, data: order });
    } catch (error) {
        console.error(`[${req.requestId}] create-order error`, error);
        return res.status(500).json({ success: false, message: 'Failed to create order' });
    }
});

router.get('/', requireStaffOrAdmin, async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.date) {
            const date = new Date(req.query.date);
            if (!Number.isNaN(date.getTime())) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                filter.createdAt = { $gte: start, $lte: end };
            }
        }

        const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
        const orders = await Order.find(filter).sort('-createdAt').limit(limit);
        return res.json({ success: true, data: orders });
    } catch (error) {
        console.error(`[${req.requestId}] list-orders error`, error);
        return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

router.get('/:orderId', async (req, res) => {
    try {
        const orderId = sanitizeText(req.params.orderId || '', 40);
        const order = await Order.findOne({ orderId });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        return res.json({ success: true, data: order });
    } catch (error) {
        console.error(`[${req.requestId}] get-order error`, error);
        return res.status(500).json({ success: false, message: 'Failed to fetch order' });
    }
});

router.patch('/:id/status', requireStaffOrAdmin, async (req, res) => {
    try {
        const status = sanitizeText(req.body?.status || '', 20);
        const validStatuses = ['confirmed', 'preparing', 'ready', 'served', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        order.status = status;
        order.statusLog.push({ status, timestamp: new Date() });
        await order.save();

        const io = req.app.get('io');
        if (io) {
            const payload = { orderId: order.orderId, status, _id: order._id };
            io.to('staff').emit('order-status-update', payload);
            io.to(`order-${order.orderId}`).emit('order-status-update', payload);
        }

        return res.json({ success: true, data: order });
    } catch (error) {
        console.error(`[${req.requestId}] update-order-status error`, error);
        return res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
});

module.exports = router;
