'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function StaffLoginPage() {
    const router = useRouter();
    const { isLoggedIn, customer, staffLogin } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isLoggedIn) return;
        if (customer?.role === 'admin' || customer?.isAdmin) {
            router.replace('/admin');
            return;
        }
        if (customer?.role === 'staff') {
            router.replace('/staff');
        }
    }, [isLoggedIn, customer, router]);

    async function handleSubmit(e) {
        e.preventDefault();
        const cleanUsername = username.trim().toLowerCase();
        if (!cleanUsername || !password) {
            setError('Enter username and password');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const res = await staffLogin(cleanUsername, password);
            if (!res.success) {
                setError(res.message || 'Login failed');
                return;
            }
            const role = res.data?.customer?.role;
            if (role === 'admin') {
                router.push('/admin');
                return;
            }
            router.push('/staff');
        } catch (err) {
            setError('Failed to login. Try again.');
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

            <div className="container" style={{ maxWidth: '420px', paddingTop: '28px' }}>
                <div className="card">
                    <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Staff Login</h1>
                    <p className="page-subtitle" style={{ marginBottom: '18px' }}>
                        Use your admin or staff credentials.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin or staff username"
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <div className="form-error" style={{ marginBottom: '12px' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Link href="/login" style={{ fontSize: '0.9rem' }}>
                        Customer login
                    </Link>
                </div>
            </div>
        </div>
    );
}
