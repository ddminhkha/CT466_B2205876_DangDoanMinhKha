const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const { verifyToken, requireRole } = require('../middleware/auth');

// user requests to borrow books (one loan can include multiple books)
router.post('/request', verifyToken, requireRole('user'), async (req, res) => {
    try {
        const { bookIds } = req.body;
        if (!Array.isArray(bookIds) || bookIds.length === 0) return res.status(400).json({ message: 'bookIds required' });

        // Tính toán ngày hẹn tự động
        const now = new Date();

        // Ngày hẹn lấy sách: 5:00PM ngày hôm sau
        const pickupDate = new Date(now);
        pickupDate.setDate(now.getDate() + 1);
        pickupDate.setHours(17, 0, 0, 0); // 5:00PM

        // Ngày hẹn trả: 5:00PM của 10 ngày kể từ ngày tạo phiếu
        const dueDate = new Date(now);
        dueDate.setDate(now.getDate() + 10);
        dueDate.setHours(17, 0, 0, 0); // 5:00PM

        // enforce per-user borrow limit: max 3 concurrently borrowed books
        // Count all books in the user's active (non-returned, non-rejected, non-cancelled) loans.
        const activeLoans = await Loan.find({
            user: req.user._id,
            status: { $nin: ['returned', 'rejected', 'cancelled'] }
        });
        let activeCount = 0;
        for (const l of activeLoans) {
            activeCount += (Array.isArray(l.books) ? l.books.length : 0);
        }
        if (activeCount + bookIds.length > 3) {
            return res.status(400).json({ message: 'Vượt quá giới hạn mượn: tổng số sách chưa trả không được vượt quá 3 quyển' });
        }

        // validate books exist
        const books = await Book.find({ _id: { $in: bookIds } });
        if (!books || books.length !== bookIds.length) return res.status(404).json({ message: 'One or more books not found' });

        // Check availability: calculate how many copies are already reserved/borrowed
        for (const b of books) {
            // Count active loans (requested, approved, borrowed) for this book
            const activeLoans = await Loan.find({
                books: b._id,
                status: { $in: ['requested', 'approved', 'borrowed'] }
            }).lean();

            let reservedCount = 0;
            for (const loan of activeLoans) {
                if (Array.isArray(loan.books)) {
                    reservedCount += loan.books.filter(id => id.toString() === b._id.toString()).length;
                }
            }

            const available = (b.soQuyen || 0) - reservedCount;
            if (available <= 0) {
                return res.status(400).json({ message: `Không còn bản sao sẵn có cho sách này` });
            }
        }

        const loan = new Loan({
            user: req.user._id,
            books: bookIds,
            pickupDate,
            dueDate
        });
        await loan.save();

        res.json(loan);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// staff: list pending requests
router.get('/requests', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const list = await Loan.find({ status: 'requested' })
            .populate('user', 'hoLot ten email')
            .populate({
                path: 'books',
                select: 'volume publisher year language soQuyen',
                populate: {
                    path: 'bookTitle',
                    select: 'title author'
                }
            });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// staff approve/reject
router.post('/:id/approve', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id).populate('books user');
        if (!loan) return res.status(404).json({ message: 'Not found' });
        // optionally check availability here
        loan.status = 'approved';
        loan.staff = req.user._id;
        await loan.save();

        // Create notification for loan approval
        try {
            await Notification.notifyLoanApproved(loan.user._id, {
                loanId: loan._id,
                books: loan.books.map(b => ({ title: b.title })),
                pickupDate: loan.pickupDate,
                dueDate: loan.dueDate
            });
        } catch (notifError) {
            console.error('Error creating approval notification:', notifError);
            // Don't fail the approval if notification fails
        }

        res.json(loan);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// staff/admin: reject request
router.post('/:id/reject', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        if (!loan) return res.status(404).json({ message: 'Not found' });
        loan.status = 'rejected';
        loan.staff = req.user._id;
        await loan.save();
        res.json(loan);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.post('/:id/mark-borrowed', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id).populate('books');
        if (!loan) return res.status(404).json({ message: 'Not found' });
        // ensure each book record exists
        for (const book of loan.books) {
            if (!book) return res.status(400).json({ message: 'Associated book not found' });
        }
        // enforce per-user borrow limit when marking as borrowed
        // count active (non-returned, non-rejected, non-cancelled) books for the user excluding this loan
        const otherActiveLoans = await Loan.find({
            user: loan.user,
            _id: { $ne: loan._id },
            status: { $nin: ['returned', 'rejected', 'cancelled'] }
        });
        let otherActiveCount = 0;
        for (const l of otherActiveLoans) {
            otherActiveCount += (Array.isArray(l.books) ? l.books.length : 0);
        }
        if (otherActiveCount + (Array.isArray(loan.books) ? loan.books.length : 0) > 3) {
            return res.status(400).json({ message: 'Không thể đánh dấu phát sách: tổng số sách mượn chưa trả sẽ vượt quá giới hạn 3 quyển' });
        }
        // Copies were reserved at request time, so no need to decrement again here.
        loan.status = 'borrowed';
        loan.borrowDate = new Date();
        loan.staff = req.user._id;
        await loan.save();
        res.json(loan);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// mark returned
router.post('/:id/return', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        if (!loan) return res.status(404).json({ message: 'Not found' });
        loan.status = 'returned';
        loan.returnDate = new Date();
        loan.staff = req.user._id;
        await loan.save();

        res.json(loan);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// user or admin: cancel loan request/approved loan
router.post('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id).populate('books user');
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        // Allow user to cancel their own loan OR admin to cancel any loan
        const isOwner = loan.user._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Only allow cancellation for requested or approved loans
        if (loan.status !== 'requested' && loan.status !== 'approved') {
            return res.status(400).json({ message: 'Chỉ có thể hủy phiếu mượn ở trạng thái "requested" hoặc "approved"' });
        }

        loan.status = 'cancelled';
        await loan.save();

        res.json({ message: 'Đã hủy phiếu mượn thành công', loan });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// user: get active borrow count (số sách đang mượn chưa trả)
router.get('/me/active-count', verifyToken, async (req, res) => {
    try {
        const activeLoans = await Loan.find({
            user: req.user._id,
            status: { $nin: ['returned', 'rejected', 'cancelled'] }
        });
        let activeCount = 0;
        for (const l of activeLoans) {
            activeCount += (Array.isArray(l.books) ? l.books.length : 0);
        }
        res.json({ activeCount });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// user: see own loans
router.get('/me', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const search = req.query.search; // Tìm kiếm theo tên sách
        const dateFrom = req.query.dateFrom; // Tìm kiếm từ ngày
        const dateTo = req.query.dateTo; // Tìm kiếm đến ngày
        const status = req.query.status; // Lọc theo trạng thái

        console.log('🔍 Loans search params:', { search, dateFrom, dateTo, status });

        // Build filter
        const filter = { user: req.user._id };

        // Date range filter
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) {
                filter.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999); // Set to end of day
                filter.createdAt.$lte = endDate;
            }
        }

        // Status filter
        if (status && status !== 'all') {
            filter.status = status;
        }

        if (limit) {
            // Phân trang
            const skip = (page - 1) * limit;
            let query = Loan.find(filter)
                .populate({
                    path: 'books',
                    select: 'volume publisher year language soQuyen',
                    populate: {
                        path: 'bookTitle',
                        select: 'title author'
                    }
                })
                .sort({ createdAt: -1 });

            // Get total count
            const total = await Loan.countDocuments(filter);

            // Apply pagination
            const list = await query.skip(skip).limit(limit);

            // Filter by book title if search term provided
            let filteredList = list;
            if (search) {
                filteredList = list.filter(loan => {
                    return loan.books.some(book => {
                        const title = book.bookTitle?.title || '';
                        const author = book.bookTitle?.author || '';
                        const searchLower = search.toLowerCase();
                        return title.toLowerCase().includes(searchLower) ||
                            author.toLowerCase().includes(searchLower);
                    });
                });
            }

            res.json({
                loans: filteredList,
                pagination: {
                    page,
                    limit,
                    total: search ? filteredList.length : total,
                    pages: Math.ceil((search ? filteredList.length : total) / limit),
                    hasNext: page < Math.ceil((search ? filteredList.length : total) / limit),
                    hasPrev: page > 1
                }
            });
        } else {
            // Trả về tất cả (compatibility với code cũ)
            let query = Loan.find(filter)
                .populate({
                    path: 'books',
                    select: 'volume publisher year language soQuyen',
                    populate: {
                        path: 'bookTitle',
                        select: 'title author'
                    }
                })
                .sort({ createdAt: -1 });

            let list = await query;

            // Filter by book title if search term provided
            if (search) {
                list = list.filter(loan => {
                    return loan.books.some(book => {
                        const title = book.bookTitle?.title || '';
                        const author = book.bookTitle?.author || '';
                        const searchLower = search.toLowerCase();
                        return title.toLowerCase().includes(searchLower) ||
                            author.toLowerCase().includes(searchLower);
                    });
                });
            }

            res.json(list);
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// admin/staff: overall history
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const list = await Loan.find()
            .populate('user', 'hoLot ten email')
            .populate({
                path: 'books',
                select: 'volume publisher year language soQuyen',
                populate: {
                    path: 'bookTitle',
                    select: 'title author'
                }
            })
            .sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// staff/admin: mark overdue (manual)
router.post('/:id/mark-overdue', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id).populate('books');
        if (!loan) return res.status(404).json({ message: 'Not found' });
        loan.status = 'overdue';
        loan.staff = req.user._id;
        await loan.save();
        res.json(loan);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
