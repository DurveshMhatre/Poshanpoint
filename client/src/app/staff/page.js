'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getOrders, updateOrderStatus } from '@/lib/api';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

function toLower(value) {
    return String(value || '').toLowerCase();
}

function resolveRecipeType(item) {
    const savedType = toLower(item?.recipeType);
    if (savedType) return savedType;

    const categoryName = toLower(item?.categoryName);
    const itemName = toLower(item?.name);

    if (categoryName.includes('custom blend') || itemName.includes('custom blend')) return 'custom-blend';
    if (categoryName.includes('fruit bowl') || itemName.includes('bowl')) return 'fruit-bowl';
    if (categoryName.includes('pre-workout') || categoryName.includes('post-workout') || itemName.includes('smoothie') || itemName.includes('shake')) return 'smoothie';
    return 'general';
}

function buildRecipeCard(item) {
    const recipeType = resolveRecipeType(item);
    const base = item?.selectedBase?.name || item?.selectedLiquid?.name || 'Water';
    const extras = (item?.selectedAddOns || []).map((a) => a?.name).filter(Boolean);
    const qty = Math.max(1, Number(item?.quantity) || 1);

    if (recipeType === 'custom-blend') {
        const fruits = extras.length ? extras.join(', ') : 'No fruits selected';
        return {
            title: 'Custom Blend Recipe',
            steps: [
                `Use ${base} as base in blender jar.`,
                `Add fruits/extras: ${fruits}.`,
                'Blend for 45-60 seconds until smooth texture.',
                `Pour and serve ${qty} cup(s) with correct order label.`,
            ],
        };
    }

    if (recipeType === 'smoothie') {
        const extrasText = extras.length ? extras.join(', ') : 'No extra add-ons';
        return {
            title: 'Smoothie Recipe',
            steps: [
                `Start with ${base} in blender.`,
                `Add ${item?.name} ingredients and extras: ${extrasText}.`,
                'Blend until consistent and lump-free.',
                `Serve ${qty} cup(s) and verify customization before handoff.`,
            ],
        };
    }

    if (recipeType === 'fruit-bowl') {
        const toppings = extras.length ? extras.join(', ') : 'No toppings selected';
        return {
            title: 'Fruit Bowl Recipe',
            steps: [
                `Prepare bowl base for ${item?.name}.`,
                `Add selected toppings/extras: ${toppings}.`,
                'Balance portions and arrange neatly for presentation.',
                `Serve ${qty} bowl(s) with order tag.`,
            ],
        };
    }

    return null;
}

export default function StaffPage() {
    const { customer, isLoggedIn, loading: authLoading } = useAuth();
    const hasStaffAccess = isLoggedIn && (
        customer?.isAdmin || customer?.role === 'admin' || customer?.role === 'staff'
    );
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('active');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        if (authLoading || !hasStaffAccess) return undefined;

        loadOrders();

        // Setup Socket.IO
        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-staff');
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('new-order', (order) => {
            setOrders(prev => [order, ...prev]);
            // Play notification sound
            try {
                if (audioRef.current) audioRef.current.play();
            } catch (e) { }
        });

        socket.on('order-status-update', ({ _id, status }) => {
            setOrders(prev => prev.map(o =>
                o._id === _id ? { ...o, status } : o
            ));
        });

        return () => socket.disconnect();
    }, [authLoading, hasStaffAccess]);

    if (authLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading access...</p>
            </div>
        );
    }

    if (!hasStaffAccess) {
        return (
            <div className="page">
                <div className="container" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
                    <div className="empty-state">
                        <div className="empty-icon">🔒</div>
                        <div className="empty-title">Staff access required</div>
                        <div className="empty-text">Login with a staff or admin account to use this dashboard.</div>
                        <Link href="/staff-login" className="btn btn-primary" style={{ marginTop: '16px' }}>
                            Staff Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    async function loadOrders() {
        try {
            const res = await getOrders();
            setOrders(res.data || []);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusUpdate(orderId, newStatus) {
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o =>
                o._id === orderId ? { ...o, status: newStatus } : o
            ));
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    }

    const filteredOrders = orders.filter(o => {
        if (filter === 'active') return ['confirmed', 'preparing', 'ready'].includes(o.status);
        if (filter === 'all') return true;
        return o.status === filter;
    });

    const stats = {
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        served: orders.filter(o => o.status === 'served').length,
    };

    function getNextStatus(current) {
        const flow = { confirmed: 'preparing', preparing: 'ready', ready: 'served' };
        return flow[current] || null;
    }

    function getStatusBtnClass(status) {
        const map = {
            preparing: 'status-btn status-btn-preparing',
            ready: 'status-btn status-btn-ready',
            served: 'status-btn status-btn-served',
        };
        return map[status] || 'status-btn';
    }

    function getStatusLabel(status) {
        const map = {
            preparing: '👨‍🍳 Start Preparing',
            ready: '✅ Mark Ready',
            served: '🎉 Mark Served',
        };
        return map[status] || status;
    }

    function formatTime(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="page" style={{ paddingBottom: '24px' }}>
            {/* Notification sound */}
            <audio ref={audioRef} preload="auto">
                <source src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" type="audio/wav" />
            </audio>

            <div className="container-wide">
                {/* Header */}
                <div className="staff-header" style={{ paddingTop: '24px' }}>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '1.6rem' }}>🍊 Kitchen Dashboard</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                            <div className="live-indicator">
                                <div className="live-dot"></div>
                                {connected ? 'Live' : 'Connecting...'}
                            </div>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                                {orders.length} total orders
                            </span>
                        </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={loadOrders}>🔄 Refresh</button>
                </div>

                {/* Stats */}
                <div className="staff-stats">
                    <div className="stat-card">
                        <div className="stat-value">{stats.confirmed}</div>
                        <div className="stat-label">New</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.preparing}</div>
                        <div className="stat-label">Preparing</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.ready}</div>
                        <div className="stat-label">Ready</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.served}</div>
                        <div className="stat-label">Served</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    {['active', 'confirmed', 'preparing', 'ready', 'served', 'all'].map(f => (
                        <button
                            key={f}
                            className={`filter-tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Orders */}
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <div className="empty-title">No orders here</div>
                        <div className="empty-text">
                            {filter === 'active' ? 'Waiting for new orders...' : 'No orders with this status'}
                        </div>
                    </div>
                ) : (
                    <div className="order-queue">
                        {filteredOrders.map(order => (
                            <div key={order._id} className="order-card">
                                <div className="order-card-header">
                                    <div className="order-card-id">#{order.orderId}</div>
                                    <span className={`badge badge-${order.status}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="order-card-customer">
                                    <span>👤 {order.customerName}</span>
                                    <span>📱 {order.phone}</span>
                                    <span>{order.orderType === 'counter' ? '🍽️' : '🥡'}</span>
                                </div>

                                <div className="order-card-items">
                                    {order.items?.map((item, i) => {
                                        const recipe = buildRecipeCard(item);
                                        return (
                                            <div key={i}>
                                                <div className="order-item-line">
                                                    <span className="order-item-name">{item.name} x {item.quantity}</span>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Rs {item.itemTotal}</span>
                                                </div>
                                                {(item.selectedBase?.name || item.selectedLiquid?.name || item.selectedAddOns?.length > 0) && (
                                                    <div className="order-item-customs-detail">
                                                        {item.selectedBase?.name && <span>Base: {item.selectedBase.name}</span>}
                                                        {item.selectedLiquid?.name && <span> | Liquid: {item.selectedLiquid.name}</span>}
                                                        {item.selectedAddOns?.length > 0 && (
                                                            <span> | Extras: {item.selectedAddOns.map(a => a.name).join(', ')}</span>
                                                        )}
                                                    </div>
                                                )}
                                                {recipe && (
                                                    <div style={{
                                                        marginTop: '8px',
                                                        marginBottom: '8px',
                                                        padding: '10px 12px',
                                                        borderRadius: '10px',
                                                        border: '1px solid #d7e9da',
                                                        background: '#f6fbf7'
                                                    }}>
                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            fontWeight: 700,
                                                            color: '#2f6f3a',
                                                            marginBottom: '6px'
                                                        }}>
                                                            {recipe.title}
                                                        </div>
                                                        <ol style={{ margin: 0, paddingLeft: '18px', color: '#38503d', fontSize: '0.82rem', lineHeight: 1.45 }}>
                                                            {recipe.steps.map((step, stepIndex) => (
                                                                <li key={`${item.name}-${stepIndex}`}>{step}</li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {order.note && (
                                    <div style={{
                                        padding: '8px 12px', background: 'var(--warning-bg)',
                                        borderRadius: 'var(--radius-md)', fontSize: '0.85rem',
                                        marginBottom: '12px', color: 'var(--warning)'
                                    }}>
                                        📝 {order.note}
                                    </div>
                                )}

                                <div className="order-card-footer">
                                    <div>
                                        <div className="order-total">₹{order.totalAmount}</div>
                                        <div className="order-time">{formatTime(order.createdAt)}</div>
                                    </div>
                                    <div className="status-actions">
                                        {getNextStatus(order.status) && (
                                            <button
                                                className={getStatusBtnClass(getNextStatus(order.status))}
                                                onClick={() => handleStatusUpdate(order._id, getNextStatus(order.status))}
                                            >
                                                {getStatusLabel(getNextStatus(order.status))}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
