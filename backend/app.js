require('dotenv').config();
const express = require('express');
const cors = require('cors');
const NotificationService = require('./services/notificationService');
const PickupService = require('./services/pickupService');

const app = express();

// middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));
app.use(express.json());

// Serve static files (uploaded images)
app.use('/uploads', express.static('public/uploads'));

// routes
app.use('/api/auth', require('./app/routes/auth'));
app.use('/api/booktitles', require('./app/routes/booktitles'));
app.use('/api/books', require('./app/routes/books'));
app.use('/api/loans', require('./app/routes/loans'));
app.use('/api/publishers', require('./app/routes/publishers'));
app.use('/api/users', require('./app/routes/users'));
app.use('/api/stats', require('./app/routes/stats'));
app.use('/api/notifications', require('./app/routes/notifications'));

// error handler (should be after routes)
app.use(require('./app/middleware/errorHandler'));

// health
app.get('/', (req, res) => res.json({ ok: true, message: 'Library backend app' }));

// Start notification checking service
// Check for due soon and overdue loans every hour
if (process.env.NODE_ENV !== 'test') {
    console.log('🔔 Starting notification and pickup services...');

    // Run initial check after 1 minute
    setTimeout(async () => {
        try {
            await NotificationService.checkAllLoans();
            await PickupService.checkMissedPickups();
            await PickupService.checkUpcomingPickups();
        } catch (error) {
            console.error('Error in initial checks:', error);
        }
    }, 60 * 1000);

    // Check notifications every hour
    setInterval(async () => {
        try {
            await NotificationService.checkAllLoans();
        } catch (error) {
            console.error('Error in scheduled notification check:', error);
        }
    }, 60 * 60 * 1000); // Every hour

    // Check pickups every 30 minutes
    setInterval(async () => {
        try {
            await PickupService.checkMissedPickups();
            await PickupService.checkUpcomingPickups();
        } catch (error) {
            console.error('Error in pickup checks:', error);
        }
    }, 30 * 60 * 1000); // Every 30 minutes

    // Clean up old notifications daily at midnight
    const scheduleCleanup = () => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0); // Next midnight

        const msUntilMidnight = midnight.getTime() - now.getTime();

        setTimeout(() => {
            // Run cleanup
            NotificationService.cleanupOldNotifications();

            // Schedule for every 24 hours
            setInterval(() => {
                NotificationService.cleanupOldNotifications();
            }, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    };

    scheduleCleanup();
}

module.exports = app;
