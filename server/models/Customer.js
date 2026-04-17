const mongoose = require('mongoose');

const savedBlendSchema = new mongoose.Schema({
    name: { type: String, required: true },
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    menuItemName: { type: String },
    basePrice: { type: Number },
    selectedBase: { name: String, price: { type: Number, default: 0 } },
    selectedLiquid: { name: String, price: { type: Number, default: 0 } },
    selectedAddOns: [{
        name: String,
        price: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now }
});

const preferencesSchema = new mongoose.Schema({
    defaultMilk: { type: String, default: '' },
    defaultSweetener: { type: String, default: '' },
    defaultAddOns: [{ type: String }],
}, { _id: false });

const subscriptionInfoSchema = new mongoose.Schema({
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    planName: { type: String },
    remaining: { type: Number, default: 0 },
    validUntil: { type: Date },
}, { _id: false });

const loyaltyTransactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['earned', 'redeemed'], required: true },
    points: { type: Number, required: true },
    orderId: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const customerSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    preferences: { type: preferencesSchema, default: () => ({}) },
    savedBlends: [savedBlendSchema],
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyHistory: [loyaltyTransactionSchema],
    subscription: { type: subscriptionInfoSchema, default: null },
    consentAccepted: { type: Boolean, default: false },
    consentDate: { type: Date },
    tags: [{ type: String }],
    lastOrderAt: { type: Date },
    orderCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

// Award loyalty points (1 point per ₹10 spent)
customerSchema.methods.awardPoints = function (orderAmount, orderId) {
    const points = Math.floor(orderAmount / 10);
    if (points > 0) {
        this.loyaltyPoints += points;
        this.loyaltyHistory.push({
            type: 'earned',
            points,
            orderId,
            description: `Earned from order #${orderId}`
        });
    }
    this.orderCount += 1;
    this.lastOrderAt = new Date();
    return points;
};

module.exports = mongoose.model('Customer', customerSchema);
