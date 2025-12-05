const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    // Tham chiếu đến BookTitle (đầu sách)
    bookTitle: { type: mongoose.Schema.Types.ObjectId, ref: 'BookTitle', required: true },

    // Thông tin bản phát hành cụ thể
    volume: { type: Number }, // Số tập (null nếu không phải series)
    publisher: { type: mongoose.Schema.Types.ObjectId, ref: 'Publisher' },
    year: { type: Number }, // Năm xuất bản
    language: { type: String, default: 'Vietnamese' }, // Ngôn ngữ

    // Thông tin kho
    soQuyen: { type: Number, default: 1 }, // Số lượng (tương thích với code cũ)
    donGia: { type: Number, default: 0 }, // Đơn giá

    // Ảnh bìa (upload file hoặc URL)
    coverImage: { type: String },

    createdAt: { type: Date, default: Date.now }
});

// Add virtual for availableQuantity (calculated from Loan data)
bookSchema.virtual('availableQuantity').get(function () {
    // Note: This will be populated by API middleware
    return this._availableQuantity || this.soQuyen;
});

// Unique index: Không thể thêm 2 bản phát hành giống hệt nhau
bookSchema.index({
    bookTitle: 1,
    volume: 1,
    publisher: 1,
    year: 1,
    language: 1
}, { unique: true, sparse: true });

// Include virtuals in JSON response
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);
