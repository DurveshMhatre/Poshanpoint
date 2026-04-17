const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, default: null, index: true },
    razorpaySignature: { type: String, default: null },
    receipt: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['created', 'paid', 'failed', 'refunded'],
        default: 'created'
    },
    verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
