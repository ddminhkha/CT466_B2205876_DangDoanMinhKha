const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../../services/emailService');

// register
router.post('/register', async (req, res) => {
    // Accept profile fields but do NOT accept role/status from client
    const { email, password, hoLot, ten, ngaySinh, phai, diaChi, soDienThoai } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Validate Vietnamese phone number if provided
    if (soDienThoai) {
        const vnPhoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
        if (!vnPhoneRegex.test(soDienThoai)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam (10 số, đầu số 03/05/07/08/09)' });
        }
    }

    // Validate field lengths
    if (hoLot && hoLot.length > 100) return res.status(400).json({ message: 'Họ và tên lót quá dài (tối đa 100 ký tự)' });
    if (ten && ten.length > 50) return res.status(400).json({ message: 'Tên quá dài (tối đa 50 ký tự)' });
    if (diaChi && diaChi.length > 200) return res.status(400).json({ message: 'Địa chỉ quá dài (tối đa 200 ký tự)' });

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Email exists' });
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const doc = { email, password: hash };
        if (hoLot) doc.hoLot = hoLot;
        if (ten) doc.ten = ten;
        if (ngaySinh) {
            const d = new Date(ngaySinh);
            if (!isNaN(d)) doc.ngaySinh = d;
        }
        if (phai) doc.phai = phai;
        if (diaChi) doc.diaChi = diaChi;
        if (soDienThoai) doc.soDienThoai = soDienThoai;

        user = new User(doc);
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        const name = ((user.hoLot || '') + ' ' + (user.ten || '')).trim() || undefined;
        res.json({ token, user: { id: user._id, name, email: user.email, role: user.role, status: user.status } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            console.log('Invalid password for:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if account is banned
        if (user.status === 'banned') {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        const name = ((user.hoLot || '') + ' ' + (user.ten || '')).trim() || undefined;
        res.json({ token, user: { id: user._id, name, email: user.email, role: user.role, status: user.status } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// forgot password - send reset email
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not (security best practice)
            return res.json({ message: 'If that email exists, a password reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Save token and expiry (15 minutes)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Send email with reset link
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(user.email, resetUrl);

        res.json({ message: 'If that email exists, a password reset link has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// reset password - verify token and update password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        // Hash the token from URL to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token and not expired
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password and update
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
