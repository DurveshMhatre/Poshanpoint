const router = require('express').Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');
const { sanitizeText } = require('../utils/validation');

// All routes require authentication
router.use(requireAuth);

// GET /api/customers/profile
router.get('/profile', async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer._id);
        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get profile' });
    }
});

// PATCH /api/customers/profile
router.patch('/profile', async (req, res) => {
    try {
        const { name, email, preferences } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (preferences) updates.preferences = preferences;

        const customer = await Customer.findByIdAndUpdate(
            req.customer._id,
            { $set: updates },
            { new: true }
        );

        res.json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// ==================== SAVED BLENDS ====================

// GET /api/customers/favorites
router.get('/favorites', async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer._id).select('savedBlends');
        res.json({ success: true, data: customer.savedBlends || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get favorites' });
    }
});

// POST /api/customers/favorites
router.post('/favorites', async (req, res) => {
    try {
        const {
            name,
            menuItem,
            menuItemName,
            basePrice,
            selectedBase,
            selectedLiquid,
            selectedAddOns
        } = req.body;

        const cleanName = sanitizeText(name, 80);

        if (!cleanName) {
            return res.status(400).json({ success: false, message: 'Blend name is required' });
        }

        const customer = await Customer.findById(req.customer._id);

        // Max 20 saved blends
        if (customer.savedBlends.length >= 20) {
            return res.status(400).json({ success: false, message: 'Maximum 20 saved blends reached' });
        }

        customer.savedBlends.push({
            name: cleanName,
            menuItem,
            menuItemName: sanitizeText(menuItemName, 120),
            basePrice,
            selectedBase,
            selectedLiquid,
            selectedAddOns,
        });

        await customer.save();
        res.json({ success: true, data: customer.savedBlends });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save blend' });
    }
});

// DELETE /api/customers/favorites/:id
router.delete('/favorites/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer._id);
        customer.savedBlends = customer.savedBlends.filter(
            b => b._id.toString() !== req.params.id
        );
        await customer.save();
        res.json({ success: true, data: customer.savedBlends });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove blend' });
    }
});

// ==================== ORDER HISTORY ====================

// GET /api/customers/orders
router.get('/orders', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find({ customerId: req.customer._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ customerId: req.customer._id })
        ]);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get order history' });
    }
});

// POST /api/customers/orders/:orderId/reorder — returns items for cart
router.post('/orders/:orderId/reorder', async (req, res) => {
    try {
        const orderId = sanitizeText(req.params.orderId, 40);
        const order = await Order.findOne({
            orderId,
            customerId: req.customer._id
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Return items formatted for cart
        const cartItems = order.items.map(item => ({
            menuItem: item.menuItem,
            name: item.name,
            basePrice: item.basePrice,
            quantity: item.quantity,
            selectedBase: item.selectedBase,
            selectedLiquid: item.selectedLiquid,
            selectedAddOns: item.selectedAddOns,
        }));

        res.json({ success: true, data: cartItems });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to prepare reorder' });
    }
});

// ==================== LOYALTY ====================

// GET /api/customers/loyalty
router.get('/loyalty', async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer._id)
            .select('loyaltyPoints loyaltyHistory');

        // Get recent 20 transactions
        const recentHistory = (customer.loyaltyHistory || [])
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 20);

        res.json({
            success: true,
            data: {
                points: customer.loyaltyPoints,
                history: recentHistory
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get loyalty info' });
    }
});

// ==================== SUBSCRIPTION (Phase-ready) ====================

// GET /api/customers/subscription
router.get('/subscription', async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer._id).select('subscription');
        res.json({ success: true, data: customer.subscription || null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get subscription' });
    }
});

module.exports = router;
