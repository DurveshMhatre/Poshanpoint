const mongoose = require('mongoose');

const staffAccountSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
    },
    role: {
        type: String,
        enum: ['admin', 'staff'],
        required: true,
        index: true,
    },
    passwordSalt: { type: String, required: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('StaffAccount', staffAccountSchema);
