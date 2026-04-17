'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CartProvider, useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createPaymentOrder, verifyPayment, createOrder, getMenuItem } from '@/lib/api';

function isMongoObjectId(value) {
    return /^[a-fA-F0-9]{24}$/.test(String(value || '').trim());
}

function CheckoutContent() {
    const router = useRouter();
    const { items, totalAmount, clearCart } = useCart();
    const { customer, isLoggedIn } = useAuth();
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [orderType, setOrderType] = useState('counter');
    const [note, setNote] = useState('');
    const [disclaimer, setDisclaimer] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-fill from auth context
    useEffect(() => {
        if (isLoggedIn && customer) {
            if (customer.name && !customerName) setCustomerName(customer.name);
            if (customer.phone && !phone) setPhone(customer.phone);
        }
    }, [isLoggedIn, customer]);

    if (items.length === 0) {
        return (
            <div className="page">
                <header className="app-header">
                    <div className="header-inner">
                        <Link href="/menu" className="header-logo">
                            <Image src="/images/logo-landscape.png" alt="PoshanPoint" width={160} height={40} style={{ height: '32px', width: 'auto' }} />
                        </Link>
                    </div>
                </header>
                <div className="container">
                    <div className="empty-state" style={{ minHeight: '60vh' }}>
                        <div className="empty-icon">🛒</div>
                        <div className="empty-title">Nothing to checkout</div>
                        <div className="empty-text">Add items to your cart first!</div>
                        <Link href="/menu" className="btn btn-primary" style={{ marginTop: '24px' }}>Browse Menu</Link>
                    </div>
                </div>
            </div>
        );
    }

    async function validateCartAvailability() {
        const uniqueItemIds = [...new Set(
            items.map((item) => item.menuItem).filter((id) => isMongoObjectId(id))
        )];

        if (uniqueItemIds.length === 0) {
            return { ok: true, unavailableNames: [] };
        }

        const checks = await Promise.all(
            uniqueItemIds.map(async (id) => {
                try {
                    const res = await getMenuItem(id);
                    const data = res?.data;
                    const available = Boolean(data?.isActive && data?.isAvailable);
                    return { id, available };
                } catch {
                    return { id, available: false };
                }
            })
        );

        const availabilityMap = new Map(checks.map((entry) => [entry.id, entry.available]));
        const unavailableNames = items
            .filter((item) => isMongoObjectId(item.menuItem) && availabilityMap.get(item.menuItem) === false)
            .map((item) => item.name);

        return { ok: unavailableNames.length === 0, unavailableNames: [...new Set(unavailableNames)] };
    }

    async function handlePayment() {
        if (!customerName.trim()) { setError('Please enter your name'); return; }
        if (!phone.trim() || phone.length < 10) { setError('Please enter a valid phone number'); return; }
        if (!disclaimer) { setError('Please accept the disclaimer to continue'); return; }

        setError('');
        setLoading(true);

        try {
            const availability = await validateCartAvailability();
            if (!availability.ok) {
                setError(`These items are unavailable: ${availability.unavailableNames.join(', ')}. Please update your cart.`);
                setLoading(false);
                return;
            }

            // Step 1: Create Razorpay order
            const paymentRes = await createPaymentOrder(totalAmount);
            const { orderId: razorpayOrderId, key } = paymentRes.data;

            // Step 2: Open Razorpay checkout
            const options = {
                key,
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                name: 'PoshanPoint',
                description: `Order - ${items.length} item(s)`,
                order_id: razorpayOrderId,
                handler: async function (response) {
                    try {
                        // Step 3: Verify payment
                        const verifyRes = await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyRes.success) {
                            // Step 4: Create order
                            const orderRes = await createOrder({
                                customerName,
                                phone,
                                orderType,
                                note,
                                items: items.map(item => ({
                                    menuItem: item.menuItem,
                                    name: item.name,
                                    categoryName: item.categoryName || '',
                                    recipeType: item.recipeType || '',
                                    quantity: item.quantity,
                                    basePrice: item.basePrice,
                                    selectedBase: item.selectedBase,
                                    selectedLiquid: item.selectedLiquid,
                                    selectedAddOns: item.selectedAddOns,
                                    itemTotal: item.itemTotal,
                                })),
                                totalAmount,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                disclaimerAccepted: true,
                            });

                            if (orderRes.success) {
                                clearCart();
                                router.push(`/order-confirmed?orderId=${orderRes.data.orderId}`);
                            }
                        }
                    } catch (err) {
                        setError('Payment verified but order creation failed. Please contact support.');
                        setLoading(false);
                    }
                },
                prefill: {
                    name: customerName,
                    contact: phone,
                },
                theme: {
                    color: '#4CAF50',
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setError('Payment failed. Please try again.');
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            setError('Failed to initiate payment. Please try again.');
            setLoading(false);
        }
    }

    return (
        <div className="page">
            {/* Razorpay Script */}
            <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>

            <header className="app-header">
                <div className="header-inner">
                    <Link href="/cart" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        ← Back to Cart
                    </Link>
                    <Link href="/" className="header-logo">
                        <Image src="/images/logo-landscape.png" alt="PoshanPoint" width={160} height={40} style={{ height: '32px', width: 'auto' }} />
                    </Link>
                </div>
            </header>

            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Checkout</h1>
                    <p className="page-subtitle">Almost there! Complete your order below.</p>
                </div>

                {/* Order Summary Mini */}
                <div className="checkout-section">
                    <div className="checkout-section-title">📋 Order Summary</div>
                    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border)' }}>
                        {items.map(item => (
                            <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                                <span style={{ fontSize: '0.9rem' }}>{item.name} × {item.quantity}</span>
                                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>₹{item.itemTotal}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: '700', fontSize: '1.1rem' }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--primary)' }}>₹{totalAmount}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="checkout-section">
                    <div className="checkout-section-title">👤 Your Details</div>
                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mobile Number *</label>
                        <input
                            type="tel"
                            placeholder="Enter 10-digit mobile number"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            maxLength={10}
                        />
                    </div>
                </div>

                {/* Order Type */}
                <div className="checkout-section">
                    <div className="checkout-section-title">🏪 Order Type</div>
                    <div className="order-type-selector">
                        <div
                            className={`order-type-option ${orderType === 'counter' ? 'selected' : ''}`}
                            onClick={() => setOrderType('counter')}
                        >
                            <span className="order-type-icon">🍽️</span>
                            <span>Serve at Counter</span>
                        </div>
                        <div
                            className={`order-type-option ${orderType === 'pickup' ? 'selected' : ''}`}
                            onClick={() => setOrderType('pickup')}
                        >
                            <span className="order-type-icon">🥡</span>
                            <span>Pickup</span>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="checkout-section">
                    <div className="checkout-section-title">📝 Special Instructions</div>
                    <textarea
                        placeholder="Any special requests? (optional)"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        rows={3}
                        style={{ resize: 'vertical' }}
                    />
                </div>

                {/* Disclaimer */}
                <div className="checkout-section">
                    <div className="disclaimer-box">
                        <input
                            type="checkbox"
                            checked={disclaimer}
                            onChange={e => setDisclaimer(e.target.checked)}
                            id="disclaimer"
                        />
                        <label htmlFor="disclaimer" style={{ cursor: 'pointer' }}>
                            I understand this food service provides general nutritional options and not medical advice.
                            I have reviewed my order and agree to the{' '}
                            <Link href="/terms" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Terms</Link> and{' '}
                            <Link href="/privacy" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Privacy Policy</Link>.
                        </label>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: 'var(--error-bg)', color: 'var(--error)',
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem', marginBottom: '16px', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {/* Pay Button */}
                <button
                    className="btn btn-primary btn-block btn-lg"
                    onClick={handlePayment}
                    disabled={loading}
                    style={{ marginBottom: '24px' }}
                >
                    {loading ? (
                        <>
                            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                            Processing...
                        </>
                    ) : (
                        <>💳 Pay ₹{totalAmount}</>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <CartProvider>
            <CheckoutContent />
        </CartProvider>
    );
}
