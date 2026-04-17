import Link from 'next/link';
import Image from 'next/image';

export const metadata = { title: 'Terms of Service - PoshanPoint' };

export default function TermsPage() {
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
                <h1 className="page-title">Terms of Service</h1>
                <p className="page-subtitle" style={{ marginBottom: '24px' }}>Last updated: February 2026</p>

                <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.9rem' }}>
                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>1. Service Description</h2>
                    <p>PoshanPoint provides a phone-based kiosk ordering system for food and beverages. Orders are placed through our web application and served at the physical counter.</p>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>2. Order Policy</h2>
                    <ul style={{ paddingLeft: '24px' }}>
                        <li>All orders are final once payment is confirmed</li>
                        <li>Orders must be collected at the counter</li>
                        <li>No delivery service is provided</li>
                        <li>We reserve the right to cancel orders due to availability</li>
                    </ul>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>3. Nutritional Disclaimer</h2>
                    <p style={{ fontWeight: '600', color: 'var(--warning)' }}>Our food service provides general nutritional options and does NOT constitute medical advice. Please consult a healthcare professional for dietary or medical guidance.</p>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>4. Payment</h2>
                    <ul style={{ paddingLeft: '24px' }}>
                        <li>Payments are processed securely via Razorpay</li>
                        <li>Prices are in Indian Rupees (INR) and inclusive of applicable taxes</li>
                        <li>Refunds will be processed within 5-7 business days for cancelled orders</li>
                    </ul>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>5. Allergies & Ingredients</h2>
                    <p>Customers with food allergies should inform the staff before placing an order. While we take precautions, cross-contamination may occur.</p>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>6. Modifications</h2>
                    <p>We reserve the right to update these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>

                    <h2 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>7. Contact</h2>
                    <p>For questions about these terms, please contact us at the service counter or email support@poshanpoint.com.</p>
                </div>

                <Link href="/" className="btn btn-secondary" style={{ marginTop: '32px' }}>← Back to Home</Link>
            </div>
        </div>
    );
}
