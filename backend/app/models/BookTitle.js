const mongoose = require('mongoose');

const bookTitleSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    author: { type: String },
    category: { type: String },
    description: { type: String },
    totalVolumes: { type: Number }, // null = ongoing, hoặc số tập
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BookTitle', bookTitleSchema);
