'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
    const router = useRouter();
    const { customer, isLoggedIn, loading, logout } = useAuth();

    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
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
                        <div className="empty-icon">👤</div>
                        <div className="empty-title">Login to access your profile</div>
                        <div className="empty-text">Save favorites, track orders, and earn loyalty points!</div>
                        <Link href="/login" className="btn btn-primary" style={{ marginTop: '24px' }}>
                            🔐 Login / Sign Up
                        </Link>
                        <Link href="/menu" className="btn btn-secondary" style={{ marginTop: '12px' }}>
                            ← Back to Menu
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    function handleLogout() {
        logout();
        router.push('/');
    }

    return (
        <div className="page">
            <header className="app-header">
                <div className="header-inner">
                    <Link href="/menu" className="header-logo">
                        <Image src="/images/logo-landscape.png" alt="PoshanPoint" width={160} height={40} style={{ height: '32px', width: 'auto' }} />
                    </Link>
                </div>
            </header>

            <div className="container" style={{ padding: '24px 16px', paddingBottom: '100px' }}>
                <div className="page-header">
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Welcome, {customer.name || 'PoshanPoint Member'}!</p>
                </div>

                {/* Profile Card */}
                <div className="profile-card">
                    <div className="profile-avatar">
                        {customer.name ? customer.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <div className="profile-info">
                        <div className="profile-name">{customer.name || 'Set your name'}</div>
                        <div className="profile-phone">📱 +91 {customer.phone}</div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-badge">
                        <div className="stat-value">{customer.loyaltyPoints || 0}</div>
                        <div className="stat-label">Points</div>
                    </div>
                    <div className="stat-badge">
                        <div className="stat-value">{customer.orderCount || 0}</div>
                        <div className="stat-label">Orders</div>
                    </div>
                    <div className="stat-badge">
                        <div className="stat-value">{customer.savedBlends || 0}</div>
                        <div className="stat-label">Favorites</div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="profile-menu">
                    <Link href="/favorites" className="profile-menu-item">
                        <span className="profile-menu-icon">❤️</span>
                        <span className="profile-menu-text">My Favorites</span>
                        <span className="profile-menu-arrow">→</span>
                    </Link>
                    <Link href="/order-history" className="profile-menu-item">
                        <span className="profile-menu-icon">📋</span>
                        <span className="profile-menu-text">Order History</span>
                        <span className="profile-menu-arrow">→</span>
                    </Link>
                    <Link href="/preferences" className="profile-menu-item">
                        <span className="profile-menu-icon">⚙️</span>
                        <span className="profile-menu-text">Preferences</span>
                        <span className="profile-menu-arrow">→</span>
                    </Link>
                    <div className="profile-menu-item" onClick={handleLogout} style={{ cursor: 'pointer', color: 'var(--error)' }}>
                        <span className="profile-menu-icon">🚪</span>
                        <span className="profile-menu-text">Logout</span>
                        <span className="profile-menu-arrow">→</span>
                    </div>
                </div>
            </div>

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
                <Link href="/profile" className="bottom-nav-item active">
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Profile</span>
                </Link>
            </nav>
        </div>
    );
}
