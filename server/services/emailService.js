const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('🔧 Initializing Email Service...');
    console.log('📧 SMTP User:', process.env.SMTP_USER);
    console.log('📧 SMTP Pass:', process.env.SMTP_PASS ? '***configured***' : 'NOT SET');
    
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test the connection
    this.testConnection();
  }

  // Test SMTP connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      if (error.message.includes('Invalid login')) {
        console.log('🔧 Gmail App Password Issue:');
        console.log('   1. Go to https://myaccount.google.com/apppasswords');
        console.log('   2. Generate a new App Password for "Mail"');
        console.log('   3. Update SMTP_PASS in .env file');
        console.log('   4. Make sure 2FA is enabled on your Google account');
      }
    }
  }

  // Generate 6-digit OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email for registration/login
  async sendOTPEmail(email, otp, purpose = 'verification') {
    const subject = purpose === 'login' ? 'Your Login OTP - Cryptosden' : 'Verify Your Email - Cryptosden';
    const template = this.getOTPTemplate(otp, purpose);

    try {
      // Check if SMTP credentials are configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('❌ SMTP credentials not configured in .env file');
        console.log('📧 To: ' + email);
        console.log('📧 OTP Code: ' + otp);
        console.log('📧 Please configure SMTP_USER and SMTP_PASS to send actual emails');
        return false; // Return false to indicate email wasn't sent
      }

      // Always attempt to send actual email when credentials are available
      console.log('📧 Attempting to send OTP email to:', email);
      
      await this.transporter.sendMail({
        from: `"Cryptosden" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: template
      });
      
      console.log('✅ OTP email sent successfully to:', email);
      return true;
      
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      
      // Provide specific error guidance
      if (error.message.includes('Invalid login')) {
        console.log('🔧 Gmail Authentication Error:');
        console.log('   1. Make sure 2-Factor Authentication is enabled on your Google account');
        console.log('   2. Generate a new App Password at: https://myaccount.google.com/apppasswords');
        console.log('   3. Use the 16-character app password (not your regular password)');
        console.log('   4. Update SMTP_PASS in your .env file');
      }
      
      // For development, still log the OTP but return false to indicate failure
      console.log('📧 FALLBACK - OTP for development:');
      console.log('📧 Email: ' + email);
      console.log('📧 OTP Code: ' + otp);
      
      return false; // Return false to indicate email sending failed
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetLink, userName = 'User') {
    const subject = 'Reset Your Password - Cryptosden';
    const template = this.getPasswordResetTemplate(resetLink, userName);

    try {
      // Check if SMTP credentials are configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('❌ SMTP credentials not configured in .env file');
        console.log('📧 To: ' + email);
        console.log('📧 Reset Link: ' + resetLink);
        console.log('📧 Please configure SMTP_USER and SMTP_PASS to send actual emails');
        return false; // Return false to indicate email wasn't sent
      }

      // Always attempt to send actual email when credentials are available
      console.log('📧 Attempting to send password reset email to:', email);
      
      await this.transporter.sendMail({
        from: `"Cryptosden" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: template
      });
      
      console.log('✅ Password reset email sent successfully to:', email);
      return true;
      
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      
      // Provide specific error guidance
      if (error.message.includes('Invalid login')) {
        console.log('🔧 Gmail Authentication Error:');
        console.log('   1. Make sure 2-Factor Authentication is enabled on your Google account');
        console.log('   2. Generate a new App Password at: https://myaccount.google.com/apppasswords');
        console.log('   3. Use the 16-character app password (not your regular password)');
        console.log('   4. Update SMTP_PASS in your .env file');
      }
      
      // For development, still log the reset link but return false to indicate failure
      console.log('📧 FALLBACK - Reset link for development:');
      console.log('📧 Email: ' + email);
      console.log('📧 Reset Link: ' + resetLink);
      
      return false; // Return false to indicate email sending failed
    }
  }

  // Send general email (for notifications, alerts, etc.)
  async sendEmail({ to, subject, html, text }) {
    try {
      // Check if SMTP credentials are configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('❌ SMTP credentials not configured in .env file');
        console.log('📧 To: ' + to);
        console.log('📧 Subject: ' + subject);
        console.log('📧 Please configure SMTP_USER and SMTP_PASS to send actual emails');
        return false;
      }

      console.log('📧 Attempting to send email to:', to);
      console.log('📧 Subject:', subject);
      
      const mailOptions = {
        from: `"Cryptosden" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        html: html,
        text: text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully to:', to);
      console.log('📧 Message ID:', result.messageId);
      return true;
      
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      
      // Provide specific error guidance
      if (error.message.includes('Invalid login')) {
        console.log('🔧 Gmail Authentication Error:');
        console.log('   1. Make sure 2-Factor Authentication is enabled on your Google account');
        console.log('   2. Generate a new App Password at: https://myaccount.google.com/apppasswords');
        console.log('   3. Use the 16-character app password (not your regular password)');
        console.log('   4. Update SMTP_PASS in your .env file');
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('🔧 Network Error:');
        console.log('   1. Check your internet connection');
        console.log('   2. Verify SMTP_HOST is correct:', process.env.SMTP_HOST);
        console.log('   3. Check if firewall is blocking SMTP port:', process.env.SMTP_PORT);
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('🔧 Connection Refused:');
        console.log('   1. SMTP server may be down or unreachable');
        console.log('   2. Check SMTP_HOST and SMTP_PORT settings');
        console.log('   3. Try using port 465 (SSL) instead of 587 (TLS)');
      }
      
      console.log('📧 FALLBACK - Email details for development:');
      console.log('📧 To: ' + to);
      console.log('📧 Subject: ' + subject);
      
      return false;
    }
  }

  // Password reset email template
  getPasswordResetTemplate(resetLink, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Cryptosden</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0f172a; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; }
          .header { background: linear-gradient(135deg, #2c5f5f, #1e3a3a); padding: 40px 20px; text-align: center; }
          .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .header-text { color: #b2dfdb; font-size: 16px; }
          .content { padding: 40px 20px; color: #e2e8f0; }
          .reset-container { background-color: #334155; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
          .reset-button { display: inline-block; background-color: #4dd0e1; color: #0d4f4f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .reset-link { color: #4dd0e1; word-break: break-all; font-size: 14px; margin-top: 20px; }
          .warning { background-color: #fbbf24; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 Cryptosden</div>
            <div class="header-text">Password Reset Request</div>
          </div>
          <div class="content">
            <h2 style="color: #f1f5f9; margin-bottom: 20px;">Hello ${userName}!</h2>
            <p>We received a request to reset your password for your Cryptosden account.</p>
            <div class="reset-container">
              <div style="color: #94a3b8; margin-bottom: 10px;">Click the button below to reset your password:</div>
              <a href="${resetLink}" class="reset-button">Reset Password</a>
              <div style="color: #64748b; font-size: 14px; margin-top: 15px;">This link expires in 1 hour</div>
              <div class="reset-link">
                Or copy and paste this link: ${resetLink}
              </div>
            </div>
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
            <p style="color: #94a3b8;">If you're having trouble with the button above, copy and paste the link into your web browser.</p>
          </div>
          <div class="footer">
            <p>© 2024 Cryptosden. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  getOTPTemplate(otp, purpose) {
    const title = purpose === 'login' ? 'Login Verification' : 'Email Verification';
    const message = purpose === 'login' 
      ? 'Use this OTP to complete your login to Cryptosden:'
      : 'Use this OTP to verify your email and complete your registration:';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Cryptosden</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0f172a; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; }
          .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 20px; text-align: center; }
          .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .header-text { color: #e2e8f0; font-size: 16px; }
          .content { padding: 40px 20px; color: #e2e8f0; }
          .otp-container { background-color: #334155; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; margin: 20px 0; }
          .warning { background-color: #fbbf24; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 Cryptosden</div>
            <div class="header-text">${title}</div>
          </div>
          <div class="content">
            <h2 style="color: #f1f5f9; margin-bottom: 20px;">Hello!</h2>
            <p>${message}</p>
            <div class="otp-container">
              <div style="color: #94a3b8; margin-bottom: 10px;">Your verification code:</div>
              <div class="otp-code">${otp}</div>
              <div style="color: #64748b; font-size: 14px;">This code expires in 10 minutes</div>
            </div>
            <div class="warning">
              <strong>Security Notice:</strong> Never share this code with anyone. Cryptosden will never ask for your verification code via phone or email.
            </div>
            <p style="color: #94a3b8;">If you didn't request this code, please ignore this email or contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 Cryptosden. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailService;