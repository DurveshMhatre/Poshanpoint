const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    itemCount: { type: Number, required: true },  // e.g., 20 smoothies
    price: { type: Number, required: true },       // e.g., ₹3999
    validityDays: { type: Number, required: true }, // e.g., 30 days
    isActive: { type: Boolean, default: true },
    category: { type: String, default: 'all' },    // 'all', 'smoothie', 'protein', etc.
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
