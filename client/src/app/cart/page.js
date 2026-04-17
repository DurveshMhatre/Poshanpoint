'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CartProvider, useCart } from '@/context/CartContext';

function CartContent() {
    const { items, totalItems, totalAmount, removeItem, updateQuantity } = useCart();

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
                        <div className="empty-title">Your cart is empty</div>
                        <div className="empty-text">Add some delicious items from our menu!</div>
                        <Link href="/menu" className="btn btn-primary" style={{ marginTop: '24px' }}>
                            Browse Menu
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="app-header">
                <div className="header-inner">
                    <Link href="/menu" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        ← Back to Menu
                    </Link>
                    <Link href="/" className="header-logo">
                        <Image src="/images/logo-landscape.png" alt="PoshanPoint" width={160} height={40} style={{ height: '32px', width: 'auto' }} />
                    </Link>
                </div>
            </header>

            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Your Cart</h1>
                    <p className="page-subtitle">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                </div>

                {/* Cart Items */}
                {items.map(item => (
                    <div key={item.cartId} className="cart-item">
                        <div className="cart-item-image" style={{
                            background: 'linear-gradient(135deg, #E8F5E9, #FFF8E1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                        }}>
                            🍽️
                        </div>
                        <div className="cart-item-info">
                            <div className="cart-item-name">{item.name}</div>
                            <div className="cart-item-customs">
                                {item.selectedBase && <span>Base: {item.selectedBase.name}</span>}
                                {item.selectedBase && item.selectedLiquid && <span> • </span>}
                                {item.selectedLiquid && <span>Liquid: {item.selectedLiquid.name}</span>}
                                {item.selectedAddOns?.length > 0 && (
                                    <><br />Extras: {item.selectedAddOns.map(a => a.name).join(', ')}</>
                                )}
                            </div>
                            <div className="cart-item-bottom">
                                <div className="cart-item-price">₹{item.itemTotal}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="qty-stepper" style={{ transform: 'scale(0.85)' }}>
                                        <button className="qty-btn" onClick={() => {
                                            if (item.quantity <= 1) removeItem(item.cartId);
                                            else updateQuantity(item.cartId, item.quantity - 1);
                                        }}>−</button>
                                        <span className="qty-value">{item.quantity}</span>
                                        <button className="qty-btn" onClick={() => updateQuantity(item.cartId, item.quantity + 1)}>+</button>
                                    </div>
                                    <button className="cart-item-remove" onClick={() => removeItem(item.cartId)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Price Summary */}
                <div className="price-summary">
                    <div className="price-row">
                        <span>Subtotal</span>
                        <span>₹{totalAmount}</span>
                    </div>
                    <div className="price-row">
                        <span>Taxes & Fees</span>
                        <span>₹0</span>
                    </div>
                    <div className="price-row total">
                        <span>Total</span>
                        <span className="price-value">₹{totalAmount}</span>
                    </div>
                </div>

                {/* Checkout Button */}
                <Link href="/checkout" className="btn btn-primary btn-block btn-lg">
                    Proceed to Checkout — ₹{totalAmount}
                </Link>

                <Link href="/menu" style={{
                    display: 'block', textAlign: 'center', marginTop: '16px',
                    color: 'var(--text-secondary)', fontSize: '0.9rem'
                }}>
                    + Add more items
                </Link>
            </div>

            {/* Bottom Nav */}
            <nav className="bottom-nav">
                <div className="bottom-nav-inner">
                    <Link href="/" className="nav-item"><span className="nav-icon">🏠</span>Home</Link>
                    <Link href="/menu" className="nav-item"><span className="nav-icon">🍽️</span>Menu</Link>
                    <Link href="/cart" className="nav-item active"><span className="nav-icon">🛒</span>Cart</Link>
                    <Link href="/track" className="nav-item"><span className="nav-icon">📦</span>Track</Link>
                </div>
            </nav>
        </div>
    );
}

export default function CartPage() {
    return (
        <CartProvider>
            <CartContent />
        </CartProvider>
    );
}
