const express = require('express');
const router = express.Router();
const BookTitle = require('../models/BookTitle');
const Book = require('../models/Book');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET all book titles
router.get('/', async (req, res) => {
    try {
        const q = req.query.q;
        const filter = {};
        if (q) {
            filter.$or = [
                { title: new RegExp(q, 'i') },
                { author: new RegExp(q, 'i') }
            ];
        }

        const titles = await BookTitle.find(filter)
            .sort({ title: 1 })
            .lean();

        // Lấy số lượng bản phát hành của mỗi đầu sách
        const result = await Promise.all(titles.map(async (title) => {
            const editions = await Book.find({ bookTitle: title._id }).countDocuments();
            const copies = await Book.aggregate([
                { $match: { bookTitle: title._id } },
                { $group: { _id: null, total: { $sum: '$soQuyen' } } }
            ]);

            return {
                ...title,
                editions: editions,
                totalCopies: (copies[0] && copies[0].total) || 0
            };
        }));

        res.json({ bookTitles: result });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET one book title
router.get('/:id', async (req, res) => {
    try {
        const title = await BookTitle.findById(req.params.id).lean();
        if (!title) return res.status(404).json({ message: 'Not found' });

        // Lấy tất cả bản phát hành
        const books = await Book.find({ bookTitle: title._id })
            .populate('publisher')
            .sort({ volume: 1, year: -1 })
            .lean();

        res.json({ title, books });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// CREATE book title (admin only)
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { title, author, category, description, totalVolumes } = req.body;
        if (!title) return res.status(400).json({ message: 'Title is required' });

        const bookTitle = new BookTitle({
            title,
            author,
            category,
            description,
            totalVolumes,
            status: 'active'
        });

        await bookTitle.save();
        res.json(bookTitle);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Title already exists' });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// UPDATE book title (admin only)
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const bookTitle = await BookTitle.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bookTitle) return res.status(404).json({ message: 'Not found' });
        res.json(bookTitle);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// DELETE book title (admin only)
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        // Check if any books reference this title
        const booksCount = await Book.countDocuments({ bookTitle: req.params.id });
        if (booksCount > 0) {
            return res.status(400).json({ message: 'Cannot delete - has associated books' });
        }

        await BookTitle.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
