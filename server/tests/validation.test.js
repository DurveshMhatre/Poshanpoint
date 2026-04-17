const test = require('node:test');
const assert = require('node:assert/strict');
const {
    sanitizePhone,
    sanitizeText,
    toMoney,
    normalizeOrderItems,
} = require('../utils/validation');

test('sanitizePhone returns last 10 digits', () => {
    assert.equal(sanitizePhone('+91 98765-43210'), '9876543210');
    assert.equal(sanitizePhone('1234'), null);
});

test('sanitizeText trims and compresses spaces', () => {
    assert.equal(sanitizeText('  hello    world  ', 20), 'hello world');
});

test('toMoney normalizes floats', () => {
    assert.equal(toMoney(123.456), 123.46);
    assert.equal(toMoney('abc'), null);
});

test('normalizeOrderItems computes totals and validates items', () => {
    const result = normalizeOrderItems([
        {
            menuItem: 'custom-blend',
            name: 'Berry Shake',
            quantity: 2,
            basePrice: 100,
            selectedBase: { name: 'Milk', price: 10 },
            selectedAddOns: [{ name: 'Chia', price: 5 }],
        }
    ]);

    assert.equal(result.valid, true);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].menuItem, undefined);
    assert.equal(result.items[0].itemTotal, 230);
    assert.equal(result.total, 230);
});

test('normalizeOrderItems rejects empty payload', () => {
    const result = normalizeOrderItems([]);
    assert.equal(result.valid, false);
});
