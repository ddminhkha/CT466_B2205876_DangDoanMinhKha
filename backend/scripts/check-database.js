require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../app/models/User');
const Book = require('../app/models/Book');
const BookTitle = require('../app/models/BookTitle');
const Publisher = require('../app/models/Publisher');
const Loan = require('../app/models/Loan');

async function checkDatabase() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library_db';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB\n');

        const userCount = await User.countDocuments();
        const bookCount = await Book.countDocuments();
        const bookTitleCount = await BookTitle.countDocuments();
        const publisherCount = await Publisher.countDocuments();
        const loanCount = await Loan.countDocuments();

        console.log('📊 Database Statistics:');
        console.log('========================');
        console.log(`Users: ${userCount}`);
        console.log(`Books: ${bookCount}`);
        console.log(`Book Titles: ${bookTitleCount}`);
        console.log(`Publishers: ${publisherCount}`);
        console.log(`Loans: ${loanCount}`);
        console.log('');

        if (userCount > 0) {
            console.log('👥 Sample Users:');
            const users = await User.find({}, { email: 1, role: 1, hoLot: 1, ten: 1 }).limit(5);
            users.forEach(u => {
                const name = ((u.hoLot || '') + ' ' + (u.ten || '')).trim() || 'N/A';
                console.log(`  - ${u.email} (${u.role}) - ${name}`);
            });
            console.log('');
        }

        if (bookCount > 0) {
            console.log('📚 Sample Books:');
            const books = await Book.find({}).populate('bookTitle').limit(5);
            books.forEach(b => {
                const title = b.bookTitle?.title || 'N/A';
                console.log(`  - ${title} (${b.soQuyen} quyển)`);
            });
            console.log('');
        }

        if (loanCount > 0) {
            console.log('📋 Sample Loans:');
            const loans = await Loan.find({}, { status: 1, createdAt: 1 }).limit(5);
            loans.forEach(l => {
                console.log(`  - Status: ${l.status}, Created: ${l.createdAt.toLocaleDateString()}`);
            });
            console.log('');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkDatabase();
