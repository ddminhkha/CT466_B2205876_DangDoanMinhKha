const mongoose = require('mongoose');

const publisherSchema = new mongoose.Schema({
    tenNXB: { type: String, required: true },
    diaChi: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Publisher', publisherSchema);
