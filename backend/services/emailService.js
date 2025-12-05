const nodemailer = require('nodemailer');
const User = require('../app/models/User');

// Email configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        // Gmail configuration with security options
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || 'admin@library.edu.vn',
            pass: process.env.EMAIL_PASS || 'your-app-password'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Get admin info for sender
const getAdminSender = async () => {
    try {
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            return {
                name: `${admin.hoLot} ${admin.ten}`,
                email: process.env.EMAIL_USER || admin.email || 'admin@library.edu.vn'
            };
        }
        return {
            name: 'Quản trị viên Thư viện',
            email: process.env.EMAIL_USER || 'admin@library.edu.vn'
        };
    } catch (error) {
        console.error('Error getting admin info:', error);
        return {
            name: 'Quản trị viên Thư viện',
            email: process.env.EMAIL_USER || 'admin@library.edu.vn'
        };
    }
};

// Email templates
const emailTemplates = {
    overdueNotification: (loan, user, books) => ({
        subject: '🚨 Thông báo sách quá hạn - Thư viện',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">⚠️ Sách Quá Hạn</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Thư Viện Trường Đại Học</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                        Xin chào <strong>${user.hoLot} ${user.ten}</strong>,
                    </p>
                    
                    <p style="color: #666; margin-bottom: 25px;">
                        Chúng tôi thông báo rằng phiếu mượn sách của bạn đã <strong style="color: #dc3545;">quá hạn</strong>. 
                        Vui lòng trả sách sớm nhất có thể để tránh bị phạt.
                    </p>
                    
                    <div style="background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                        <h3 style="color: #495057; margin-top: 0; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
                            📋 Thông tin phiếu mượn
                        </h3>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #6c757d;">Mã phiếu:</span>
                            <strong>${loan._id.toString().substr(-6).toUpperCase()}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #6c757d;">Ngày mượn:</span>
                            <span>${new Date(loan.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #6c757d;">Hạn trả:</span>
                            <strong style="color: #dc3545;">${new Date(loan.dueDate).toLocaleDateString('vi-VN')}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #6c757d;">Số ngày quá hạn:</span>
                            <strong style="color: #dc3545;">
                                ${Math.floor((Date.now() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))} ngày
                            </strong>
                        </div>
                    </div>
                    
                    <div style="background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                        <h3 style="color: #495057; margin-top: 0; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
                            📚 Danh sách sách cần trả
                        </h3>
                        ${books.map(book => `
                            <div style="border-bottom: 1px solid #f1f3f4; padding: 10px 0; last-child: { border-bottom: none; }">
                                <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                                    📖 ${book.title}
                                </div>
                                <div style="color: #6c757d; font-size: 14px;">
                                    ✍️ ${book.author}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                        <div style="color: #856404; font-weight: bold; margin-bottom: 8px;">
                            ⚠️ Lưu ý quan trọng:
                        </div>
                        <ul style="color: #856404; margin: 0; padding-left: 20px;">
                            <li>Sách quá hạn sẽ bị tính phí phạt</li>
                            <li>Tài khoản có thể bị khóa nếu không trả sách kịp thời</li>
                            <li>Vui lòng liên hệ thư viện nếu cần gia hạn</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <div style="background: #28a745; color: white; padding: 12px 25px; border-radius: 5px; display: inline-block; font-weight: bold; text-decoration: none; margin-right: 10px;">
                            📞 Liên hệ: 0123-456-789
                        </div>
                        <div style="background: #007bff; color: white; padding: 12px 25px; border-radius: 5px; display: inline-block; font-weight: bold; text-decoration: none;">
                            📧 library@university.edu.vn
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
                        <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                        <p>© 2025 Thư Viện Trường Đại Học. Mọi quyền được bảo lưu.</p>
                    </div>
                </div>
            </div>
        `,
        text: `
Thông báo sách quá hạn

Xin chào ${user.hoLot} ${user.ten},

Phiếu mượn sách của bạn đã quá hạn:
- Mã phiếu: ${loan._id.toString().substr(-6).toUpperCase()}
- Hạn trả: ${new Date(loan.dueDate).toLocaleDateString('vi-VN')}
- Số ngày quá hạn: ${Math.floor((Date.now() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))} ngày

Danh sách sách cần trả:
${books.map(book => `- ${book.title} (${book.author})`).join('\n')}

Vui lòng trả sách sớm nhất có thể.

Liên hệ: 0123-456-789
Email: library@university.edu.vn
        `
    }),

    reminderNotification: (loan, user, books) => ({
        subject: '📅 Nhắc nhở trả sách - Thư viện',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #ffc107, #e0a800); color: #212529; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">📅 Nhắc nhở trả sách</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.8;">Thư Viện Trường Đại Học</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                        Xin chào <strong>${user.hoLot} ${user.ten}</strong>,
                    </p>
                    
                    <p style="color: #666; margin-bottom: 25px;">
                        Phiếu mượn sách của bạn sắp đến hạn. Vui lòng chuẩn bị trả sách hoặc gia hạn.
                    </p>
                    
                    <div style="background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                        <h3 style="color: #495057; margin-top: 0;">📋 Thông tin phiếu mượn</h3>
                        <p><strong>Hạn trả:</strong> ${new Date(loan.dueDate).toLocaleDateString('vi-VN')}</p>
                        <p><strong>Còn lại:</strong> ${Math.ceil((new Date(loan.dueDate) - Date.now()) / (1000 * 60 * 60 * 24))} ngày</p>
                        
                        <h4 style="color: #495057;">📚 Danh sách sách:</h4>
                        ${books.map(book => `<p>📖 ${book.title} - ${book.author}</p>`).join('')}
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #6c757d; font-size: 12px;">Đây là email tự động, vui lòng không trả lời.</p>
                    </div>
                </div>
            </div>
        `,
        text: `Nhắc nhở: Sách của bạn sắp đến hạn trả (${new Date(loan.dueDate).toLocaleDateString('vi-VN')})`
    })
};

// Main email service functions
const emailService = {
    // Send overdue notification
    async sendOverdueNotification(loan, user, books) {
        try {
            const transporter = createTransporter();
            const adminSender = await getAdminSender();
            const template = emailTemplates.overdueNotification(loan, user, books);

            const mailOptions = {
                from: `"${adminSender.name} - Thư Viện" <${adminSender.email}>`,
                to: user.email,
                subject: template.subject,
                text: template.text,
                html: template.html
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Overdue email sent to:', user.email, 'from:', adminSender.email);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Failed to send overdue email:', error);
            return { success: false, error: error.message };
        }
    },

    // Send reminder notification (before due date)
    async sendReminderNotification(loan, user, books) {
        try {
            const transporter = createTransporter();
            const adminSender = await getAdminSender();
            const template = emailTemplates.reminderNotification(loan, user, books);

            const mailOptions = {
                from: `"${adminSender.name} - Thư Viện" <${adminSender.email}>`,
                to: user.email,
                subject: template.subject,
                text: template.text,
                html: template.html
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Reminder email sent to:', user.email, 'from:', adminSender.email);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Failed to send reminder email:', error);
            return { success: false, error: error.message };
        }
    },

    // Test email configuration
    async testEmailConfig() {
        try {
            const transporter = createTransporter();
            await transporter.verify();
            console.log('✅ Email configuration is valid');
            return { success: true };
        } catch (error) {
            console.error('❌ Email configuration error:', error);
            return { success: false, error: error.message };
        }
    },

    // Send custom email from admin
    async sendCustomEmail({ to, subject, content, senderName, senderEmail }) {
        try {
            const transporter = createTransporter();
            const adminEmail = process.env.EMAIL_USER || senderEmail || 'admin@library.edu.vn';

            const mailOptions = {
                from: `"${senderName} - Thư Viện" <${adminEmail}>`,
                to: to,
                subject: subject,
                text: content,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #0d6efd, #0d5c8f); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                            <h2 style="margin: 0; font-size: 20px;">📨 ${subject}</h2>
                        </div>
                        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                            <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
${content}
                            </div>
                            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                            <p style="font-size: 12px; color: #6c757d; margin: 0;">
                                Email này được gửi từ Hệ thống Quản lý Thư viện<br>
                                Vui lòng không trả lời email này
                            </p>
                        </div>
                    </div>
                `
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Custom email sent to:', to);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Failed to send custom email:', error);
            return { success: false, error: error.message };
        }
    },

    // Send password reset email
    sendPasswordResetEmail: async (to, resetUrl) => {
        try {
            const transporter = createTransporter();
            const sender = await getAdminSender();

            const mailOptions = {
                from: `"${sender.name}" <${sender.email}>`,
                to,
                subject: '🔐 Đặt lại mật khẩu - Thư viện',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px;">🔐 Đặt lại mật khẩu</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thư Viện Trường Đại Học</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                                Xin chào,
                            </p>
                            
                            <p style="color: #666; margin-bottom: 25px;">
                                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
                                Vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới:
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" 
                                   style="display: inline-block; background: #007bff; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                    Đặt lại mật khẩu
                                </a>
                            </div>
                            
                            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                                <p style="margin: 0; color: #856404; font-size: 14px;">
                                    ⏰ <strong>Lưu ý:</strong> Link này sẽ hết hạn sau <strong>15 phút</strong>.
                                </p>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                                Hoặc copy link sau vào trình duyệt:
                            </p>
                            <div style="background: white; border: 1px solid #dee2e6; padding: 12px; border-radius: 4px; 
                                        word-break: break-all; font-size: 13px; color: #495057; margin-bottom: 25px;">
                                ${resetUrl}
                            </div>
                            
                            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                                <p style="margin: 0; color: #721c24; font-size: 14px;">
                                    🛡️ <strong>Bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, 
                                    vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.
                                </p>
                            </div>
                            
                            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                            
                            <p style="font-size: 12px; color: #6c757d; margin: 0; text-align: center;">
                                Email này được gửi từ Hệ thống Quản lý Thư viện<br>
                                Vui lòng không trả lời email này
                            </p>
                        </div>
                    </div>
                `
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Password reset email sent to:', to);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Failed to send password reset email:', error);
            return { success: false, error: error.message };
        }
    }
};

module.exports = emailService;