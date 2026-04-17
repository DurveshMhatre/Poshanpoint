'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getOrderHistory } from '@/lib/api';
import { CartProvider, useCart } from '@/context/CartContext';

function OrderHistoryContent() {
    const router = useRouter();
    const { isLoggedIn, loading: authLoading } = useAuth();
    const { addItem } = useCart();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [toast, setToast] = useState('');

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.replace('/login');
            return;
        }
        if (isLoggedIn) loadOrders();
    }, [isLoggedIn, authLoading, page]);

    async function loadOrders() {
        try {
            setLoading(true);
            const res = await getOrderHistory(page);
            if (res.success) {
                setOrders(res.data || []);
                setPagination(res.pagination);
            }
        } catch (err) {
            console.error('Load orders error:', err);
        } finally {
            setLoading(false);
        }
    }

    function handleReorder(order) {
        order.items.forEach(item => {
            addItem({
                menuItem: item.menuItem,
                name: item.name,
                basePrice: item.basePrice,
                quantity: item.quantity,
                selectedBase: item.selectedBase,
                selectedLiquid: item.selectedLiquid,
                selectedAddOns: item.selectedAddOns || [],
            });
        });
        setToast('Items added to cart!');
        setTimeout(() => setToast(''), 2500);
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function formatTime(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }

    function getStatusColor(status) {
        const colors = {
            confirmed: 'var(--info)',
            preparing: 'var(--warning)',
            ready: 'var(--success)',
            served: 'var(--success)',
            cancelled: 'var(--error)',
        };
        return colors[status] || 'var(--text-secondary)';
    }

    if (authLoading || loading) {
        return (
            <div className="page">
                <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="app-header">
                <div className="header-inner">
                    <Link href="/profile" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        ← Profile
                    </Link>
                    <Link href="/" className="header-logo">
                        <Image src="/images/logo-landscape.png" alt="PoshanPoint" width={160} height={40} style={{ height: '32px', width: 'auto' }} />
                    </Link>
                </div>
            </header>

            <div className="container" style={{ padding: '24px 16px', paddingBottom: '100px' }}>
                <div className="page-header">
                    <h1 className="page-title">📋 Order History</h1>
                    <p className="page-subtitle">{pagination?.total || 0} total order{(pagination?.total || 0) !== 1 ? 's' : ''}</p>
                </div>

                {orders.length === 0 ? (
                    <div className="empty-state" style={{ minHeight: '40vh' }}>
                        <div className="empty-icon">📋</div>
                        <div className="empty-title">No orders yet</div>
                        <div className="empty-text">Place your first order from the menu!</div>
                        <Link href="/menu" className="btn btn-primary" style={{ marginTop: '24px' }}>Browse Menu</Link>
                    </div>
                ) : (
                    <>
                        <div className="order-history-list">
                            {orders.map(order => (
                                <div key={order._id} className="order-history-card">
                                    <div
                                        className="order-history-header"
                                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="order-history-main">
                                            <div className="order-history-id">#{order.orderId}</div>
                                            <div className="order-history-date">
                                                {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
                                            </div>
                                        </div>
                                        <div className="order-history-right">
                                            <div className="order-history-amount">₹{order.totalAmount}</div>
                                            <span className="order-history-status" style={{ color: getStatusColor(order.status) }}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {expandedOrder === order._id ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </div>

                                    {expandedOrder === order._id && (
                                        <div className="order-history-details">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="order-history-item">
                                                    <div className="ohi-name">
                                                        {item.name} × {item.quantity}
                                                    </div>
                                                    <div className="ohi-custom">
                                                        {item.selectedBase?.name && <span>Base: {item.selectedBase.name}</span>}
                                                        {item.selectedLiquid?.name && <span> • Liquid: {item.selectedLiquid.name}</span>}
                                                    </div>
                                                    {item.selectedAddOns?.length > 0 && (
                                                        <div className="ohi-addons">
                                                            + {item.selectedAddOns.map(a => a.name).join(', ')}
                                                        </div>
                                                    )}
                                                    <div className="ohi-price">₹{item.itemTotal}</div>
                                                </div>
                                            ))}
                                            <button
                                                className="btn btn-primary btn-sm btn-block"
                                                onClick={() => handleReorder(order)}
                                                style={{ marginTop: '12px' }}
                                            >
                                                🔄 Reorder All Items
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    ← Prev
                                </button>
                                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Page {page} of {pagination.pages}
                                </span>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page >= pagination.pages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Toast */}
            {toast && <div className="toast show">{toast}</div>}

            {/* Bottom Nav */}
            <nav className="bottom-nav">
                <Link href="/menu" className="bottom-nav-item">
                    <span className="nav-icon">🍽️</span>
                    <span className="nav-label">Menu</span>
                </Link>
                <Link href="/cart" className="bottom-nav-item">
                    <span className="nav-icon">🛒</span>
                    <span className="nav-label">Cart</span>
                </Link>
                <Link href="/track" className="bottom-nav-item">
                    <span className="nav-icon">📍</span>
                    <span className="nav-label">Track</span>
                </Link>
                <Link href="/profile" className="bottom-nav-item">
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Profile</span>
                </Link>
            </nav>
        </div>
    );
}

export default function OrderHistoryPage() {
    return (
        <CartProvider>
            <OrderHistoryContent />
        </CartProvider>
    );
}
