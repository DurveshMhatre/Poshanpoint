const test = require('node:test');
const assert = require('node:assert/strict');
const Customer = require('../models/Customer');

test('awardPoints adds points and updates counters', () => {
    const customer = new Customer({
        phone: '9999999999',
        loyaltyPoints: 0,
        orderCount: 0,
        loyaltyHistory: [],
    });

    const earned = customer.awardPoints(245, 'PP-TEST-123');

    assert.equal(earned, 24);
    assert.equal(customer.loyaltyPoints, 24);
    assert.equal(customer.orderCount, 1);
    assert.equal(customer.loyaltyHistory.length, 1);
    assert.equal(customer.loyaltyHistory[0].type, 'earned');
});

test('awardPoints does not add points for low value but still increments order count', () => {
    const customer = new Customer({
        phone: '9999999998',
        loyaltyPoints: 10,
        orderCount: 2,
        loyaltyHistory: [],
    });

    const earned = customer.awardPoints(9, 'PP-TEST-124');

    assert.equal(earned, 0);
    assert.equal(customer.loyaltyPoints, 10);
    assert.equal(customer.orderCount, 3);
    assert.equal(customer.loyaltyHistory.length, 0);
});
