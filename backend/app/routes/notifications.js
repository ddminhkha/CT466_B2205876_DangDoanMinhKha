const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const User = require('../models/User');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const { verifyToken, requireRole } = require('../middleware/auth');
const emailService = require('../../services/emailService');

// === USER NOTIFICATION ENDPOINTS ===

// Get user notifications
router.get('/user', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const query = { user: req.user._id };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalCount = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        res.json({
            notifications: notifications.map(n => ({
                id: n._id,
                type: n.type,
                title: n.title,
                message: n.message,
                data: n.data,
                isRead: n.isRead,
                readAt: n.readAt,
                createdAt: n.createdAt,
                priority: n.priority
            })),
            pagination: {
                current: page,
                total: Math.ceil(totalCount / limit),
                count: notifications.length,
                totalCount
            },
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Lỗi khi tải thông báo' });
    }
});

// Mark notification as read
router.patch('/:notificationId/read', verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.notificationId,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        }

        if (!notification.isRead) {
            await notification.markAsRead();
        }

        res.json({ message: 'Đã đánh dấu thông báo là đã đọc' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông báo' });
    }
});

// Mark all notifications as read
router.patch('/mark-all-read', verifyToken, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông báo' });
    }
});

// Delete notification
router.delete('/:notificationId', verifyToken, async (req, res) => {
    try {
        const result = await Notification.findOneAndDelete({
            _id: req.params.notificationId,
            user: req.user._id
        });

        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        }

        res.json({ message: 'Đã xóa thông báo' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Lỗi khi xóa thông báo' });
    }
});

// Clear all notifications
router.delete('/clear-all', verifyToken, async (req, res) => {
    try {
        const result = await Notification.deleteMany({
            user: req.user._id
        });

        res.json({
            message: `Đã xóa tất cả thông báo (${result.deletedCount} thông báo)`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error clearing all notifications:', error);
        res.status(500).json({ message: 'Lỗi khi xóa tất cả thông báo' });
    }
});

// === ADMIN EMAIL NOTIFICATION ENDPOINTS ===

// Get email statistics
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Count overdue loans
        const overdueLoans = await Loan.find({
            returnDate: null,
            dueDate: { $lt: now }
        });

        // Count loans due soon (within 3 days)
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
        const dueSoonLoans = await Loan.find({
            returnDate: null,
            dueDate: { $gte: now, $lte: threeDaysFromNow }
        });

        // Count notifications sent today
        const todayNotifications = await Loan.countDocuments({
            lastNotificationDate: { $gte: todayStart }
        });

        // Get recent activity (simulated - in real app you'd have a notification log)
        const recentLoans = await Loan.find({
            $or: [
                { notificationSent: true },
                { reminderSent: true }
            ]
        })
            .populate('user', 'fullName email')
            .populate('books', 'title')
            .sort({ lastNotificationDate: -1 })
            .limit(10);

        const recentActivity = recentLoans.map(loan => ({
            id: loan._id,
            type: loan.notificationSent ? 'Overdue Notification' : 'Reminder',
            recipient: loan.user.email,
            subject: loan.notificationSent ? 'Sách quá hạn trả' : 'Nhắc nhở trả sách',
            status: 'Sent',
            sentAt: loan.lastNotificationDate || loan.updatedAt
        }));

        res.json({
            overdueCount: overdueLoans.length,
            dueSoonCount: dueSoonLoans.length,
            todayEmailCount: todayNotifications,
            recentActivity
        });
    } catch (error) {
        console.error('Error getting email stats:', error);
        res.status(500).json({ message: 'Lỗi khi lấy thống kê email' });
    }
});

// Send overdue notifications
router.post('/send-overdue-notifications', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('🔄 Starting overdue notification process...');

        // Find all overdue loans (borrowed status + past due date)
        const now = new Date();
        const overdueLoans = await Loan.find({
            status: 'borrowed',
            dueDate: { $lt: now }
        }).populate('user', 'hoLot ten email')
            .populate('books', 'title author');

        console.log(`📋 Found ${overdueLoans.length} overdue loans`);

        if (overdueLoans.length === 0) {
            return res.json({
                message: 'Không có phiếu mượn nào quá hạn',
                sent: 0,
                failed: 0
            });
        }

        let sentCount = 0;
        let failedCount = 0;
        const results = [];

        // Send email for each overdue loan
        for (const loan of overdueLoans) {
            if (!loan.user || !loan.user.email) {
                console.warn('⚠️ Skipping loan - no user email:', loan._id);
                failedCount++;
                continue;
            }

            const emailResult = await emailService.sendOverdueNotification(
                loan,
                loan.user,
                loan.books
            );

            if (emailResult.success) {
                sentCount++;
                results.push({
                    loanId: loan._id,
                    userEmail: loan.user.email,
                    status: 'sent',
                    messageId: emailResult.messageId
                });

                // Optional: Mark loan as "overdue" status or add notification flag
                await Loan.findByIdAndUpdate(loan._id, {
                    status: 'overdue',
                    notificationSent: true,
                    lastNotificationDate: new Date()
                });

            } else {
                failedCount++;
                results.push({
                    loanId: loan._id,
                    userEmail: loan.user.email,
                    status: 'failed',
                    error: emailResult.error
                });
            }
        }

        console.log(`✅ Overdue notifications complete: ${sentCount} sent, ${failedCount} failed`);

        res.json({
            message: `Đã gửi thông báo quá hạn: ${sentCount} thành công, ${failedCount} thất bại`,
            sent: sentCount,
            failed: failedCount,
            details: results
        });

    } catch (error) {
        console.error('❌ Overdue notification error:', error);
        res.status(500).json({
            message: 'Lỗi khi gửi thông báo quá hạn',
            error: error.message
        });
    }
});

// Admin: Send reminder notifications (X days before due date)
router.post('/send-reminder-notifications', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { daysBefore = 3 } = req.body; // Default remind 3 days before due date

        console.log(`🔄 Starting reminder notification process (${daysBefore} days before)...`);

        // Calculate date range
        const now = new Date();
        const reminderDate = new Date();
        reminderDate.setDate(now.getDate() + daysBefore);

        // Find loans due in X days
        const upcomingLoans = await Loan.find({
            status: 'borrowed',
            dueDate: {
                $gte: now,
                $lte: reminderDate
            }
        }).populate('user', 'hoLot ten email')
            .populate('books', 'title author');

        console.log(`📋 Found ${upcomingLoans.length} loans due within ${daysBefore} days`);

        if (upcomingLoans.length === 0) {
            return res.json({
                message: `Không có phiếu mượn nào sắp đến hạn trong ${daysBefore} ngày tới`,
                sent: 0,
                failed: 0
            });
        }

        let sentCount = 0;
        let failedCount = 0;
        const results = [];

        // Send reminder email for each upcoming loan
        for (const loan of upcomingLoans) {
            if (!loan.user || !loan.user.email) {
                console.warn('⚠️ Skipping loan - no user email:', loan._id);
                failedCount++;
                continue;
            }

            const emailResult = await emailService.sendReminderNotification(
                loan,
                loan.user,
                loan.books
            );

            if (emailResult.success) {
                sentCount++;
                results.push({
                    loanId: loan._id,
                    userEmail: loan.user.email,
                    dueDate: loan.dueDate,
                    status: 'sent',
                    messageId: emailResult.messageId
                });
            } else {
                failedCount++;
                results.push({
                    loanId: loan._id,
                    userEmail: loan.user.email,
                    status: 'failed',
                    error: emailResult.error
                });
            }
        }

        console.log(`✅ Reminder notifications complete: ${sentCount} sent, ${failedCount} failed`);

        res.json({
            message: `Đã gửi nhắc nhở: ${sentCount} thành công, ${failedCount} thất bại`,
            sent: sentCount,
            failed: failedCount,
            details: results
        });

    } catch (error) {
        console.error('❌ Reminder notification error:', error);
        res.status(500).json({
            message: 'Lỗi khi gửi nhắc nhở',
            error: error.message
        });
    }
});

// Simple test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Notifications API is working', timestamp: new Date() });
});

// Admin: Test email configuration
router.post('/test-email', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email address is required' });
        }

        // Use emailService to send test email
        const admin = await User.findOne({ role: 'admin' });
        const adminName = admin ? `${admin.hoLot} ${admin.ten}` : 'Quản trị viên Thư viện';
        const adminEmail = process.env.EMAIL_USER || admin?.email || 'admin@library.edu.vn';

        // Create test email using emailService transporter
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Test connection first
        await transporter.verify();
        console.log('📧 SMTP connection verified');

        const mailOptions = {
            from: `"${adminName} - Thư Viện" <${adminEmail}>`,
            to: email,
            subject: '📧 Test Email từ Hệ thống Thư viện',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <h1>✅ Test Email Thành Công</h1>
                        <p>Hệ thống email đã được cấu hình đúng</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                        <p>Xin chào,</p>
                        <p>Đây là email test từ hệ thống quản lý thư viện.</p>
                        <p><strong>Gửi từ:</strong> ${adminName}</p>
                        <p><strong>Email:</strong> ${adminEmail}</p>
                        <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                        <hr>
                        <p style="color: #6c757d; font-size: 12px;">Đây là email tự động, vui lòng không trả lời.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);

        res.json({
            message: `Test email đã được gửi thành công từ ${adminName}`,
            messageId: result.messageId,
            from: `${adminName} <${adminEmail}>`,
            to: email
        });

    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            message: 'Test email failed',
            error: error.message
        });
    }
});

// Admin: Send test overdue email to specific user
router.post('/test-overdue-email/:loanId', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.loanId)
            .populate('user', 'hoLot ten email')
            .populate('books', 'title author');

        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        if (!loan.user || !loan.user.email) {
            return res.status(400).json({ message: 'User has no email address' });
        }

        const result = await emailService.sendOverdueNotification(loan, loan.user, loan.books);

        if (result.success) {
            res.json({
                message: `Test overdue email sent to ${loan.user.email}`,
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                message: 'Failed to send test email',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Test email error',
            error: error.message
        });
    }
});

// Send custom notification email from admin
router.post('/send-custom', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📧 Received send-custom request:', req.body);

        const { recipient, subject, content } = req.body;

        // Validation
        if (!recipient || !subject || !content) {
            console.log('❌ Missing fields - recipient:', recipient, 'subject:', subject, 'content:', content);
            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin: email nhận, tiêu đề, nội dung'
            });
        }

        // Get admin user info for sender
        const admin = await User.findById(req.user._id);
        if (!admin) {
            console.log('❌ Admin user not found:', req.user._id);
            return res.status(400).json({
                message: 'Không tìm thấy thông tin admin'
            });
        }

        const senderEmail = admin.email || process.env.EMAIL_USER || 'admin@library.edu.vn';
        const senderName = `${admin.hoLot || ''} ${admin.ten || 'Admin'}`.trim();

        console.log(`📧 Sending email from ${senderName} <${senderEmail}> to ${recipient}`);

        // Send email using emailService
        const result = await emailService.sendCustomEmail({
            to: recipient,
            subject: subject,
            content: content,
            senderName: senderName,
            senderEmail: senderEmail
        });

        if (result.success) {
            console.log('✅ Custom email sent successfully');
            res.json({
                message: 'Thông báo đã được gửi thành công',
                messageId: result.messageId
            });
        } else {
            console.error('❌ Failed to send email:', result.error);
            res.status(500).json({
                message: 'Lỗi khi gửi thông báo',
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Error in send-custom endpoint:', error);
        res.status(500).json({
            message: 'Lỗi khi gửi thông báo',
            error: error.message
        });
    }
});

module.exports = router;