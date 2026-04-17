const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const StaffAccount = require('../models/StaffAccount');

const DEFAULT_DEV_SECRET = 'poshanpoint_jwt_secret_dev';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_SECRET;

if (process.env.NODE_ENV === 'production' && JWT_SECRET === DEFAULT_DEV_SECRET) {
    throw new Error('JWT_SECRET must be set in production');
}

function getAdminPhones() {
    const raw = process.env.ADMIN_PHONES || '';
    return new Set(
        raw
            .split(',')
            .map((phone) => phone.replace(/\D/g, '').slice(-10))
            .filter(Boolean)
    );
}

const adminPhones = getAdminPhones();

function isAdminCustomer(customer) {
    if (!customer) return false;
    const customerPhone = String(customer.phone || '').replace(/\D/g, '').slice(-10);
    return Boolean(customer.isAdmin || adminPhones.has(customerPhone));
}

function generateToken(customerId) {
    return jwt.sign({ id: customerId }, JWT_SECRET, { expiresIn: '30d' });
}

function generateStaffToken(staff) {
    const id = staff?._id || staff?.id || staff;
    const role = staff?.role || 'staff';
    return jwt.sign({ id, type: 'staff', role }, JWT_SECRET, { expiresIn: '12h' });
}

function getBearerToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1];
}

function getAuthErrorMessage(error) {
    if (error?.name === 'TokenExpiredError') return 'Session expired. Please login again.';
    return 'Invalid authentication';
}

function isStaffToken(decoded) {
    return Boolean(decoded?.type === 'staff');
}

async function getActiveCustomer(decoded) {
    if (!decoded?.id || isStaffToken(decoded)) return null;
    const customer = await Customer.findById(decoded.id).select('-loyaltyHistory');
    return customer && customer.isActive ? customer : null;
}

async function getActiveStaff(decoded) {
    if (!decoded?.id || !isStaffToken(decoded)) return null;
    const staff = await StaffAccount.findById(decoded.id).select('-passwordHash -passwordSalt');
    return staff && staff.isActive ? staff : null;
}

async function requireAuth(req, res, next) {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const customer = await getActiveCustomer(decoded);

        if (!customer) {
            return res.status(401).json({ success: false, message: 'Account not found or inactive' });
        }

        req.customer = customer;
        req.staff = null;
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: getAuthErrorMessage(error) });
    }
}

async function requireStaffAuth(req, res, next) {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const staff = await getActiveStaff(decoded);
        if (!staff) {
            return res.status(401).json({ success: false, message: 'Staff authentication required' });
        }

        req.staff = staff;
        req.customer = null;
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: getAuthErrorMessage(error) });
    }
}

async function requireAdmin(req, res, next) {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const staff = await getActiveStaff(decoded);
        if (staff) {
            if (staff.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }
            req.staff = staff;
            req.customer = null;
            return next();
        }

        const customer = await getActiveCustomer(decoded);
        if (!customer || !isAdminCustomer(customer)) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        req.customer = customer;
        req.staff = null;
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: getAuthErrorMessage(error) });
    }
}

async function requireStaffOrAdmin(req, res, next) {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const staff = await getActiveStaff(decoded);
        if (staff) {
            if (!['staff', 'admin'].includes(staff.role)) {
                return res.status(403).json({ success: false, message: 'Staff access required' });
            }
            req.staff = staff;
            req.customer = null;
            return next();
        }

        const customer = await getActiveCustomer(decoded);
        if (!customer || !isAdminCustomer(customer)) {
            return res.status(403).json({ success: false, message: 'Staff access required' });
        }

        req.customer = customer;
        req.staff = null;
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: getAuthErrorMessage(error) });
    }
}

async function optionalAuth(req, res, next) {
    try {
        const token = getBearerToken(req);
        if (!token) {
            req.customer = null;
            req.staff = null;
            return next();
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const staff = await getActiveStaff(decoded);
        if (staff) {
            req.staff = staff;
            req.customer = null;
            return next();
        }

        const customer = await getActiveCustomer(decoded);
        req.customer = customer || null;
        req.staff = null;
        return next();
    } catch (error) {
        req.customer = null;
        req.staff = null;
        return next();
    }
}

module.exports = {
    generateToken,
    generateStaffToken,
    requireAuth,
    requireStaffAuth,
    requireStaffOrAdmin,
    optionalAuth,
    requireAdmin,
    isAdminCustomer,
};
