const crypto = require('crypto');

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function hashPassword(password, salt) {
    const finalSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
        .pbkdf2Sync(String(password), finalSalt, ITERATIONS, KEY_LENGTH, DIGEST)
        .toString('hex');
    return { salt: finalSalt, hash };
}

function verifyPassword(password, salt, expectedHash) {
    if (!salt || !expectedHash) return false;
    const { hash } = hashPassword(password, salt);
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function validatePasswordStrength(password) {
    const raw = String(password || '');
    if (raw.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
    if (raw.length > 128) return { valid: false, message: 'Password is too long' };
    if (!/[A-Z]/.test(raw)) return { valid: false, message: 'Password must include an uppercase letter' };
    if (!/[a-z]/.test(raw)) return { valid: false, message: 'Password must include a lowercase letter' };
    if (!/\d/.test(raw)) return { valid: false, message: 'Password must include a number' };
    if (!/[^A-Za-z0-9]/.test(raw)) return { valid: false, message: 'Password must include a special character' };
    return { valid: true };
}

module.exports = {
    hashPassword,
    verifyPassword,
    validatePasswordStrength,
};
