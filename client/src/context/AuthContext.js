'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const TOKEN_KEY = 'poshanpoint_auth_token';
const CUSTOMER_KEY = 'poshanpoint_customer';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
    const [customer, setCustomer] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const isLoggedIn = !!customer && !!token;

    const logout = useCallback(() => {
        setToken(null);
        setCustomer(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(CUSTOMER_KEY);
    }, []);

    async function verifyToken(authToken) {
        try {
            const authHeaders = { headers: { Authorization: `Bearer ${authToken}` } };

            const staffRes = await fetch(`${API_BASE}/staff-auth/me`, authHeaders);
            if (staffRes.ok) {
                const staffPayload = await staffRes.json();
                if (staffPayload.success) {
                    setCustomer(staffPayload.data);
                    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(staffPayload.data));
                    return true;
                }
            }

            const customerRes = await fetch(`${API_BASE}/auth/me`, authHeaders);
            if (customerRes.ok) {
                const customerPayload = await customerRes.json();
                if (customerPayload.success) {
                    setCustomer(customerPayload.data);
                    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customerPayload.data));
                    return true;
                }
            }

            logout();
            return false;
        } catch (err) {
            console.error('Token verification failed:', err);
            return false;
        }
    }

    useEffect(() => {
        try {
            const savedToken = localStorage.getItem(TOKEN_KEY);
            const savedCustomer = localStorage.getItem(CUSTOMER_KEY);
            if (savedToken && savedCustomer) {
                setToken(savedToken);
                setCustomer(JSON.parse(savedCustomer));
                verifyToken(savedToken);
            }
        } catch (e) {
            console.error('Failed to load auth session:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    async function sendOtp(phone) {
        const res = await fetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        return res.json();
    }

    async function verifyOtp(phone, otp, consent = true) {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp, consent }),
        });
        const data = await res.json();

        if (data.success) {
            const { token: newToken, customer: customerData } = data.data;
            setToken(newToken);
            setCustomer(customerData);
            localStorage.setItem(TOKEN_KEY, newToken);
            localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customerData));
        }

        return data;
    }

    async function staffLogin(username, password) {
        const res = await fetch(`${API_BASE}/staff-auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();

        if (data.success) {
            const { token: newToken, customer: staffData } = data.data;
            setToken(newToken);
            setCustomer(staffData);
            localStorage.setItem(TOKEN_KEY, newToken);
            localStorage.setItem(CUSTOMER_KEY, JSON.stringify(staffData));
        }

        return data;
    }

    async function refreshProfile() {
        if (!token) return;
        await verifyToken(token);
    }

    function getAuthHeaders() {
        if (!token) return {};
        return { Authorization: `Bearer ${token}` };
    }

    return (
        <AuthContext.Provider value={{
            customer,
            token,
            isLoggedIn,
            loading,
            sendOtp,
            verifyOtp,
            staffLogin,
            logout,
            refreshProfile,
            getAuthHeaders,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
