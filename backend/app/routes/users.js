const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');

// admin: list users
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const list = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// get profile (self) - MUST be before /:id routes
router.get('/me', verifyToken, async (req, res) => {
    res.json(req.user);
});

// update own profile - MUST be before /:id routes
router.put('/me', verifyToken, async (req, res) => {
    try {
        const allowed = ['hoLot', 'ten', 'ngaySinh', 'phai', 'diaChi', 'soDienThoai', 'password', 'currentPassword'];
        const updates = {};
        for (const k of allowed) {
            if (req.body[k] !== undefined && req.body[k] !== '') {
                updates[k] = req.body[k];
            }
        }

        // Validate field lengths
        if (updates.hoLot && updates.hoLot.length > 100) {
            return res.status(400).json({ message: 'Họ và tên lót quá dài (tối đa 100 ký tự)' });
        }
        if (updates.ten && updates.ten.length > 50) {
            return res.status(400).json({ message: 'Tên quá dài (tối đa 50 ký tự)' });
        }
        if (updates.diaChi && updates.diaChi.length > 200) {
            return res.status(400).json({ message: 'Địa chỉ quá dài (tối đa 200 ký tự)' });
        }

        // Validate Vietnamese phone number if provided
        if (updates.soDienThoai) {
            const vnPhoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
            if (!vnPhoneRegex.test(updates.soDienThoai)) {
                return res.status(400).json({ message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam (10 số, đầu số 03/05/07/08/09)' });
            }
        }

        // handle password change with verification
        if (updates.password) {
            // Validate password length
            if (updates.password.length < 6 || updates.password.length > 100) {
                return res.status(400).json({ message: 'Mật khẩu phải từ 6 đến 100 ký tự' });
            }

            // Require current password for security
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ để xác thực' });
            }

            // Verify current password
            const user = await User.findById(req.user._id);
            const isValidPassword = await bcrypt.compare(req.body.currentPassword, user.password);

            if (!isValidPassword) {
                return res.status(401).json({ message: 'Mật khẩu cũ không đúng' });
            }

            // Hash new password
            const hash = await bcrypt.hash(updates.password, 10);
            updates.password = hash;
        }

        // Remove currentPassword from updates (don't save it to DB)
        delete updates.currentPassword;

        // parse date
        if (updates.ngaySinh) {
            const d = new Date(updates.ngaySinh);
            if (!isNaN(d)) updates.ngaySinh = d;
            else delete updates.ngaySinh;
        }

        const u = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        res.json(u);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// admin: change role
router.put('/:id/role', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
        const u = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        res.json(u);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// admin: update user profile (email, hoLot, ten, ngaySinh, phai, diaChi, soDienThoai, role)
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const allowed = ['email', 'hoLot', 'ten', 'ngaySinh', 'phai', 'diaChi', 'soDienThoai', 'role', 'password'];
        const updates = {};
        for (const k of allowed) {
            if (req.body[k] !== undefined) updates[k] = req.body[k];
        }
        // handle password hashing
        if (updates.password) {
            const hash = await bcrypt.hash(updates.password, 10);
            updates.password = hash;
        }
        // prevent invalid role
        if (updates.role && !['user', 'admin'].includes(updates.role)) return res.status(400).json({ message: 'Invalid role' });
        // parse date
        if (updates.ngaySinh) {
            const d = new Date(updates.ngaySinh);
            if (!isNaN(d)) updates.ngaySinh = d;
            else delete updates.ngaySinh;
        }
        const u = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        res.json(u);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// admin: create user
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { email, password, hoLot, ten, ngaySinh, phai, diaChi, soDienThoai, role } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing email/password' });
        let exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email exists' });
        const hash = await bcrypt.hash(password, 10);
        const u = new User({ email, password: hash, hoLot, ten, ngaySinh, phai, diaChi, soDienThoai, role: role || 'user' });
        await u.save();
        res.json({ ok: true, id: u._id });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// admin: update account status (active | banned)
router.put('/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'banned'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
        const u = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
        res.json(u);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// admin/staff can view a specific user
router.get('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const u = await User.findById(req.params.id).select('-password');
        res.json(u);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// admin: delete user
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// register (public) - override auth register if needed, but keep here for profile
router.post('/register', async (req, res) => {
    try {
        const { email, password, hoLot, ten, ngaySinh, phai, diaChi, soDienThoai } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing email/password' });
        let exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email exists' });
        const hash = await bcrypt.hash(password, 10);
        const u = new User({ email, password: hash, hoLot, ten, ngaySinh, phai, diaChi, soDienThoai, role: 'user' });
        await u.save();
        res.json({ ok: true, id: u._id });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
