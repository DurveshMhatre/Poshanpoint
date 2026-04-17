'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CartProvider, useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getAddOns, getCategories, getMenuItem, getMenuItems, saveFavorite } from '@/lib/api';

const ICON = {
  home: '\uD83C\uDFE0',
  menu: '\uD83C\uDF7D\uFE0F',
  cart: '\uD83D\uDED2',
  track: '\uD83D\uDCE6',
  profile: '\uD83D\uDC64',
  heart: '\u2665',
  heartOutline: '\u2661',
  blend: '\u2697',
  customize: '\u270E',
  search: '\u2315',
  close: '\u2715',
  back: '\u2190',
};

function price(v) {
  return `Rs ${v}`;
}

const DEFAULT_SMOOTHIE_BASES = [
  { name: 'Milk', price: 30 },
  { name: 'Yogurt', price: 35 },
  { name: 'Coconut Water', price: 40 },
  { name: 'Almond Milk', price: 50 },
  { name: 'Water', price: 0 },
];

function getCategoryName(item) {
  return String(item?.category?.name || item?.categoryName || '').trim();
}

function isSmoothieCategoryName(categoryName) {
  const name = String(categoryName || '').toLowerCase();
  return name.includes('pre-workout') || name.includes('post-workout') || name.includes('smoothie') || name.includes('shake');
}

function isFruitBowlCategoryName(categoryName) {
  const name = String(categoryName || '').toLowerCase();
  return name.includes('fruit bowl') || name.includes('fruit-bowl') || name.includes('bowl');
}

function isCustomizeEnabled(item) {
  const categoryName = getCategoryName(item);
  const isAddonCategory = categoryName.toLowerCase().includes('add-on');
  if (isAddonCategory) return false;
  if (isSmoothieCategoryName(categoryName) || isFruitBowlCategoryName(categoryName)) return true;
  return (item?.bases?.length || 0) > 0 || (item?.liquids?.length || 0) > 0;
}

function getRecipeTypeForItem(item) {
  const categoryName = getCategoryName(item);
  const itemName = String(item?.name || '').toLowerCase();

  if (itemName.includes('custom blend')) return 'custom-blend';
  if (isFruitBowlCategoryName(categoryName) || itemName.includes('bowl')) return 'fruit-bowl';
  if (isSmoothieCategoryName(categoryName) || itemName.includes('smoothie') || itemName.includes('shake')) return 'smoothie';
  return 'general';
}

function MenuInner() {
  const { addItem, totalItems } = useCart();
  const { customer } = useAuth();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [liked, setLiked] = useState({});

  const [blendOpen, setBlendOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, itemRes, addOnRes] = await Promise.all([
          getCategories(),
          getMenuItems(),
          getAddOns(),
        ]);
        setCategories(catRes.data || []);
        setItems(itemRes.data || []);
        setAddOns(addOnRes.data || []);
      } catch (err) {
        console.error('Failed to load menu', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((it) => (it.category?._id || it.category) === activeCategory);
  }, [items, activeCategory]);

  async function isItemAvailableNow(item) {
    if (!item?._id) return item?.isAvailable !== false;
    try {
      const res = await getMenuItem(item._id);
      const latest = res?.data;
      return Boolean(latest?.isActive && latest?.isAvailable);
    } catch {
      return item?.isAvailable !== false;
    }
  }

  async function quickAdd(item) {
    const available = await isItemAvailableNow(item);
    if (!available) {
      setToast(`${item.name} is currently unavailable`);
      return;
    }

    const categoryName = getCategoryName(item);
    addItem({
      menuItem: item._id,
      name: item.name,
      categoryName,
      recipeType: getRecipeTypeForItem(item),
      image: item.image,
      basePrice: item.basePrice,
      quantity: 1,
      selectedBase: item.bases?.[0] || null,
      selectedLiquid: item.liquids?.[0] || null,
      selectedAddOns: [],
    });
    setToast(`${item.name} added to cart`);
  }

  async function toggleFavorite(item) {
    const next = !liked[item._id];
    setLiked((prev) => ({ ...prev, [item._id]: next }));
    if (!next) return;
    if (!customer) {
      setToast('Login to save favorites');
      return;
    }
    try {
      await saveFavorite({
        name: item.name,
        menuItem: item._id,
        menuItemName: item.name,
        basePrice: item.basePrice,
        selectedBase: null,
        selectedLiquid: null,
        selectedAddOns: [],
      });
      setToast('Saved to favorites');
    } catch {
      setToast('Failed to save favorite');
    }
  }

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div><p>Loading menu...</p></div>;
  }

  return (
    <div className="page" style={{ background: '#fafafa' }}>
      <header className="app-header">
        <div className="header-inner">
          <Link href="/" className="header-logo">
            <Image src="/images/logo-landscape.png" alt="PoshanPoint" width={160} height={40} style={{ height: '32px', width: 'auto' }} />
          </Link>
          <div className="header-actions">
            <Link href="/profile" className="cart-btn">{ICON.profile}</Link>
            <Link href="/cart" className="cart-btn">
              {ICON.cart}
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.55rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>From Our Menu</h1>
          <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>Freshly prepared, fitness-friendly recipes.</p>
        </div>

        <div className="category-slider-wrapper">
          <button className="slider-arrow slider-arrow-left" onClick={() => document.querySelector('.category-slider')?.scrollBy({ left: -140, behavior: 'smooth' })}>{'<'}</button>
          <div className="category-slider">
            <button className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All</button>
            {categories.map((cat) => (
              <button key={cat._id} className={`category-pill ${activeCategory === cat._id ? 'active' : ''}`} onClick={() => setActiveCategory(cat._id)}>{cat.name}</button>
            ))}
            <button className="category-pill customize-pill" onClick={() => setBlendOpen(true)}>{ICON.blend} Customize Blend</button>
          </div>
          <button className="slider-arrow slider-arrow-right" onClick={() => document.querySelector('.category-slider')?.scrollBy({ left: 140, behavior: 'smooth' })}>{'>'}</button>
        </div>

        <div className="menu-grid-v2">
          {filtered.map((item) => (
            <div key={item._id} className="menu-card-v2">
              <div className="menu-card-v2-image">
                <img src={item.image} alt={item.name} loading="lazy" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=600&h=400&fit=crop'; }} />
                {item.badge && <span className="menu-badge">{item.badge}</span>}
                <button className={`heart-btn ${liked[item._id] ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}>
                  {liked[item._id] ? ICON.heart : ICON.heartOutline}
                </button>
              </div>
              <div className="menu-card-v2-body">
                <div className="menu-card-v2-row">
                  <h3 className="menu-card-v2-name">{item.name}</h3>
                  <span className="menu-card-v2-price">{price(item.basePrice)}</span>
                </div>
                <p className="menu-card-v2-desc">{item.description}</p>
                <div className="menu-card-v2-actions">
                  {isCustomizeEnabled(item) && <button className="btn-customize-sm" onClick={() => setItemOpen(item)}>{ICON.customize} Customize</button>}
                  <button className="btn-add-cart" onClick={() => quickAdd(item)}>Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">{ICON.search}</div>
            <div className="empty-title">No items found</div>
            <div className="empty-text">Try a different category</div>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <Link href="/" className="nav-item"><span className="nav-icon">{ICON.home}</span>Home</Link>
          <Link href="/menu" className="nav-item active"><span className="nav-icon">{ICON.menu}</span>Menu</Link>
          <Link href="/cart" className="nav-item" style={{ position: 'relative' }}>
            <span className="nav-icon">{ICON.cart}</span>Cart
            {totalItems > 0 && <span style={{ position: 'absolute', top: '-2px', right: '10px', background: 'var(--primary)', color: 'white', fontSize: '0.65rem', fontWeight: '700', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalItems}</span>}
          </Link>
          <Link href="/track" className="nav-item"><span className="nav-icon">{ICON.track}</span>Track</Link>
          <Link href="/profile" className="nav-item"><span className="nav-icon">{ICON.profile}</span>Profile</Link>
        </div>
      </nav>

      {toast && <div className="toast-popup">{toast}</div>}
      {blendOpen && <BlendBuilder addOns={addOns} onClose={() => setBlendOpen(false)} onAdd={addItem} setToast={setToast} />}
      {itemOpen && <ItemCustomizer item={itemOpen} addOns={addOns} onClose={() => setItemOpen(null)} onAdd={addItem} setToast={setToast} isItemAvailableNow={isItemAvailableNow} />}
    </div>
  );
}

function BlendBuilder({ addOns, onClose, onAdd, setToast }) {
  const [base, setBase] = useState(null);
  const [fruits, setFruits] = useState([]);
  const [size, setSize] = useState('medium');

  const bases = [
    { name: 'Milk', price: 30 },
    { name: 'Yogurt', price: 35 },
    { name: 'Coconut Water', price: 40 },
    { name: 'Almond Milk', price: 50 },
    { name: 'Water', price: 0 },
  ];

  const sizes = {
    small: { label: 'Small', ml: '250ml', price: 99 },
    regular: { label: 'Regular', ml: '300ml', price: 129 },
    medium: { label: 'Medium', ml: '400ml', price: 149 },
    large: { label: 'Large', ml: '500ml', price: 199 },
  };

  const fruitAddOns = addOns.filter((a) => a.category === 'fruit');

  function toggleFruit(fruit) {
    const exists = fruits.find((f) => f.name === fruit.name);
    if (exists) return setFruits(fruits.filter((f) => f.name !== fruit.name));
    if (fruits.length >= 3) return;
    setFruits([...fruits, { name: fruit.name, price: fruit.price }]);
  }

  const total = sizes[size].price + (base?.price || 0) + fruits.reduce((s, f) => s + f.price, 0);

  function addBlend() {
    onAdd({
      menuItem: 'custom-blend',
      name: `Custom Blend (${sizes[size].ml})`,
      categoryName: 'Custom Blend',
      recipeType: 'custom-blend',
      image: '',
      basePrice: total,
      quantity: 1,
      selectedBase: base,
      selectedLiquid: null,
      selectedAddOns: fruits,
    });
    setToast('Custom blend added to cart');
    onClose();
  }

  return (
    <div className="blend-overlay">
      <div className="blend-page">
        <div className="blend-header">
          <button className="blend-back" onClick={onClose}>{ICON.back} Back</button>
          <h1 className="blend-title">Customize Your Blend</h1>
          <p className="blend-subtitle">Choose base, fruits, and size.</p>
        </div>

        <div className="blend-content">
          <div className="blend-step">
            <div className="blend-step-header"><span className="blend-step-number">1</span><h3 className="blend-step-title">Base</h3></div>
            <div className="blend-options-grid">
              {bases.map((b) => <button key={b.name} className={`blend-option-card ${base?.name === b.name ? 'selected' : ''}`} onClick={() => setBase(b)}><span className="blend-option-name">{b.name}</span><span className="blend-option-price">{b.price > 0 ? `+ ${price(b.price)}` : 'Free'}</span></button>)}
            </div>
          </div>

          <div className="blend-step">
            <div className="blend-step-header"><span className="blend-step-number">2</span><h3 className="blend-step-title">Fruits (max 3)</h3></div>
            <div className="blend-options-grid">
              {fruitAddOns.map((f) => <button key={f.name} className={`blend-option-card ${fruits.find((x) => x.name === f.name) ? 'selected' : ''}`} onClick={() => toggleFruit(f)}><span className="blend-option-name">{f.name}</span><span className="blend-option-price">+ {price(f.price)}</span></button>)}
            </div>
          </div>

          <div className="blend-step">
            <div className="blend-step-header"><span className="blend-step-number">3</span><h3 className="blend-step-title">Size</h3></div>
            <div className="blend-size-grid">
              {Object.entries(sizes).map(([k, v]) => <button key={k} className={`blend-size-card ${size === k ? 'selected' : ''}`} onClick={() => setSize(k)}><span className="blend-size-label">{v.label}</span><span className="blend-size-detail">{v.ml} - {price(v.price)}</span></button>)}
            </div>
          </div>

          <div className="blend-summary">
            <div className="blend-summary-box">
              <strong>Your Custom Blend</strong>
              <p className="blend-summary-text">{[base?.name, ...fruits.map((f) => f.name)].filter(Boolean).join(', ') || 'Select ingredients...'}</p>
              <div className="blend-summary-total"><span>Total</span><span className="blend-total-price">{price(total)}</span></div>
            </div>
            <button className="btn-add-blend" onClick={addBlend}>Add Custom Blend</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemCustomizer({ item, addOns, onClose, onAdd, setToast, isItemAvailableNow }) {
  const categoryName = getCategoryName(item);
  const isSmoothieItem = isSmoothieCategoryName(categoryName) || String(item?.name || '').toLowerCase().includes('smoothie') || String(item?.name || '').toLowerCase().includes('shake');
  const isBowlItem = isFruitBowlCategoryName(categoryName) || String(item?.name || '').toLowerCase().includes('bowl');

  const effectiveBases = useMemo(() => {
    if ((item.bases?.length || 0) > 0) return item.bases;
    if (isSmoothieItem) return DEFAULT_SMOOTHIE_BASES;
    return [];
  }, [item.bases, isSmoothieItem]);

  const [selectedBase, setSelectedBase] = useState(effectiveBases[0] || null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setSelectedBase(effectiveBases[0] || null);
    setSelectedAddOns([]);
    setQty(1);
  }, [item._id, effectiveBases]);

  function toggle(addon) {
    setSelectedAddOns((prev) => prev.find((a) => a.name === addon.name)
      ? prev.filter((a) => a.name !== addon.name)
      : [...prev, { name: addon.name, price: addon.price }]);
  }

  const total = (item.basePrice + (selectedBase?.price || 0) + selectedAddOns.reduce((s, a) => s + a.price, 0)) * qty;

  async function addCustomized() {
    const available = await isItemAvailableNow(item);
    if (!available) {
      setToast(`${item.name} is currently unavailable`);
      onClose();
      return;
    }

    onAdd({
      menuItem: item._id,
      name: item.name,
      categoryName,
      recipeType: getRecipeTypeForItem(item),
      image: item.image,
      basePrice: item.basePrice,
      quantity: qty,
      selectedBase,
      selectedLiquid: null,
      selectedAddOns,
    });
    setToast(`${item.name} added to cart`);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-customize" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Customize {item.name}</div>
          <button className="modal-close" onClick={onClose}>{ICON.close}</button>
        </div>

        {effectiveBases.length > 0 && (
          <div className="blend-step" style={{ padding: '0 0 12px' }}>
            <div className="blend-step-header"><span className="blend-step-number">1</span><h3 className="blend-step-title">Choose Base</h3></div>
            <div className="blend-options-grid">
              {effectiveBases.map((b, i) => <button key={i} className={`blend-option-card ${selectedBase?.name === b.name ? 'selected' : ''}`} onClick={() => setSelectedBase(b)}><span className="blend-option-name">{b.name}</span><span className="blend-option-price">{b.price > 0 ? `+ ${price(b.price)}` : 'Free'}</span></button>)}
            </div>
          </div>
        )}

        <div className="blend-step" style={{ padding: '0 0 12px' }}>
          <div className="blend-step-header"><span className="blend-step-number">2</span><h3 className="blend-step-title">{isBowlItem ? 'Customize Bowl' : 'Add Extras'}</h3></div>
          <div className="blend-options-grid">
            {addOns.map((a) => <button key={a._id} className={`blend-option-card ${selectedAddOns.find((x) => x.name === a.name) ? 'selected' : ''}`} onClick={() => toggle(a)}><span className="blend-option-name">{a.name}</span><span className="blend-option-price">+ {price(a.price)}</span></button>)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div className="qty-stepper">
            <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
            <span className="qty-value">{qty}</span>
            <button className="qty-btn" onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <button className="btn-add-blend" style={{ flex: 1, marginLeft: '16px' }} onClick={addCustomized}>Add - {price(total)}</button>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return <CartProvider><MenuInner /></CartProvider>;
}
