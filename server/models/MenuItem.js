const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    badge: { type: String, default: '' },
    basePrice: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    bases: [{
        name: { type: String, required: true },
        price: { type: Number, default: 0 }
    }],
    liquids: [{
        name: { type: String, required: true },
        price: { type: Number, default: 0 }
    }],
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
