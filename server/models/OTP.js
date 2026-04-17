const mongoose = require('mongoose');
const crypto = require('crypto');

const otpSchema = new mongoose.Schema({
    phone: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL auto-delete
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Hash OTP before storing
otpSchema.statics.createOTP = async function (phone) {
    // Delete any existing OTP for this phone
    await this.deleteMany({ phone });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash it
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store with 5-minute expiry
    await this.create({
        phone,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    return otp;
};

// Verify OTP
otpSchema.statics.verifyOTP = async function (phone, otp) {
    const record = await this.findOne({ phone });
    if (!record) return { valid: false, reason: 'No OTP found. Please request a new one.' };
    if (record.expiresAt < new Date()) return { valid: false, reason: 'OTP expired. Please request a new one.' };
    if (record.attempts >= 3) return { valid: false, reason: 'Too many attempts. Please request a new OTP.' };

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== record.otpHash) {
        record.attempts += 1;
        await record.save();
        return { valid: false, reason: 'Invalid OTP. Please try again.' };
    }

    // Valid — delete OTP record
    await this.deleteOne({ _id: record._id });
    return { valid: true };
};

module.exports = mongoose.model('OTP', otpSchema);
