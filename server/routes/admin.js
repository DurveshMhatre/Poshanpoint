const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const AddOn = require('../models/AddOn');
const Order = require('../models/Order');
const { requireAdmin } = require('../middleware/auth');
const { sanitizeText, toMoney } = require('../utils/validation');

router.use(requireAdmin);

const ALLOWED_IMAGE_TYPES = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
]);

const MAX_IMAGE_BYTES = Number(process.env.MAX_UPLOAD_IMAGE_BYTES || 3 * 1024 * 1024);

function sanitizeFileName(value) {
    return sanitizeText(String(value || ''), 120).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function parseBoolean(value, fallback = undefined) {
    if (value === undefined) return fallback;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
}

function sanitizeCategoryPayload(body = {}, { forUpdate = false } = {}) {
    return {
        name: sanitizeText(body.name, 80),
        description: sanitizeText(body.description, 200),
        image: sanitizeText(body.image, 500),
        displayOrder: Number.isInteger(Number(body.displayOrder))
            ? Number(body.displayOrder)
            : (forUpdate ? undefined : 0),
        isActive: parseBoolean(body.isActive, forUpdate ? undefined : true),
    };
}

function sanitizeOption(option) {
    if (!option || typeof option !== 'object') return null;
    const name = sanitizeText(option.name, 50);
    const price = toMoney(option.price || 0);
    if (!name || price === null || price < 0) return null;
    return { name, price };
}

function sanitizeItemPayload(body = {}, { forUpdate = false } = {}) {
    const basePrice = toMoney(body.basePrice);
    const bases = Array.isArray(body.bases) ? body.bases.map(sanitizeOption).filter(Boolean) : [];
    const liquids = Array.isArray(body.liquids) ? body.liquids.map(sanitizeOption).filter(Boolean) : [];
    const image = body.image === undefined ? (forUpdate ? undefined : '') : sanitizeText(body.image, 500);

    return {
        name: sanitizeText(body.name, 120),
        description: sanitizeText(body.description, 400),
        image,
        badge: sanitizeText(body.badge, 40),
        basePrice,
        category: body.category || undefined,
        bases,
        liquids,
        isActive: parseBoolean(body.isActive, forUpdate ? undefined : true),
        isAvailable: parseBoolean(body.isAvailable, forUpdate ? undefined : true),
        displayOrder: Number.isInteger(Number(body.displayOrder))
            ? Number(body.displayOrder)
            : (forUpdate ? undefined : 0),
    };
}

function sanitizeAddonPayload(body = {}, { forUpdate = false } = {}) {
    const image = body.image === undefined ? (forUpdate ? undefined : '') : sanitizeText(body.image, 500);
    return {
        name: sanitizeText(body.name, 80),
        image,
        price: toMoney(body.price),
        category: sanitizeText(body.category, 40),
        isActive: parseBoolean(body.isActive, forUpdate ? undefined : true),
    };
}

function compactObject(input) {
    return Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
    );
}

router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort('displayOrder');
        return res.json({ success: true, data: categories });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const payload = compactObject(sanitizeCategoryPayload(req.body));
        if (!payload.name) return res.status(400).json({ success: false, message: 'Category name is required' });
        const category = new Category(payload);
        await category.save();
        return res.status(201).json({ success: true, data: category });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create category' });
    }
});

router.patch('/categories/:id', async (req, res) => {
    try {
        const payload = compactObject(sanitizeCategoryPayload(req.body, { forUpdate: true }));
        if (!payload.name) delete payload.name;
        const category = await Category.findByIdAndUpdate(req.params.id, payload, { new: true });
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        return res.json({ success: true, data: category });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update category' });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        return res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
});

router.get('/items', async (req, res) => {
    try {
        const items = await MenuItem.find().populate('category', 'name').sort('displayOrder');
        return res.json({ success: true, data: items });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch items' });
    }
});

router.post('/upload-image', async (req, res) => {
    try {
        const filename = sanitizeFileName(req.body?.filename || '');
        const mimeType = sanitizeText(req.body?.mimeType || '', 60).toLowerCase();
        const dataBase64 = String(req.body?.dataBase64 || '').trim();

        if (!filename || !mimeType || !dataBase64) {
            return res.status(400).json({ success: false, message: 'Image payload is required' });
        }

        const extension = ALLOWED_IMAGE_TYPES.get(mimeType);
        if (!extension) {
            return res.status(400).json({ success: false, message: 'Unsupported image type. Use JPG, PNG, or WEBP' });
        }

        const buffer = Buffer.from(dataBase64, 'base64');
        if (!buffer.length) {
            return res.status(400).json({ success: false, message: 'Invalid image data' });
        }
        if (buffer.length > MAX_IMAGE_BYTES) {
            return res.status(400).json({ success: false, message: `Image too large. Max ${Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)}MB` });
        }

        const uploadsDir = path.join(__dirname, '..', 'uploads', 'menu');
        await fs.mkdir(uploadsDir, { recursive: true });

        const random = crypto.randomBytes(6).toString('hex');
        const basename = filename.replace(/\.[^.]+$/, '').slice(0, 50) || 'menu-image';
        const finalName = `${Date.now()}-${random}-${basename}.${extension}`;
        const filePath = path.join(uploadsDir, finalName);

        await fs.writeFile(filePath, buffer);

        const serverBase = process.env.PUBLIC_SERVER_URL || `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${serverBase}/uploads/menu/${finalName}`;

        return res.status(201).json({
            success: true,
            data: {
                imageUrl,
                fileName: finalName,
                size: buffer.length,
                mimeType,
            },
        });
    } catch (error) {
        console.error(`[${req.requestId}] admin-upload-image error`, error);
        return res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
});

router.post('/items', async (req, res) => {
    try {
        const payload = compactObject(sanitizeItemPayload(req.body));
        if (!payload.name) return res.status(400).json({ success: false, message: 'Item name is required' });
        if (!payload.image) return res.status(400).json({ success: false, message: 'Item image is required' });
        if (payload.basePrice === null || payload.basePrice < 0) {
            return res.status(400).json({ success: false, message: 'Valid base price is required' });
        }
        if (!payload.category) return res.status(400).json({ success: false, message: 'Category is required' });

        const item = new MenuItem(payload);
        await item.save();
        return res.status(201).json({ success: true, data: item });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create item' });
    }
});

router.patch('/items/:id', async (req, res) => {
    try {
        const payload = compactObject(sanitizeItemPayload(req.body, { forUpdate: true }));
        if (!payload.name) delete payload.name;
        if (payload.basePrice === null) delete payload.basePrice;
        if (!payload.category) delete payload.category;

        const item = await MenuItem.findByIdAndUpdate(req.params.id, payload, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        return res.json({ success: true, data: item });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update item' });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        return res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete item' });
    }
});

router.get('/addons', async (req, res) => {
    try {
        const addons = await AddOn.find();
        return res.json({ success: true, data: addons });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch add-ons' });
    }
});

router.post('/addons', async (req, res) => {
    try {
        const payload = compactObject(sanitizeAddonPayload(req.body));
        if (!payload.name) return res.status(400).json({ success: false, message: 'Add-on name is required' });
        if (!payload.image) return res.status(400).json({ success: false, message: 'Add-on image is required' });
        if (payload.price === null || payload.price < 0) {
            return res.status(400).json({ success: false, message: 'Valid price is required' });
        }
        const addon = new AddOn(payload);
        await addon.save();
        return res.status(201).json({ success: true, data: addon });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create add-on' });
    }
});

router.patch('/addons/:id', async (req, res) => {
    try {
        const payload = compactObject(sanitizeAddonPayload(req.body, { forUpdate: true }));
        if (!payload.name) delete payload.name;
        if (payload.price === null) delete payload.price;
        if (!payload.category) delete payload.category;

        const addon = await AddOn.findByIdAndUpdate(req.params.id, payload, { new: true });
        if (!addon) return res.status(404).json({ success: false, message: 'Add-on not found' });
        return res.json({ success: true, data: addon });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update add-on' });
    }
});

router.delete('/addons/:id', async (req, res) => {
    try {
        const addon = await AddOn.findByIdAndDelete(req.params.id);
        if (!addon) return res.status(404).json({ success: false, message: 'Add-on not found' });
        return res.json({ success: true, message: 'Add-on deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete add-on' });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayOrders = await Order.find({
            createdAt: { $gte: today, $lt: tomorrow },
            paymentStatus: 'paid'
        });

        const totalRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = todayOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const statusBreakdown = {};
        for (const order of todayOrders) {
            statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
        }

        return res.json({
            success: true,
            data: {
                totalOrders,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                statusBreakdown
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

router.get('/export', async (req, res) => {
    try {
        const filter = { paymentStatus: 'paid' };
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        if (startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
            const endDateInclusive = new Date(endDate);
            endDateInclusive.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: startDate, $lte: endDateInclusive };
        }

        const orders = await Order.find(filter).sort('-createdAt');
        const csvRows = ['Order ID,Customer,Phone,Type,Items,Total,Status,Payment Status,Date'];

        for (const order of orders) {
            const itemNames = order.items.map((i) => `${i.name} x${i.quantity}`).join('; ');
            csvRows.push(
                `${order.orderId},"${order.customerName}",${order.phone},${order.orderType},"${itemNames}",${order.totalAmount},${order.status},${order.paymentStatus},${order.createdAt.toISOString()}`
            );
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
        return res.send(csvRows.join('\n'));
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to export orders' });
    }
});

module.exports = router;
