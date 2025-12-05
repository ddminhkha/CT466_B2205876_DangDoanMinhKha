const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // basic auth
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // account status: active or banned
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    // password reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    // reader/staff profile (DocGia / NhanVien)
    hoLot: { type: String },
    ten: { type: String },
    ngaySinh: { type: Date },
    phai: { type: String, enum: ['M', 'F', 'O'] },
    diaChi: { type: String },
    soDienThoai: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
