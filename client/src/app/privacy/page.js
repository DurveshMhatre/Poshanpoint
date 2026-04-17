import Link from 'next/link';
import Image from 'next/image';

export const metadata = { title: 'Privacy Policy - PoshanPoint' };

export default function PrivacyPage() {
    return (
        <div className="page">
            <header className="app-header">
                <div className="header-inner">
                    <Link href="/" className="header-logo">
                        <Image src="/images/logo-landscape.png" alt="PoshanPoint" width={160} height={40} style={{ height: '32px', width: 'auto' }} />
                    </Link>
                </div>
            </header>
            <div className="container" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
                <h1 className="page-title">Privacy Policy</h1>
                <p className="page-subtitle" style={{ marginBottom: '24px' }}>Last updated: February 2026</p>

                <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.9rem' }}>
                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>1. Information We Collect</h2>
                    <p>We collect only the minimal information necessary to process your order:</p>
                    <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                        <li>Your name (for order identification)</li>
                        <li>Your mobile number (for order communication)</li>
                        <li>Order details (items, customizations, preferences)</li>
                    </ul>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>2. What We Do NOT Collect</h2>
                    <ul style={{ paddingLeft: '24px' }}>
                        <li>No medical or health data</li>
                        <li>No account credentials or passwords</li>
                        <li>No payment card details (handled securely by Razorpay)</li>
                        <li>No location or tracking data</li>
                    </ul>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>3. Payment Security</h2>
                    <p>All payments are processed securely through Razorpay, a PCI-DSS compliant payment gateway. We do not store, process, or have access to your payment card information.</p>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>4. Data Usage</h2>
                    <p>Your information is used solely for:</p>
                    <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                        <li>Processing and fulfilling your food orders</li>
                        <li>Communicating order status updates</li>
                        <li>Improving our menu and service quality</li>
                    </ul>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>5. Data Retention</h2>
                    <p>Order information is retained for business records and may be deleted upon request by contacting our team.</p>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>6. Contact</h2>
                    <p>For privacy concerns, please contact us at the service counter or email us at privacy@poshanpoint.com.</p>
                </div>

                <Link href="/" className="btn btn-secondary" style={{ marginTop: '32px' }}>← Back to Home</Link>
            </div>
        </div>
    );
}
