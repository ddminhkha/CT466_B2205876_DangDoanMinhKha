const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'loan_created',      // Đăng ký mượn sách thành công
            'loan_approved',     // Phiếu mượn được duyệt
            'loan_rejected',     // Phiếu mượn bị từ chối
            'loan_due_soon',     // Sách sắp tới hạn
            'loan_overdue',      // Sách quá hạn
            'loan_returned',     // Trả sách thành công
            'loan_renewed',      // Gia hạn sách thành công
            'loan_cancelled',    // Phiếu mượn bị hủy
            'pickup_reminder',   // Nhắc nhở lấy sách
            'book_available',    // Sách đã có sẵn
            'system'             // Thông báo hệ thống
        ]
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed, // Flexible data for different notification types
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    }
}, {
    timestamps: true // createdAt, updatedAt
});

// Index for efficient queries
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });

// Static methods
NotificationSchema.statics.createNotification = async function (userId, type, title, message, data = null, priority = 'normal') {
    try {
        const notification = new this({
            user: userId,
            type,
            title,
            message,
            data,
            priority
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Instance methods
NotificationSchema.methods.markAsRead = async function () {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
    return this;
};

// Notification factory functions
NotificationSchema.statics.notifyLoanCreated = async function (userId, loanData) {
    return await this.createNotification(
        userId,
        'loan_created',
        'Đăng ký mượn sách thành công',
        `Bạn đã đăng ký mượn ${loanData.books.length} cuốn sách`,
        {
            loanId: loanData.loanId,
            bookTitles: loanData.books.map(b => b.title),
            dueDate: loanData.dueDate
        }
    );
};

NotificationSchema.statics.notifyLoanApproved = async function (userId, loanData) {
    return await this.createNotification(
        userId,
        'loan_approved',
        'Phiếu mượn được duyệt',
        `Phiếu mượn ${loanData.books.length} cuốn sách đã được duyệt. Hãy đến lấy sách vào lúc ${new Date(loanData.pickupDate).toLocaleString()}`,
        {
            loanId: loanData.loanId,
            bookTitles: loanData.books.map(b => b.title),
            pickupDate: loanData.pickupDate,
            dueDate: loanData.dueDate
        },
        'high'
    );
};

NotificationSchema.statics.notifyDueSoon = async function (userId, loanData) {
    return await this.createNotification(
        userId,
        'loan_due_soon',
        'Sách sắp tới hạn trả',
        `Bạn có ${loanData.books.length} cuốn sách sắp tới hạn trả`,
        {
            loanId: loanData.loanId,
            bookTitles: loanData.books.map(b => b.title),
            dueDate: loanData.dueDate,
            daysRemaining: loanData.daysRemaining
        },
        'high'
    );
};

NotificationSchema.statics.notifyOverdue = async function (userId, loanData) {
    return await this.createNotification(
        userId,
        'loan_overdue',
        'Sách đã quá hạn trả',
        `Bạn có ${loanData.books.length} cuốn sách đã quá hạn trả ${loanData.overdueDays} ngày. Vui lòng trả sách sớm nhất có thể.`,
        {
            loanId: loanData.loanId,
            bookTitles: loanData.books.map(b => b.title),
            dueDate: loanData.dueDate,
            overdueDays: loanData.overdueDays
        },
        'urgent'
    );
};

NotificationSchema.statics.notifyLoanReturned = async function (userId, loanData) {
    return await this.createNotification(
        userId,
        'loan_returned',
        'Trả sách thành công',
        `Bạn đã trả thành công ${loanData.books.length} cuốn sách`,
        {
            loanId: loanData.loanId,
            bookTitles: loanData.books.map(b => b.title),
            returnDate: loanData.returnDate
        }
    );
};

NotificationSchema.statics.notifyLoanRenewed = async function (userId, loanData) {
    return await this.createNotification(
        userId,
        'loan_renewed',
        'Gia hạn sách thành công',
        `Bạn đã gia hạn thành công ${loanData.books.length} cuốn sách`,
        {
            loanId: loanData.loanId,
            bookTitles: loanData.books.map(b => b.title),
            newDueDate: loanData.newDueDate
        }
    );
};

NotificationSchema.statics.notifySystem = async function (userId, title, message, data = null) {
    return await this.createNotification(
        userId,
        'system',
        title,
        message,
        data,
        'normal'
    );
};

NotificationSchema.statics.notifyPickupReminder = async function (userId, loanData) {
    const hoursRemaining = Math.ceil((new Date(loanData.pickupDate) - new Date()) / (1000 * 60 * 60));
    return await this.createNotification(
        userId,
        'pickup_reminder',
        'Nhắc nhở lấy sách',
        `Bạn có hẹn lấy ${loanData.books.length} cuốn sách trong ${hoursRemaining} giờ nữa (${new Date(loanData.pickupDate).toLocaleString()}). Hãy đến thư viện đúng giờ!`,
        {
            loanId: loanData.loanId,
            bookTitles: loanData.books.map(b => b.title),
            pickupDate: loanData.pickupDate
        },
        'high'
    );
};

NotificationSchema.statics.notifyLoanCancelled = async function (userId, loanData) {
    return await this.createNotification(
        userId,
        'loan_cancelled',
        'Phiếu mượn đã bị hủy',
        `Phiếu mượn ${loanData.books.length} cuốn sách đã bị hủy: ${loanData.reason}`,
        {
            loanId: loanData.loanId,
            bookTitles: loanData.books.map(b => b.title),
            pickupDate: loanData.pickupDate,
            reason: loanData.reason
        },
        'urgent'
    );
};

module.exports = mongoose.model('Notification', NotificationSchema);