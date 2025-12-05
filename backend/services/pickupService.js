const Loan = require('../app/models/Loan');
const Notification = require('../app/models/Notification');
const Book = require('../app/models/Book');

class PickupService {
    // Check for loans that missed pickup deadline and auto-cancel them
    static async checkMissedPickups() {
        try {
            const now = new Date();
            console.log('🔍 Checking for missed pickup deadlines...');

            // Find approved loans where pickup time has passed
            const missedPickupLoans = await Loan.find({
                status: 'approved',
                pickupDate: { $lt: now }
            }).populate('user', 'hoLot ten email')
                .populate('books', 'title author');

            console.log(`📋 Found ${missedPickupLoans.length} loans with missed pickup deadlines`);

            let cancelledCount = 0;

            for (const loan of missedPickupLoans) {
                try {
                    // Update loan status to cancelled
                    loan.status = 'cancelled';
                    await loan.save();

                    // Restore book inventory (return reserved copies)
                    for (const bookId of loan.books) {
                        await Book.findByIdAndUpdate(bookId, {
                            $inc: { soQuyen: 1 }
                        });
                    }

                    // Create notification for user about cancelled loan
                    if (loan.user) {
                        await Notification.notifyLoanCancelled(loan.user._id, {
                            loanId: loan._id,
                            books: loan.books.map(b => ({ title: b.title || 'Unknown' })),
                            pickupDate: loan.pickupDate,
                            reason: 'Phiếu mượn đã bị hủy do bạn không đến lấy sách đúng hẹn. Hãy liên hệ thư viện nếu có thắc mắc.'
                        });
                    }

                    cancelledCount++;
                    console.log(`❌ Cancelled loan ${loan._id} - missed pickup deadline`);

                } catch (error) {
                    console.error(`❌ Error cancelling loan ${loan._id}:`, error);
                }
            }

            console.log(`✅ Auto-cancelled ${cancelledCount} loans due to missed pickups`);
            return {
                checked: missedPickupLoans.length,
                cancelled: cancelledCount
            };

        } catch (error) {
            console.error('❌ Error checking missed pickups:', error);
            throw error;
        }
    }

    // Check for loans that are due soon for pickup reminder
    static async checkUpcomingPickups() {
        try {
            const now = new Date();
            const reminderTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours before pickup

            console.log('🔍 Checking for upcoming pickup deadlines...');

            const upcomingPickups = await Loan.find({
                status: 'approved',
                pickupDate: {
                    $gte: now,
                    $lte: reminderTime
                },
                pickupReminderSent: { $ne: true }
            }).populate('user', 'hoLot ten email')
                .populate('books', 'title author');

            console.log(`📋 Found ${upcomingPickups.length} loans with upcoming pickup deadlines`);

            let remindersSent = 0;

            for (const loan of upcomingPickups) {
                try {
                    // Send pickup reminder notification
                    if (loan.user) {
                        await Notification.notifyPickupReminder(loan.user._id, {
                            loanId: loan._id,
                            books: loan.books.map(b => ({ title: b.title || 'Unknown' })),
                            pickupDate: loan.pickupDate
                        });

                        // Mark reminder as sent
                        loan.pickupReminderSent = true;
                        await loan.save();

                        remindersSent++;
                        console.log(`📨 Sent pickup reminder for loan ${loan._id}`);
                    }
                } catch (error) {
                    console.error(`❌ Error sending pickup reminder for loan ${loan._id}:`, error);
                }
            }

            console.log(`✅ Sent ${remindersSent} pickup reminders`);
            return {
                checked: upcomingPickups.length,
                remindersSent
            };

        } catch (error) {
            console.error('❌ Error checking upcoming pickups:', error);
            throw error;
        }
    }
}

module.exports = PickupService;