const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    categoryName: { type: String, default: '' },
    recipeType: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true },
    selectedBase: { name: String, price: { type: Number, default: 0 } },
    selectedLiquid: { name: String, price: { type: Number, default: 0 } },
    selectedAddOns: [{
        name: String,
        price: { type: Number, default: 0 }
    }],
    itemTotal: { type: Number, required: true },
});

const statusLogSchema = new mongoose.Schema({
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    orderType: { type: String, enum: ['pickup', 'counter'], default: 'counter' },
    note: { type: String, default: '' },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    statusLog: [statusLogSchema],
    disclaimerAccepted: { type: Boolean, required: true, default: false },
}, { timestamps: true });

// Generate unique order ID
orderSchema.pre('save', function (next) {
    if (!this.orderId) {
        const prefix = 'PP';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        this.orderId = `${prefix}-${timestamp}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
