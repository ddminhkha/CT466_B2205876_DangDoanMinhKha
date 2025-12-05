const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const Loan = require('../models/Loan');
const Publisher = require('../models/Publisher');
const { verifyToken, requireRole } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'public/uploads/books';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)'));
        }
    }
});

// Helper: Calculate borrowed/reserved quantity for a book
// Count books that are reserved or borrowed (status = requested, approved, borrowed)
// These statuses mean the book is not available for new requests
async function getBorrowedQuantity(bookId) {
    try {
        // Get all loans that have reserved this book (requested, approved, borrowed)
        const loans = await Loan.find({
            books: bookId,
            status: { $in: ['requested', 'approved', 'borrowed'] }
        }).lean();

        // Count how many times this bookId appears across all loans
        let count = 0;
        for (const loan of loans) {
            if (Array.isArray(loan.books)) {
                // Count occurrences of this bookId in the books array
                count += loan.books.filter(id => id.toString() === bookId.toString()).length;
            }
        }

        return count;
    } catch (err) {
        console.error('Error calculating borrowed quantity:', err);
        return 0;
    }
}

// create book (staff/admin)
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        // allow either publisher id or create inline
        const data = req.body;
        if (data.publisher && typeof data.publisher === 'object' && data.publisher.tenNXB) {
            const p = new Publisher({ tenNXB: data.publisher.tenNXB, diaChi: data.publisher.diaChi });
            await p.save();
            data.publisher = p._id;
        }
        const book = new Book(data);
        await book.save();
        res.json(book);
    } catch (err) {
        // Check for duplicate key error (unique index violation)
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Bạn đã thêm 1 quyển sách đã tồn tại trong thư viện' });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// update book
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!book) return res.status(404).json({ message: 'Not found' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// delete book
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// list & search
router.get('/', async (req, res) => {
    try {
        console.log('🔍 Books API Request:', {
            query: req.query,
            hasLimit: !!req.query.limit,
            page: req.query.page,
            limit: req.query.limit
        });

        const q = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const publisher = req.query.publisher;
        const category = req.query.category;
        const year = req.query.year;
        const status = req.query.status;
        const sort = req.query.sort || 'newest';

        const filter = {};
        if (q) {
            filter.$or = [
                { 'bookTitle.title': new RegExp(q, 'i') },
                { 'bookTitle.author': new RegExp(q, 'i') }
            ];
        }

        // Publisher filter
        if (publisher) {
            filter['publisher.tenNXB'] = publisher;
        }

        // Category filter
        if (category) {
            filter['bookTitle.category'] = category;
        }

        // Year filter
        if (year) {
            filter.year = parseInt(year);
        }

        let list;
        let total;
        let sortCriteria = { createdAt: -1 }; // Default sort

        // Set sort criteria
        if (sort === 'name') {
            sortCriteria = { 'bookTitle.title': 1 };
        } else if (sort === 'author') {
            sortCriteria = { 'bookTitle.author': 1 };
        } else if (sort === 'newest') {
            sortCriteria = { createdAt: -1 };
        }

        if (limit) {
            // Phân trang cho user frontend
            const skip = (page - 1) * limit;
            total = await Book.countDocuments(filter);
            list = await Book.find(filter)
                .populate('bookTitle', 'title author description')
                .populate('publisher')
                .sort(sortCriteria)
                .skip(skip)
                .limit(limit)
                .lean();
        } else {
            // Trả về tất cả cho admin
            total = await Book.countDocuments(filter);
            list = await Book.find(filter)
                .populate('bookTitle', 'title author description')
                .populate('publisher')
                .sort(sortCriteria)
                .lean();
        }

        // Calculate available quantity for each book
        const listWithAvailable = await Promise.all(
            list.map(async (b) => {
                const borrowed = await getBorrowedQuantity(b._id);
                const total = b.soQuyen || 0;
                const available = total - borrowed;

                return {
                    ...b,
                    totalQuantity: total,
                    borrowedQuantity: borrowed,
                    availableQuantity: available
                };
            })
        );

        let out;
        // If user is authenticated, check for their active loans
        if (req.headers.authorization) {
            try {
                const jwt = require('jsonwebtoken');
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;
                console.log('🔍 Books API - User ID:', userId); // Debug log

                // Get user's active loans containing these books
                const bookIds = list.map(b => b._id);
                const userActiveLoans = await Loan.find({
                    user: userId,
                    books: { $in: bookIds },
                    status: { $nin: ['returned', 'rejected', 'cancelled'] }
                }).lean();

                console.log('📋 Active loans for user:', userActiveLoans.length); // Debug log

                // Create set of book IDs user has active loans for
                const userBorrowedBookIds = new Set();
                userActiveLoans.forEach(loan => {
                    if (Array.isArray(loan.books)) {
                        loan.books.forEach(bookId => userBorrowedBookIds.add(bookId.toString()));
                    }
                });

                console.log('📖 User borrowed book IDs:', Array.from(userBorrowedBookIds)); // Debug log

                // Mark books as reserved/borrowed for this user
                out = listWithAvailable.map(b => {
                    const hasLoan = userBorrowedBookIds.has(b._id.toString());
                    const title = b.bookTitle?.title || 'Untitled';
                    console.log(`Book ${title}: userHasActiveLoan=${hasLoan}`); // Debug each book
                    return {
                        ...b,
                        title: title,
                        author: b.bookTitle?.author || '',
                        soQuyen: b.availableQuantity, // Available quantity for display
                        reserved: b.availableQuantity <= 0,
                        userHasActiveLoan: hasLoan
                    };
                });
            } catch (authErr) {
                // If token invalid, just use global reservation logic
                out = listWithAvailable.map(b => ({
                    ...b,
                    title: b.bookTitle?.title || 'Untitled',
                    author: b.bookTitle?.author || '',
                    soQuyen: b.availableQuantity, // Available quantity for display
                    reserved: b.availableQuantity <= 0,
                    userHasActiveLoan: false
                }));
            }
        } else {
            // No auth token, use basic reservation logic
            out = listWithAvailable.map(b => ({
                ...b,
                title: b.bookTitle?.title || 'Untitled',
                author: b.bookTitle?.author || '',
                soQuyen: b.availableQuantity, // Available quantity for display
                reserved: b.availableQuantity <= 0,
                userHasActiveLoan: false
            }));
        }

        // Apply status filter after calculating availability
        if (status && status !== 'all') {
            if (status === 'available') {
                out = out.filter(b => (b.soQuyen || 0) > 0);
            } else if (status === 'borrowed') {
                out = out.filter(b => (b.soQuyen || 0) <= 0);
            }
        }

        // Update total count after filtering
        if (status && status !== 'all') {
            total = out.length;
            // Re-paginate if necessary
            if (limit) {
                const skip = (page - 1) * limit;
                out = out.slice(skip, skip + limit);
            }
        }

        // Trả về dữ liệu với thông tin phân trang (nếu có limit)
        if (limit) {
            const paginationData = {
                books: out,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
            console.log('📄 Pagination response:', JSON.stringify(paginationData.pagination, null, 2));
            res.json(paginationData);
        } else {
            // Trả về tất cả sách cho admin (không phân trang)
            console.log('📚 All books response:', out.length, 'books');
            res.json({ books: out });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// get one
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('bookTitle', 'title author description')
            .populate('publisher')
            .lean();
        if (!book) return res.status(404).json({ message: 'Not found' });

        // Calculate available quantity
        const borrowedQuantity = await getBorrowedQuantity(book._id);
        const availableQuantity = (book.soQuyen || 0) - borrowedQuantity;

        // Mark as reserved if no copies available
        book.totalQuantity = book.soQuyen || 0;
        book.borrowedQuantity = borrowedQuantity;
        book.availableQuantity = availableQuantity;
        book.reserved = availableQuantity <= 0;

        res.json(book);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// UPLOAD cover image (admin only)
router.post('/:id/cover', verifyToken, requireRole(['admin']), upload.single('cover'), async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        // Delete old cover image if it's a file (not URL)
        if (book.coverImage && book.coverImage.startsWith('/uploads/')) {
            const oldPath = path.join('public', book.coverImage);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Save new cover path
        book.coverImage = '/uploads/books/' + req.file.filename;
        await book.save();

        res.json({ coverImage: book.coverImage });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// DELETE cover image (admin only)
router.delete('/:id/cover', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        if (!book.coverImage) {
            return res.status(404).json({ message: 'No cover image to delete' });
        }

        // Delete file if it's a local upload (not URL)
        if (book.coverImage.startsWith('/uploads/')) {
            const filePath = path.join('public', book.coverImage);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Clear coverImage field
        book.coverImage = null;
        await book.save();

        res.json({ message: 'Cover image deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
