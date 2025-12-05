const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = {};

auth.verifyToken = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: 'No token' });
    const token = header.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(payload.id).select('-password');
        if (!user) return res.status(401).json({ message: 'Invalid token' });
        // block users with status 'banned'
        if (user.status === 'banned') return res.status(403).json({ message: 'Tài khoản của bạn đang bị khoá' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token', error: err.message });
    }
};

auth.requireRole = (roles = []) => {
    if (typeof roles === 'string') roles = [roles];
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
        next();
    };
};

module.exports = auth;
