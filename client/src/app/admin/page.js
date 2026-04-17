'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    getAdminCategories, createCategory, updateCategory, deleteCategory,
    getAdminItems, uploadAdminImage, createMenuItem as createItem, updateMenuItem as updateItem, deleteMenuItem as deleteItem,
    getAdminAddOns, createAddOn, updateAddOn, deleteAddOn,
    getStats, getOrders, exportOrders
} from '@/lib/api';

function readFileAsUploadPayload(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const commaIndex = result.indexOf(',');
            if (commaIndex < 0) {
                reject(new Error('Invalid image format'));
                return;
            }

            resolve({
                filename: file.name,
                mimeType: file.type,
                dataBase64: result.slice(commaIndex + 1),
            });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export default function AdminPage() {
    const { customer, isLoggedIn, loading: authLoading } = useAuth();
    const hasAdminAccess = isLoggedIn && (customer?.isAdmin || customer?.role === 'admin');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [addons, setAddons] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showForm, setShowForm] = useState(null);
    const [formData, setFormData] = useState({});
    const [editId, setEditId] = useState(null);
    const [itemImageUploading, setItemImageUploading] = useState(false);
    const [itemImageError, setItemImageError] = useState('');
    const [addonImageUploading, setAddonImageUploading] = useState(false);
    const [addonImageError, setAddonImageError] = useState('');

    useEffect(() => {
        if (authLoading || !hasAdminAccess) return;
        loadAllData();
    }, [authLoading, hasAdminAccess]);

    if (authLoading) {
        return <div className="loading-screen"><div className="spinner"></div><p>Checking admin access...</p></div>;
    }

    if (!hasAdminAccess) {
        return (
            <div className="page">
                <div className="container" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
                    <div className="empty-state">
                        <div className="empty-icon">🔒</div>
                        <div className="empty-title">Admin access required</div>
                        <div className="empty-text">Login with an admin account to open this page.</div>
                        <Link href="/staff-login" className="btn btn-primary" style={{ marginTop: '16px' }}>
                            Staff Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    async function loadAllData() {
        try {
            const [statsRes, catRes, itemRes, addonRes, orderRes] = await Promise.all([
                getStats(),
                getAdminCategories(),
                getAdminItems(),
                getAdminAddOns(),
                getOrders()
            ]);
            setStats(statsRes.data);
            setCategories(catRes.data || []);
            setItems(itemRes.data || []);
            setAddons(addonRes.data || []);
            setOrders(orderRes.data || []);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setLoading(false);
        }
    }

    // ============= CRUD handlers =============
    async function handleSaveCategory() {
        try {
            if (editId) {
                await updateCategory(editId, formData);
            } else {
                await createCategory(formData);
            }
            setShowForm(null); setFormData({}); setEditId(null);
            loadAllData();
        } catch (err) { console.error(err); }
    }

    async function handleDeleteCategory(id) {
        if (!confirm('Delete this category?')) return;
        try { await deleteCategory(id); loadAllData(); } catch (err) { console.error(err); }
    }

    async function handleSaveItem() {
        if (!formData.image) {
            alert('Please complete the form before saving.');
            return;
        }

        try {
            if (editId) {
                await updateItem(editId, formData);
            } else {
                await createItem(formData);
            }
            setShowForm(null); setFormData({}); setEditId(null);
            loadAllData();
        } catch (err) { console.error(err); }
    }

    async function handleItemImageSelect(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setItemImageError('Please select a valid image file.');
            return;
        }

        setItemImageUploading(true);
        setItemImageError('');
        try {
            const payload = await readFileAsUploadPayload(file);
            const res = await uploadAdminImage(payload);
            const uploadedUrl = res?.data?.imageUrl || '';
            if (!uploadedUrl) throw new Error('Image upload failed');
            setFormData((prev) => ({ ...prev, image: uploadedUrl }));
        } catch (err) {
            setItemImageError(err?.message || 'Image upload failed');
        } finally {
            setItemImageUploading(false);
        }
    }

    async function handleDeleteItem(id) {
        if (!confirm('Delete this item?')) return;
        try { await deleteItem(id); loadAllData(); } catch (err) { console.error(err); }
    }

    async function handleSaveAddon() {
        if (addonImageUploading) return;
        if (!formData.image) {
            alert('Please complete the form before saving.');
            return;
        }
        try {
            if (editId) {
                await updateAddOn(editId, formData);
            } else {
                await createAddOn(formData);
            }
            setShowForm(null); setFormData({}); setEditId(null);
            loadAllData();
        } catch (err) { console.error(err); }
    }

    async function handleAddonImageSelect(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setAddonImageError('Please select a valid image file.');
            return;
        }

        setAddonImageUploading(true);
        setAddonImageError('');
        try {
            const payload = await readFileAsUploadPayload(file);
            const res = await uploadAdminImage(payload);
            const uploadedUrl = res?.data?.imageUrl || '';
            if (!uploadedUrl) throw new Error('Image upload failed');
            setFormData((prev) => ({ ...prev, image: uploadedUrl }));
        } catch (err) {
            setAddonImageError(err?.message || 'Image upload failed');
        } finally {
            setAddonImageUploading(false);
        }
    }

    async function handleDeleteAddon(id) {
        if (!confirm('Delete this add-on?')) return;
        try { await deleteAddOn(id); loadAllData(); } catch (err) { console.error(err); }
    }

    async function handleToggleItemAvailability(id, current) {
        try { await updateItem(id, { isAvailable: !current }); loadAllData(); } catch (err) { console.error(err); }
    }

    async function handleExport() {
        const today = new Date().toISOString().split('T')[0];
        const start = prompt('Start date (YYYY-MM-DD):', today);
        const end = prompt('End date (YYYY-MM-DD):', today);
        if (start && end) {
            try {
                const blob = await exportOrders(start, end);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `orders_${start}_${end}.csv`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
            } catch (err) {
                alert(err.message || 'Failed to export orders');
            }
        }
    }

    if (loading) {
        return <div className="loading-screen"><div className="spinner"></div><p>Loading admin panel...</p></div>;
    }

    return (
        <div className="page" style={{ paddingBottom: '24px' }}>
            <div className="container-wide">
                <div style={{ paddingTop: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h1 className="page-title" style={{ fontSize: '1.6rem' }}>🔧 Admin Panel</h1>
                            <p className="page-subtitle">Manage menu, orders, and settings</p>
                        </div>
                        <Link href="/staff" className="btn btn-secondary btn-sm">📋 Staff View</Link>
                    </div>
                </div>

                {/* Admin Nav */}
                <div className="admin-nav">
                    {['dashboard', 'categories', 'items', 'addons', 'orders'].map(tab => (
                        <button key={tab} className={`admin-nav-item ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}>
                            {tab === 'dashboard' ? '📊' : tab === 'categories' ? '📁' : tab === 'items' ? '🍽️' : tab === 'addons' ? '➕' : '📦'}
                            {' '}{tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && stats && (
                    <div>
                        <div className="staff-stats">
                            <div className="stat-card">
                                <div className="stat-value">{stats.totalOrders}</div>
                                <div className="stat-label">Today&apos;s Orders</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">₹{stats.totalRevenue}</div>
                                <div className="stat-label">Today&apos;s Revenue</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">₹{stats.avgOrderValue}</div>
                                <div className="stat-label">Avg. Order Value</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{items.length}</div>
                                <div className="stat-label">Menu Items</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button className="btn btn-primary btn-sm" onClick={handleExport}>📥 Export CSV</button>
                            <button className="btn btn-secondary btn-sm" onClick={loadAllData}>🔄 Refresh</button>
                        </div>
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700' }}>Categories</h2>
                            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm('category'); setFormData({}); setEditId(null); }}>
                                + Add Category
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead><tr><th>Name</th><th>Description</th><th>Order</th><th>Active</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {categories.map(cat => (
                                        <tr key={cat._id}>
                                            <td style={{ fontWeight: '600' }}>{cat.name}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{cat.description || '—'}</td>
                                            <td>{cat.displayOrder}</td>
                                            <td><span className={`badge ${cat.isActive ? 'badge-ready' : 'badge-cancelled'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => {
                                                        setShowForm('category'); setEditId(cat._id);
                                                        setFormData({ name: cat.name, description: cat.description, displayOrder: cat.displayOrder, isActive: cat.isActive });
                                                    }}>Edit</button>
                                                    <button className="btn btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDeleteCategory(cat._id)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Items Tab */}
                {activeTab === 'items' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700' }}>Menu Items</h2>
                            <button className="btn btn-primary btn-sm" onClick={() => {
                                setShowForm('item');
                                setFormData({ bases: [], liquids: [], image: '' });
                                setEditId(null);
                                setItemImageError('');
                            }}>
                                + Add Item
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item._id}>
                                            <td style={{ fontWeight: '600' }}>{item.name}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{item.category?.name || '—'}</td>
                                            <td style={{ color: 'var(--primary)', fontWeight: '600' }}>₹{item.basePrice}</td>
                                            <td>
                                                <button className={`badge ${item.isAvailable ? 'badge-ready' : 'badge-cancelled'}`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleToggleItemAvailability(item._id, item.isAvailable)}>
                                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                                </button>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => {
                                                        setShowForm('item'); setEditId(item._id);
                                                        setFormData({
                                                            name: item.name, description: item.description, image: item.image || '', basePrice: item.basePrice,
                                                            category: item.category?._id || item.category, bases: item.bases || [], liquids: item.liquids || [],
                                                            isActive: item.isActive, isAvailable: item.isAvailable
                                                        });
                                                        setItemImageError('');
                                                    }}>Edit</button>
                                                    <button className="btn btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDeleteItem(item._id)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Add-ons Tab */}
                {activeTab === 'addons' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700' }}>Add-ons</h2>
                            <button className="btn btn-primary btn-sm" onClick={() => {
                                setShowForm('addon');
                                setFormData({ image: '' });
                                setEditId(null);
                                setAddonImageError('');
                            }}>
                                + Add Add-on
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead><tr><th>Name</th><th>Price</th><th>Category</th><th>Active</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {addons.map(addon => (
                                        <tr key={addon._id}>
                                            <td style={{ fontWeight: '600' }}>{addon.name}</td>
                                            <td style={{ color: 'var(--primary)', fontWeight: '600' }}>₹{addon.price}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{addon.category}</td>
                                            <td><span className={`badge ${addon.isActive ? 'badge-ready' : 'badge-cancelled'}`}>{addon.isActive ? 'Active' : 'Inactive'}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => {
                                                        setShowForm('addon'); setEditId(addon._id);
                                                        setFormData({ name: addon.name, image: addon.image || '', price: addon.price, category: addon.category, isActive: addon.isActive });
                                                        setAddonImageError('');
                                                    }}>Edit</button>
                                                    <button className="btn btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDeleteAddon(addon._id)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700' }}>Order History</h2>
                            <button className="btn btn-primary btn-sm" onClick={handleExport}>📥 Export CSV</button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id}>
                                            <td style={{ fontWeight: '600', fontFamily: 'var(--font-heading)' }}>#{order.orderId}</td>
                                            <td>{order.customerName}<br /><span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{order.phone}</span></td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                                            </td>
                                            <td style={{ color: 'var(--primary)', fontWeight: '600' }}>₹{order.totalAmount}</td>
                                            <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                                            <td><span className={`badge ${order.paymentStatus === 'paid' ? 'badge-ready' : 'badge-pending'}`}>{order.paymentStatus}</span></td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{new Date(order.createdAt).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ============= FORM MODALS ============= */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                {editId ? 'Edit' : 'Add'} {showForm === 'category' ? 'Category' : showForm === 'item' ? 'Menu Item' : 'Add-on'}
                            </div>
                            <button className="modal-close" onClick={() => setShowForm(null)}>✕</button>
                        </div>

                        {showForm === 'category' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Category name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Short description" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Display Order</label>
                                    <input type="number" value={formData.displayOrder || 0} onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })} />
                                </div>
                                <button className="btn btn-primary btn-block" onClick={handleSaveCategory}>
                                    {editId ? 'Update' : 'Create'} Category
                                </button>
                            </>
                        )}

                        {showForm === 'item' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Item name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Item description" rows={2} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Item Image</label>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(e) => handleItemImageSelect(e.target.files?.[0])}
                                    />
                                    {itemImageUploading && (
                                        <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Uploading image...
                                        </div>
                                    )}
                                    {itemImageError && (
                                        <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--error)' }}>
                                            {itemImageError}
                                        </div>
                                    )}
                                    {formData.image && (
                                        <div style={{ marginTop: '10px' }}>
                                            <img
                                                src={formData.image}
                                                alt="Item preview"
                                                style={{ width: '84px', height: '84px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                                            />
                                            <input
                                                value={formData.image}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                placeholder="Uploaded image URL"
                                                style={{ marginTop: '8px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Base Price (₹)</label>
                                    <input type="number" value={formData.basePrice || ''} onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })} placeholder="e.g., 199" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="">Select category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <button className="btn btn-primary btn-block" onClick={handleSaveItem} disabled={itemImageUploading}>
                                    {editId ? 'Update' : 'Create'} Item
                                </button>
                            </>
                        )}

                        {showForm === 'addon' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Add-on name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Image</label>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(e) => handleAddonImageSelect(e.target.files?.[0])}
                                    />
                                    {addonImageUploading && (
                                        <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Uploading image...
                                        </div>
                                    )}
                                    {addonImageError && (
                                        <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--error)' }}>
                                            {addonImageError}
                                        </div>
                                    )}
                                    {formData.image && (
                                        <div style={{ marginTop: '10px' }}>
                                            <img
                                                src={formData.image}
                                                alt="Add-on preview"
                                                style={{ width: '84px', height: '84px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                                            />
                                            <input
                                                value={formData.image}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                placeholder="Uploaded image URL"
                                                style={{ marginTop: '8px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Price (₹)</label>
                                    <input type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} placeholder="e.g., 25" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <input value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., topping, supplement" />
                                </div>
                                <button className="btn btn-primary btn-block" onClick={handleSaveAddon} disabled={addonImageUploading}>
                                    {editId ? 'Update' : 'Create'} Add-on
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


