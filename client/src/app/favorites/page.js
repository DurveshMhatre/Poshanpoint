'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getFavorites, deleteFavorite } from '@/lib/api';
import { CartProvider, useCart } from '@/context/CartContext';

function FavoritesContent() {
    const router = useRouter();
    const { isLoggedIn, loading: authLoading } = useAuth();
    const { addItem } = useCart();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.replace('/login');
            return;
        }
        if (isLoggedIn) loadFavorites();
    }, [isLoggedIn, authLoading]);

    async function loadFavorites() {
        try {
            const res = await getFavorites();
            if (res.success) setFavorites(res.data || []);
        } catch (err) {
            console.error('Load favorites error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        try {
            const res = await deleteFavorite(id);
            if (res.success) {
                setFavorites(res.data || []);
                showToast('Blend removed');
            }
        } catch (err) {
            showToast('Failed to remove');
        }
    }

    function handleReorder(blend) {
        const item = {
            menuItem: blend.menuItem,
            name: blend.menuItemName || blend.name,
            basePrice: blend.basePrice,
            quantity: 1,
            selectedBase: blend.selectedBase,
            selectedLiquid: blend.selectedLiquid,
            selectedAddOns: blend.selectedAddOns || [],
        };
        addItem(item);
        showToast('Added to cart!');
    }

    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
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
                    <h1 className="page-title">❤️ My Favorites</h1>
                    <p className="page-subtitle">{favorites.length} saved blend{favorites.length !== 1 ? 's' : ''}</p>
                </div>

                {favorites.length === 0 ? (
                    <div className="empty-state" style={{ minHeight: '40vh' }}>
                        <div className="empty-icon">❤️</div>
                        <div className="empty-title">No saved blends yet</div>
                        <div className="empty-text">Save your favorite customizations from the menu!</div>
                        <Link href="/menu" className="btn btn-primary" style={{ marginTop: '24px' }}>Browse Menu</Link>
                    </div>
                ) : (
                    <div className="favorites-list">
                        {favorites.map(blend => (
                            <div key={blend._id} className="favorite-card">
                                <div className="favorite-info">
                                    <div className="favorite-name">{blend.name}</div>
                                    <div className="favorite-details">
                                        {blend.menuItemName && <span>{blend.menuItemName}</span>}
                                        {blend.selectedBase?.name && <span> • {blend.selectedBase.name}</span>}
                                        {blend.selectedLiquid?.name && <span> • {blend.selectedLiquid.name}</span>}
                                    </div>
                                    {blend.selectedAddOns?.length > 0 && (
                                        <div className="favorite-addons">
                                            + {blend.selectedAddOns.map(a => a.name).join(', ')}
                                        </div>
                                    )}
                                    <div className="favorite-price">₹{blend.basePrice}</div>
                                </div>
                                <div className="favorite-actions">
                                    <button className="btn btn-primary btn-sm" onClick={() => handleReorder(blend)}>
                                        🔄 Reorder
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(blend._id)}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
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

export default function FavoritesPage() {
    return (
        <CartProvider>
            <FavoritesContent />
        </CartProvider>
    );
}
