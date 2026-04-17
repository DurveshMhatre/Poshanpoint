const mongoose = require('mongoose');

const addOnSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'general' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('AddOn', addOnSchema);
