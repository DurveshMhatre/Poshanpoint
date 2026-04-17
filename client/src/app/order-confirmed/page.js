'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { getOrder } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const ICON = {
    confirmed: '\u2713',
    preparing: '\u23F3',
    ready: '\u2714',
    served: '\u2605',
    success: '\u2714',
    guest: '\u2606',
    trophy: '\u2605',
};

function OrderConfirmedContent() {
    const searchParams = useSearchParams();
    const orderId = (searchParams.get('orderId') || '').trim().replace(/^#/, '');
    const { isLoggedIn } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return undefined;
        }

        loadOrder(orderId);

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socket.on('connect', () => {
            socket.emit('join-order', orderId);
        });
        socket.on('order-status-update', (payload) => {
            if (payload?.orderId !== orderId) return;
            setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
        });

        return () => socket.disconnect();
    }, [orderId]);

    async function loadOrder(currentOrderId) {
        try {
            const res = await getOrder(currentOrderId);
            setOrder(res.data);
        } catch (error) {
            console.error('Failed to load order:', error);
        } finally {
            setLoading(false);
        }
    }

    const statusSteps = [
        { key: 'confirmed', label: 'Order Confirmed', icon: ICON.confirmed },
        { key: 'preparing', label: 'Preparing', icon: ICON.preparing },
        { key: 'ready', label: 'Ready for Pickup', icon: ICON.ready },
        { key: 'served', label: 'Served', icon: ICON.served },
    ];

    function getStepState(stepKey) {
        const flow = ['confirmed', 'preparing', 'ready', 'served'];
        const currentIdx = flow.indexOf(order?.status);
        const stepIdx = flow.indexOf(stepKey);
        if (stepIdx < currentIdx) return 'completed';
        if (stepIdx === currentIdx) return 'active';
        return 'upcoming';
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading your order...</p>
            </div>
        );
    }

    if (!orderId) {
        return (
            <div className="page">
                <div className="container">
                    <div className="empty-state" style={{ minHeight: '60vh' }}>
                        <div className="empty-icon">{ICON.preparing}</div>
                        <div className="empty-title">Order ID missing</div>
                        <div className="empty-text">Please open this page from checkout confirmation.</div>
                        <Link href="/menu" className="btn btn-primary" style={{ marginTop: '16px' }}>
                            Browse Menu
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="success-screen">
                    <div className="success-icon">{ICON.success}</div>
                    <h1 className="success-title">Order Placed!</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Your fresh, healthy order is being prepared
                    </p>

                    {order && (
                        <>
                            <div className="success-order-id">#{order.orderId}</div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                width: '100%',
                                maxWidth: '350px',
                                marginBottom: '24px'
                            }}>
                                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Type</div>
                                    <div style={{ fontWeight: '600', marginTop: '4px' }}>
                                        {order.orderType === 'counter' ? 'Counter' : 'Pickup'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
                                    <div style={{ fontWeight: '700', marginTop: '4px', color: 'var(--primary)' }}>
                                        Rs {order.totalAmount}
                                    </div>
                                </div>
                            </div>

                            <div className="status-tracker">
                                <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px', textAlign: 'left', marginBottom: '16px' }}>
                                    Order Status
                                </div>
                                {statusSteps.map((step) => {
                                    const state = getStepState(step.key);
                                    return (
                                        <div key={step.key} className={`status-step ${state}`}>
                                            <div className="status-dot">{step.icon}</div>
                                            <div className="status-label">{step.label}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ width: '100%', maxWidth: '350px', textAlign: 'left', marginTop: '16px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px', marginBottom: '12px' }}>
                                    Order Items
                                </div>
                                {order.items?.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{item.name} x {item.quantity}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                                                {item.selectedBase?.name && `${item.selectedBase.name}`}
                                                {item.selectedLiquid?.name && ` - ${item.selectedLiquid.name}`}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>Rs {item.itemTotal}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {!isLoggedIn ? (
                        <div style={{
                            background: 'linear-gradient(135deg, #E8F5E9 0%, #FFF3E0 100%)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '20px',
                            textAlign: 'center',
                            marginTop: '24px',
                            width: '100%',
                            maxWidth: '350px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{ICON.guest}</div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Save your preferences for next time?</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                Login to earn loyalty points and save favorites
                            </div>
                            <Link href="/login" className="btn btn-primary btn-sm">Login / Sign Up</Link>
                        </div>
                    ) : (
                        order?.pointsEarned > 0 && (
                            <div style={{
                                background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '16px',
                                textAlign: 'center',
                                marginTop: '24px',
                                width: '100%',
                                maxWidth: '350px',
                                border: '1px solid #A5D6A7'
                            }}>
                                <span style={{ fontSize: '1.1rem' }}>{ICON.trophy}</span>
                                <span style={{ fontWeight: '600', marginLeft: '8px' }}>
                                    +{order.pointsEarned} loyalty points earned!
                                </span>
                            </div>
                        )
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link href="/menu" className="btn btn-primary">Order More</Link>
                        <Link href="/profile" className="btn btn-secondary">My Profile</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OrderConfirmedPage() {
    return (
        <Suspense fallback={<div className="loading-screen"><div className="spinner"></div><p>Loading...</p></div>}>
            <OrderConfirmedContent />
        </Suspense>
    );
}
