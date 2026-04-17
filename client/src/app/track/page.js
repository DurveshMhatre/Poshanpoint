'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { io } from 'socket.io-client';
import { getOrder } from '@/lib/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
const ICON = {
  home: '\uD83C\uDFE0',
  menu: '\uD83C\uDF7D\uFE0F',
  cart: '\uD83D\uDED2',
  track: '\uD83D\uDCE6',
  confirmed: '\u2713',
  preparing: '\u23F3',
  ready: '\u2714',
  served: '\u2605',
};

function normalizeOrderId(raw) {
  return String(raw || '')
    .trim()
    .replace(/^#/, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

export default function TrackPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTrack() {
    const cleanOrderId = normalizeOrderId(orderId);
    if (!cleanOrderId) {
      setError('Please enter your order ID');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await getOrder(cleanOrderId);
      setOrder(res.data);
      setOrderId(cleanOrderId);
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('authentication')) {
        setError('Invalid order ID format. Please enter only the order ID (without #).');
      } else {
        setError('Order not found. Please check your order ID.');
      }
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!order?.orderId) return undefined;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      socket.emit('join-order', order.orderId);
    });

    socket.on('order-status-update', (payload) => {
      if (payload?.orderId !== order.orderId) return;
      setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
    });

    return () => socket.disconnect();
  }, [order?.orderId]);

  const statusSteps = [
    { key: 'confirmed', label: 'Order Confirmed', icon: ICON.confirmed },
    { key: 'preparing', label: 'Preparing', icon: ICON.preparing },
    { key: 'ready', label: 'Ready for Pickup', icon: ICON.ready },
    { key: 'served', label: 'Served', icon: ICON.served },
  ];

  function getStepState(stepKey) {
    const orderFlow = ['confirmed', 'preparing', 'ready', 'served'];
    const currentIdx = orderFlow.indexOf(order?.status);
    const stepIdx = orderFlow.indexOf(stepKey);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'upcoming';
  }

  return (
    <div className="page">
      <header className="app-header">
        <div className="header-inner">
          <Link href="/" className="header-logo">
            <Image src="/images/logo-landscape.png" alt="PoshanPoint" width={160} height={40} style={{ height: '32px', width: 'auto' }} />
          </Link>
        </div>
      </header>

      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Track Your Order</h1>
          <p className="page-subtitle">Enter your order ID to see the status</p>
        </div>

        <div className="form-group">
          <input
            type="text"
            placeholder="Enter Order ID (e.g., PP-XXXXX-XXX)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
          />
        </div>

        <button className="btn btn-primary btn-block" onClick={handleTrack} disabled={loading}>
          {loading ? 'Searching...' : 'Track Order'}
        </button>

        {error && (
          <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '12px', borderRadius: 'var(--radius-md)', marginTop: '16px', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {order && (
          <div className="animate-scale-in" style={{ marginTop: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Order</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>#{order.orderId}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {order.customerName} - Rs {order.totalAmount}
              </div>
            </div>

            <div className="status-tracker" style={{ maxWidth: '300px', margin: '0 auto' }}>
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
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <Link href="/" className="nav-item"><span className="nav-icon">{ICON.home}</span>Home</Link>
          <Link href="/menu" className="nav-item"><span className="nav-icon">{ICON.menu}</span>Menu</Link>
          <Link href="/cart" className="nav-item"><span className="nav-icon">{ICON.cart}</span>Cart</Link>
          <Link href="/track" className="nav-item active"><span className="nav-icon">{ICON.track}</span>Track</Link>
        </div>
      </nav>
    </div>
  );
}
