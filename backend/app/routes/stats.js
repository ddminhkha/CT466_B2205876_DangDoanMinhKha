const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Loan = require('../models/Loan');
const User = require('../models/User');
const Publisher = require('../models/Publisher');
const { verifyToken, requireRole } = require('../middleware/auth');

// Helper function to get date range filter
const getDateFilter = (period) => {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return { $gte: startDate };
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            return { $gte: startDate };
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            return { $gte: startDate };
        default:
            return {}; // all time
    }
};

// GET /api/stats/me - user personal stats
router.get('/me', verifyToken, async (req, res) => {
    try {
        // Count borrowed loans only (status = 'borrowed')
        const borrowedLoans = await Loan.find({
            user: req.user._id,
            status: 'borrowed'
        });

        const borrowedCount = borrowedLoans.reduce((sum, loan) => {
            return sum + (Array.isArray(loan.books) ? loan.books.length : 0);
        }, 0);

        const remainingBorrows = 3 - borrowedCount;

        res.json({
            userBorrowedBooks: borrowedCount,
            remainingBorrows: Math.max(0, remainingBorrows)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/stats - admin only (basic stats)
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const totalCopiesAgg = await Book.aggregate([{ $group: { _id: null, total: { $sum: { $ifNull: ['$soQuyen', 0] } } } }]);
        const totalCopies = (totalCopiesAgg[0] && totalCopiesAgg[0].total) || 0;
        const totalUsers = await User.countDocuments();
        const publishers = await Publisher.countDocuments();

        const activeLoans = await Loan.countDocuments({ status: { $nin: ['returned', 'rejected'] } });
        const requestedLoans = await Loan.countDocuments({ status: 'requested' });
        const borrowedLoans = await Loan.countDocuments({ status: 'borrowed' });
        const overdueLoans = await Loan.countDocuments({ status: 'overdue' });
        const cancelledLoans = await Loan.countDocuments({ status: 'cancelled' });

        // count total borrowed books (books in borrowed/overdue loans)
        const borrowedAgg = await Loan.aggregate([
            { $match: { status: { $in: ['borrowed', 'overdue'] } } },
            { $project: { n: { $size: { $ifNull: ['$books', []] } } } },
            { $group: { _id: null, total: { $sum: '$n' } } }
        ]);
        const borrowedBooks = (borrowedAgg[0] && borrowedAgg[0].total) || 0;

        res.json({ totalBooks, totalCopies, totalUsers, publishers, activeLoans, requestedLoans, borrowedLoans, overdueLoans, cancelledLoans, borrowedBooks });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/stats/detailed - detailed statistics with date filtering
router.get('/detailed', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { period = 'all' } = req.query; // today, month, year, all
        const dateFilter = getDateFilter(period);

        // Loan statistics by period
        const loanFilter = dateFilter.hasOwnProperty('$gte') ? { createdAt: dateFilter } : {};
        const loansCount = await Loan.countDocuments(loanFilter);

        // Books borrowed count (from loans created in period)
        const booksBorrowedAgg = await Loan.aggregate([
            { $match: loanFilter },
            { $project: { n: { $size: { $ifNull: ['$books', []] } } } },
            { $group: { _id: null, total: { $sum: '$n' } } }
        ]);
        const booksBorrowedCount = (booksBorrowedAgg[0] && booksBorrowedAgg[0].total) || 0;

        // Most borrowed books in period
        const mostBorrowedBooks = await Loan.aggregate([
            { $match: loanFilter },
            { $unwind: '$books' },
            {
                $lookup: {
                    from: 'books',
                    localField: 'books',
                    foreignField: '_id',
                    as: 'bookInfo'
                }
            },
            { $unwind: '$bookInfo' },
            {
                $lookup: {
                    from: 'booktitles',
                    localField: 'bookInfo.bookTitle',
                    foreignField: '_id',
                    as: 'bookTitleInfo'
                }
            },
            { $unwind: { path: '$bookTitleInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$bookInfo.bookTitle',
                    title: { $first: '$bookTitleInfo.title' },
                    author: { $first: '$bookTitleInfo.author' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Most active users in period
        const mostActiveUsers = await Loan.aggregate([
            { $match: loanFilter },
            {
                $group: {
                    _id: '$user',
                    count: { $sum: 1 },
                    booksBorrowed: { $sum: { $size: { $ifNull: ['$books', []] } } }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    booksBorrowed: 1,
                    fullName: { $concat: [{ $ifNull: ['$userInfo.hoLot', ''] }, ' ', { $ifNull: ['$userInfo.ten', ''] }] },
                    email: '$userInfo.email'
                }
            },
            { $sort: { booksBorrowed: -1, count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            period,
            loansCount,
            booksBorrowedCount,
            mostBorrowedBooks,
            mostActiveUsers
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
