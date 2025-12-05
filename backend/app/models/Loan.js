const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // support multiple books per loan
    books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }],
    // pickupDate: ngày hẹn đến lấy sách (5:00PM ngày hôm sau) - required for new loans
    pickupDate: { type: Date },
    // borrowDate is set when admin confirms the user picked up the books
    borrowDate: { type: Date },
    // dueDate: ngày hẹn trả (5:00PM của 10 ngày kể từ ngày tạo phiếu) - required for new loans  
    dueDate: { type: Date },
    returnDate: { type: Date },
    status: {
        type: String,
        enum: ['requested', 'approved', 'borrowed', 'returned', 'rejected', 'overdue', 'cancelled'],
        default: 'requested'
    },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // notification tracking
    notificationSent: { type: Boolean, default: false },
    lastNotificationDate: { type: Date },
    reminderSent: { type: Boolean, default: false },
    pickupReminderSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// expose friendly aliases in API responses: `create` -> createdAt, `borrow` -> borrowDate
loanSchema.virtual('create').get(function () { return this.createdAt })
loanSchema.virtual('borrow').get(function () { return this.borrowDate })

// include virtuals when converting to JSON / objects
loanSchema.set('toJSON', { virtuals: true })
loanSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Loan', loanSchema);
