'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getProfile, updateProfile, getAddOns } from '@/lib/api';

export default function PreferencesPage() {
    const router = useRouter();
    const { isLoggedIn, loading: authLoading, refreshProfile } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [defaultMilk, setDefaultMilk] = useState('');
    const [defaultSweetener, setDefaultSweetener] = useState('');
    const [defaultAddOns, setDefaultAddOns] = useState([]);
    const [availableAddOns, setAvailableAddOns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    const milkOptions = ['Almond Milk', 'Coconut Milk', 'Oat Milk', 'Whole Milk', 'Skim Milk', 'Coconut Water'];
    const sweetenerOptions = ['No Sweetener', 'Honey', 'Maple Syrup', 'Stevia', 'Jaggery'];

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.replace('/login');
            return;
        }
        if (isLoggedIn) loadData();
    }, [isLoggedIn, authLoading]);

    async function loadData() {
        try {
            const [profileRes, addOnsRes] = await Promise.all([
                getProfile(),
                getAddOns()
            ]);

            if (profileRes.success) {
                const p = profileRes.data;
                setName(p.name || '');
                setEmail(p.email || '');
                setDefaultMilk(p.preferences?.defaultMilk || '');
                setDefaultSweetener(p.preferences?.defaultSweetener || '');
                setDefaultAddOns(p.preferences?.defaultAddOns || []);
            }

            if (addOnsRes.success) {
                setAvailableAddOns(addOnsRes.data || []);
            }
        } catch (err) {
            console.error('Load preferences error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await updateProfile({
                name,
                email,
                preferences: {
                    defaultMilk,
                    defaultSweetener,
                    defaultAddOns,
                }
            });

            if (res.success) {
                showToast('Preferences saved!');
                refreshProfile();
            } else {
                showToast('Failed to save');
            }
        } catch (err) {
            showToast('Error saving preferences');
        } finally {
            setSaving(false);
        }
    }

    function toggleAddOn(name) {
        setDefaultAddOns(prev =>
            prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
        );
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
                    <h1 className="page-title">⚙️ Preferences</h1>
                    <p className="page-subtitle">Set your defaults for faster ordering</p>
                </div>

                {/* Personal Info */}
                <div className="pref-section">
                    <div className="pref-section-title">Personal Info</div>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email (optional)</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                {/* Default Milk */}
                <div className="pref-section">
                    <div className="pref-section-title">🥛 Default Milk Choice</div>
                    <div className="pref-options">
                        <div
                            className={`pref-option ${!defaultMilk ? 'selected' : ''}`}
                            onClick={() => setDefaultMilk('')}
                        >
                            No Default
                        </div>
                        {milkOptions.map(milk => (
                            <div
                                key={milk}
                                className={`pref-option ${defaultMilk === milk ? 'selected' : ''}`}
                                onClick={() => setDefaultMilk(milk)}
                            >
                                {milk}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Default Sweetener */}
                <div className="pref-section">
                    <div className="pref-section-title">🍯 Default Sweetener</div>
                    <div className="pref-options">
                        <div
                            className={`pref-option ${!defaultSweetener ? 'selected' : ''}`}
                            onClick={() => setDefaultSweetener('')}
                        >
                            No Default
                        </div>
                        {sweetenerOptions.map(sw => (
                            <div
                                key={sw}
                                className={`pref-option ${defaultSweetener === sw ? 'selected' : ''}`}
                                onClick={() => setDefaultSweetener(sw)}
                            >
                                {sw}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Default Add-ons */}
                <div className="pref-section">
                    <div className="pref-section-title">➕ Default Add-ons</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        These will be auto-selected when customizing items (you can always change per order)
                    </p>
                    <div className="pref-addons-grid">
                        {availableAddOns.map(addon => (
                            <label key={addon._id} className={`pref-addon-chip ${defaultAddOns.includes(addon.name) ? 'selected' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={defaultAddOns.includes(addon.name)}
                                    onChange={() => toggleAddOn(addon.name)}
                                    style={{ display: 'none' }}
                                />
                                <span>{addon.name}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>+₹{addon.price}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <button
                    className="btn btn-primary btn-block btn-lg"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ marginTop: '24px' }}
                >
                    {saving ? (
                        <><div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>Saving...</>
                    ) : (
                        <>💾 Save Preferences</>
                    )}
                </button>
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
