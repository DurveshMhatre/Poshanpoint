'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="page" style={{ background: 'var(--bg-hero)' }}>
      <div className="container">
        <div className="landing-hero">
          <Image
            src="/images/logo-portrait.png"
            alt="PoshanPoint Logo"
            width={150}
            height={150}
            className="landing-logo"
            priority
          />
          <div className="landing-brand">
            <span className="brand-red">Poshan</span><span className="brand-green">Point</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, fontStyle: 'italic', marginBottom: '8px' }}>
            Daily Poshan, Better Performance
          </p>
          <p className="landing-tagline">
            Fresh smoothie bowls, protein shakes & healthy bites — order from your phone!
          </p>

          <div className="landing-features">
            <div className="landing-feature animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="landing-feature-icon">📱</div>
              <div className="landing-feature-text">Order from your phone, no app needed</div>
            </div>
            <div className="landing-feature animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="landing-feature-icon">🎨</div>
              <div className="landing-feature-text">Customize every item your way</div>
            </div>
            <div className="landing-feature animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="landing-feature-icon" style={{ background: 'var(--warning-bg)' }}>⚡</div>
              <div className="landing-feature-text">Instant order updates in real-time</div>
            </div>
            <div className="landing-feature animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="landing-feature-icon" style={{ background: 'var(--info-bg)' }}>💳</div>
              <div className="landing-feature-text">Secure UPI & card payments</div>
            </div>
          </div>

          <Link href="/menu" className="btn btn-primary btn-lg" style={{ fontSize: '1.15rem', padding: '18px 48px' }}>
            🍽️ Start Ordering
          </Link>

          <div style={{ marginTop: '32px', display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
              🔐 Login / Sign Up
            </Link>
            <Link href="/privacy" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
