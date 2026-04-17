const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const REQUEST_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 15000);

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('poshanpoint_auth_token');
}

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = getToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const rawHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };
    const headers = Object.fromEntries(
        Object.entries(rawHeaders).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

    try {
        const res = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
            ? await res.json()
            : { success: res.ok, message: await res.text() };

        if (!res.ok) {
            const message = data?.message || `Request failed (${res.status})`;
            const err = new Error(message);
            err.status = res.status;
            err.details = data;
            throw err;
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        console.error(`API Error [${endpoint}]`, error);
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

export const getCategories = () => request('/menu/categories');
export const getMenuItems = (categoryId) =>
    request(`/menu/items${categoryId ? `?category=${categoryId}` : ''}`);
export const getMenuItem = (id) => request(`/menu/items/${id}`);
export const getAddOns = () => request('/menu/addons');

export const createOrder = (orderData) =>
    request('/orders', { method: 'POST', body: JSON.stringify(orderData) });
export const getOrders = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? `?${query}` : ''}`);
};
export const getOrder = (orderId) => {
    const safeOrderId = encodeURIComponent(String(orderId || '').trim().replace(/^#/, ''));
    return request(`/orders/${safeOrderId}`, {
        headers: {
            Authorization: undefined,
        },
    });
};
export const updateOrderStatus = (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const createPaymentOrder = (amount) =>
    request('/payments/create-order', { method: 'POST', body: JSON.stringify({ amount }) });
export const verifyPayment = (paymentData) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify(paymentData) });

export const sendOtp = (phone) =>
    request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
export const verifyOtpApi = (phone, otp, consent) =>
    request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp, consent }) });
export const getAuthProfile = () => request('/auth/me');
export const staffLoginApi = (username, password) =>
    request('/staff-auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const getStaffProfileApi = () => request('/staff-auth/me');

export const getProfile = () => request('/customers/profile');
export const updateProfile = (data) =>
    request('/customers/profile', { method: 'PATCH', body: JSON.stringify(data) });

export const getFavorites = () => request('/customers/favorites');
export const saveFavorite = (blendData) =>
    request('/customers/favorites', { method: 'POST', body: JSON.stringify(blendData) });
export const deleteFavorite = (id) =>
    request(`/customers/favorites/${id}`, { method: 'DELETE' });

export const getOrderHistory = (page = 1) =>
    request(`/customers/orders?page=${page}&limit=10`);
export const reorderItems = (orderId) =>
    request(`/customers/orders/${orderId}/reorder`, { method: 'POST' });

export const getLoyalty = () => request('/customers/loyalty');
export const getSubscription = () => request('/customers/subscription');

export const getAdminCategories = () => request('/admin/categories');
export const createCategory = (data) =>
    request('/admin/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id, data) =>
    request(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteCategory = (id) =>
    request(`/admin/categories/${id}`, { method: 'DELETE' });

export const getAdminItems = () => request('/admin/items');
export const uploadAdminImage = (payload) =>
    request('/admin/upload-image', { method: 'POST', body: JSON.stringify(payload) });
export const createMenuItem = (data) =>
    request('/admin/items', { method: 'POST', body: JSON.stringify(data) });
export const updateMenuItem = (id, data) =>
    request(`/admin/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteMenuItem = (id) =>
    request(`/admin/items/${id}`, { method: 'DELETE' });

export const getAdminAddOns = () => request('/admin/addons');
export const createAddOn = (data) =>
    request('/admin/addons', { method: 'POST', body: JSON.stringify(data) });
export const updateAddOn = (id, data) =>
    request(`/admin/addons/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAddOn = (id) =>
    request(`/admin/addons/${id}`, { method: 'DELETE' });

export const getStats = () => request('/admin/stats');
export const exportOrders = async (startDate, endDate) => {
    const token = getToken();
    const query = new URLSearchParams({ startDate, endDate }).toString();
    const res = await fetch(`${API_BASE}/admin/export?${query}`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!res.ok) {
        let message = `Export failed (${res.status})`;
        try {
            const data = await res.json();
            if (data?.message) message = data.message;
        } catch (_) {
            // no-op
        }
        throw new Error(message);
    }

    return res.blob();
};
