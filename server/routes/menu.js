const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const AddOn = require('../models/AddOn');

// GET all active categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort('displayOrder');
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET all menu items (optionally filter by category)
router.get('/items', async (req, res) => {
    try {
        const filter = { isActive: true, isAvailable: true };
        if (req.query.category) {
            filter.category = req.query.category;
        }
        const items = await MenuItem.find(filter)
            .populate('category', 'name')
            .sort('displayOrder');
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single menu item
router.get('/items/:id', async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id).populate('category', 'name');
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET all active add-ons
router.get('/addons', async (req, res) => {
    try {
        const addons = await AddOn.find({ isActive: true });
        res.json({ success: true, data: addons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
