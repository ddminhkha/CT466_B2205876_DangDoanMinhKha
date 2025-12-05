require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./app/models/User');

async function createAdmin() {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library_db';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('❌ Admin user already exists:', existingAdmin.email);
            console.log('Use this account to login to admin panel');
            return;
        }

        // Create default admin account
        const email = 'admin@library.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new User({
            email: email,
            password: hashedPassword,
            hoLot: 'Quản trị',
            ten: 'Viên',
            role: 'admin',
            status: 'active',
            createdAt: new Date()
        });

        await admin.save();

        console.log('✅ Admin account created successfully!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('🌐 Admin URL: http://localhost:3001');
        console.log('');
        console.log('⚠️ IMPORTANT: Change this password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('📪 Disconnected from MongoDB');
    }
}

// Run if called directly
if (require.main === module) {
    createAdmin();
}

module.exports = createAdmin;