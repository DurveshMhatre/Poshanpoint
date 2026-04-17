'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { isLoggedIn, sendOtp, verifyOtp } = useAuth();
    const [step, setStep] = useState('phone'); // 'phone' or 'otp'
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [consent, setConsent] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const otpRefs = useRef([]);

    useEffect(() => {
        if (isLoggedIn) router.replace('/profile');
    }, [isLoggedIn, router]);

    async function handleSendOtp() {
        if (!phone || phone.length < 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const res = await sendOtp(phone);
            if (res.success) {
                setStep('otp');
                setSuccess('OTP sent to your mobile number');
                if (res.devOtp) setDevOtp(res.devOtp);
                // Focus first OTP input
                setTimeout(() => otpRefs.current[0]?.focus(), 100);
            } else {
                setError(res.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleOtpChange(index, value) {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-verify when all 6 digits entered
        if (value && index === 5 && newOtp.every(d => d)) {
            handleVerifyOtp(newOtp.join(''));
        }
    }

    function handleOtpKeyDown(index, e) {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    }

    function handleOtpPaste(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newOtp = pasted.split('');
            setOtp(newOtp);
            otpRefs.current[5]?.focus();
            handleVerifyOtp(pasted);
        }
    }

    async function handleVerifyOtp(otpStr) {
        const otpValue = otpStr || otp.join('');
        if (otpValue.length !== 6) {
            setError('Please enter the complete 6-digit OTP');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const res = await verifyOtp(phone, otpValue, consent);
            if (res.success) {
                setSuccess(res.message);
                setTimeout(() => router.push('/profile'), 800);
            } else {
                setError(res.message || 'Invalid OTP');
                setOtp(['', '', '', '', '', '']);
                otpRefs.current[0]?.focus();
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
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

            <div className="container" style={{ maxWidth: '420px', margin: '0 auto', padding: '24px 16px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔐</div>
                    <h1 className="page-title" style={{ marginBottom: '8px' }}>
                        {step === 'phone' ? 'Login / Sign Up' : 'Enter OTP'}
                    </h1>
                    <p className="page-subtitle">
                        {step === 'phone'
                            ? 'Enter your mobile number to get started'
                            : `We sent a 6-digit code to +91 ${phone}`
                        }
                    </p>
                </div>

                {step === 'phone' ? (
                    /* STEP 1: Phone Number */
                    <div>
                        <div className="form-group">
                            <label className="form-label">Mobile Number</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    padding: '12px 14px', background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)', fontWeight: '600',
                                    color: 'var(--text-secondary)', fontSize: '0.95rem',
                                    border: '1px solid var(--border)'
                                }}>+91</span>
                                <input
                                    type="tel"
                                    placeholder="Enter 10-digit number"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    style={{ flex: 1, fontSize: '1.1rem', letterSpacing: '1px' }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '16px' }}>
                            <label style={{
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                                cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)',
                                lineHeight: 1.5
                            }}>
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={e => setConsent(e.target.checked)}
                                    style={{ marginTop: '3px', flexShrink: 0 }}
                                />
                                I agree to data usage for order personalization. My preferences and order history will be saved to improve my experience.
                            </label>
                        </div>

                        <button
                            className="btn btn-primary btn-block btn-lg"
                            onClick={handleSendOtp}
                            disabled={loading || phone.length < 10}
                            style={{ marginTop: '24px' }}
                        >
                            {loading ? (
                                <><div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>Sending OTP...</>
                            ) : (
                                <>📱 Send OTP</>
                            )}
                        </button>
                    </div>
                ) : (
                    /* STEP 2: OTP Verification */
                    <div>
                        <div className="otp-input-group">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => otpRefs.current[i] = el}
                                    type="tel"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    onPaste={i === 0 ? handleOtpPaste : undefined}
                                    className="otp-input"
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        {devOtp && (
                            <div style={{
                                background: 'var(--info-bg)', color: 'var(--info)',
                                padding: '10px 16px', borderRadius: 'var(--radius-md)',
                                fontSize: '0.85rem', textAlign: 'center', marginTop: '12px'
                            }}>
                                🧪 Dev Mode OTP: <strong>{devOtp}</strong>
                            </div>
                        )}

                        <button
                            className="btn btn-primary btn-block btn-lg"
                            onClick={() => handleVerifyOtp()}
                            disabled={loading || otp.some(d => !d)}
                            style={{ marginTop: '24px' }}
                        >
                            {loading ? (
                                <><div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>Verifying...</>
                            ) : (
                                <>✅ Verify & Login</>
                            )}
                        </button>

                        <button
                            className="btn btn-secondary btn-block"
                            onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); setDevOtp(''); }}
                            style={{ marginTop: '12px' }}
                        >
                            ← Change Number
                        </button>
                    </div>
                )}

                {/* Messages */}
                {error && (
                    <div style={{
                        background: 'var(--error-bg)', color: 'var(--error)',
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem', marginTop: '16px', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}
                {success && !error && (
                    <div style={{
                        background: 'var(--success-bg)', color: 'var(--success)',
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem', marginTop: '16px', textAlign: 'center'
                    }}>
                        {success}
                    </div>
                )}

                {/* Skip login */}
                <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '20px' }}>
                    <Link href="/menu" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Skip login & order as guest →
                    </Link>
                </div>
            </div>
        </div>
    );
}
