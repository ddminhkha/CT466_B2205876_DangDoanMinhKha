const Loan = require('../app/models/Loan');
const Notification = require('../app/models/Notification');

class NotificationService {
    // Check for loans due soon (3 days before due date)
    static async checkDueSoonLoans() {
        try {
            const now = new Date();
            const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

            // Find loans that are due within 3 days and haven't been notified yet
            const dueSoonLoans = await Loan.find({
                status: 'borrowed',
                dueDate: {
                    $gte: now,
                    $lte: threeDaysFromNow
                },
                reminderSent: { $ne: true } // Only loans that haven't been reminded
            }).populate('user books');

            console.log(`📅 Found ${dueSoonLoans.length} loans due soon`);

            for (const loan of dueSoonLoans) {
                if (!loan.user) continue;

                const daysRemaining = Math.ceil((new Date(loan.dueDate) - now) / (1000 * 60 * 60 * 24));

                try {
                    await Notification.notifyDueSoon(loan.user._id, {
                        loanId: loan._id,
                        books: loan.books.map(b => ({ title: b.title })),
                        dueDate: loan.dueDate,
                        daysRemaining
                    });

                    // Mark as reminded to avoid duplicate notifications
                    await Loan.findByIdAndUpdate(loan._id, {
                        reminderSent: true,
                        lastNotificationDate: new Date()
                    });

                    console.log(`📅 Due soon notification sent to user ${loan.user._id} for loan ${loan._id}`);
                } catch (error) {
                    console.error(`Error sending due soon notification for loan ${loan._id}:`, error);
                }
            }

            return { processed: dueSoonLoans.length };
        } catch (error) {
            console.error('Error checking due soon loans:', error);
            throw error;
        }
    }

    // Check for overdue loans
    static async checkOverdueLoans() {
        try {
            const now = new Date();

            // Find overdue loans that haven't been marked as overdue yet
            const overdueLoans = await Loan.find({
                status: 'borrowed', // Only borrowed loans can be overdue
                dueDate: { $lt: now },
                // Only notify once when loan becomes overdue
                $or: [
                    { notificationSent: { $ne: true } },
                    { status: { $ne: 'overdue' } }
                ]
            }).populate('user books');

            console.log(`⚠️ Found ${overdueLoans.length} overdue loans`);

            for (const loan of overdueLoans) {
                if (!loan.user) continue;

                const overdueDays = Math.ceil((now - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24));

                try {
                    await Notification.notifyOverdue(loan.user._id, {
                        loanId: loan._id,
                        books: loan.books.map(b => ({ title: b.title })),
                        dueDate: loan.dueDate,
                        overdueDays
                    });

                    // Update loan status and notification flags
                    await Loan.findByIdAndUpdate(loan._id, {
                        status: 'overdue',
                        notificationSent: true,
                        lastNotificationDate: new Date()
                    });

                    console.log(`⚠️ Overdue notification sent to user ${loan.user._id} for loan ${loan._id}`);
                } catch (error) {
                    console.error(`Error sending overdue notification for loan ${loan._id}:`, error);
                }
            }

            return { processed: overdueLoans.length };
        } catch (error) {
            console.error('Error checking overdue loans:', error);
            throw error;
        }
    }

    // Run both checks
    static async checkAllLoans() {
        console.log('🔔 Running loan notification checks...');

        try {
            const dueSoonResult = await this.checkDueSoonLoans();
            const overdueResult = await this.checkOverdueLoans();

            const summary = {
                dueSoonProcessed: dueSoonResult.processed,
                overdueProcessed: overdueResult.processed,
                totalProcessed: dueSoonResult.processed + overdueResult.processed,
                timestamp: new Date()
            };

            console.log('🔔 Notification check completed:', summary);
            return summary;
        } catch (error) {
            console.error('Error in loan notification check:', error);
            throw error;
        }
    }

    // Clean up old notifications (older than 30 days)
    static async cleanupOldNotifications() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await Notification.deleteMany({
                createdAt: { $lt: thirtyDaysAgo },
                isRead: true // Only delete read notifications
            });

            console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
            return result;
        } catch (error) {
            console.error('Error cleaning up old notifications:', error);
            throw error;
        }
    }

    // Send system notification to all users
    static async sendSystemNotification(title, message, data = null) {
        try {
            const User = require('../app/models/User');
            const users = await User.find({ role: 'user', status: { $ne: 'banned' } });

            const notifications = [];
            for (const user of users) {
                try {
                    const notification = await Notification.notifySystem(user._id, title, message, data);
                    notifications.push(notification);
                } catch (error) {
                    console.error(`Error sending system notification to user ${user._id}:`, error);
                }
            }

            console.log(`📢 System notification sent to ${notifications.length} users`);
            return { sent: notifications.length };
        } catch (error) {
            console.error('Error sending system notification:', error);
            throw error;
        }
    }
}

module.exports = NotificationService;