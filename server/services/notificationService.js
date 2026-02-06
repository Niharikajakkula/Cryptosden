const EmailService = require('./emailService');

class NotificationService {
  constructor() {
    this.emailQueue = [];
    this.pushQueue = [];
    this.smsQueue = [];
    this.emailService = new EmailService(); // Create instance of EmailService
  }

  // Send email notification
  async sendEmail(user, notification) {
    try {
      const { subject, message, type, data } = notification;
      
      // Check user preferences
      if (user.notificationPreferences?.email?.enabled === false) {
        console.log(`Email notifications disabled for user ${user.email}`);
        return { success: false, reason: 'Email notifications disabled' };
      }

      // Check quiet hours
      if (this.isQuietHours(user)) {
        console.log(`Quiet hours active for user ${user.email}, queuing notification`);
        this.emailQueue.push({ user, notification, scheduledFor: this.getNextActiveTime(user) });
        return { success: true, queued: true };
      }

      const emailContent = this.generateEmailContent(type, message, data, user);
      
      await this.emailService.sendEmail({
        to: user.email,
        subject: subject || 'Cryptosden Notification',
        html: emailContent
      });

      console.log(`Email notification sent to ${user.email}`);
      return { success: true, method: 'email', recipient: user.email };
    } catch (error) {
      console.error('Error sending email notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification (placeholder)
  async sendPush(user, notification) {
    try {
      // Check user preferences
      if (user.notificationPreferences?.push?.enabled === false) {
        console.log(`Push notifications disabled for user ${user._id}`);
        return { success: false, reason: 'Push notifications disabled' };
      }

      // Implement push notification logic here
      // This would integrate with services like Firebase Cloud Messaging
      console.log(`Push notification would be sent to user ${user._id}:`, notification);
      
      return { success: true, method: 'push', recipient: user._id };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification (placeholder)
  async sendSMS(user, notification) {
    try {
      // Check user preferences
      if (user.notificationPreferences?.sms?.enabled === false) {
        console.log(`SMS notifications disabled for user ${user.phone}`);
        return { success: false, reason: 'SMS notifications disabled' };
      }

      if (!user.phone) {
        return { success: false, reason: 'No phone number provided' };
      }

      // Implement SMS logic here
      // This would integrate with services like Twilio
      console.log(`SMS would be sent to ${user.phone}:`, notification.message);
      
      return { success: true, method: 'sms', recipient: user.phone };
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification via multiple methods
  async sendMultiMethod(user, notification, methods = ['email']) {
    const results = [];
    
    for (const method of methods) {
      let result;
      switch (method) {
        case 'email':
          result = await this.sendEmail(user, notification);
          break;
        case 'push':
          result = await this.sendPush(user, notification);
          break;
        case 'sms':
          result = await this.sendSMS(user, notification);
          break;
        default:
          result = { success: false, error: `Unknown method: ${method}` };
      }
      
      results.push({ method, ...result });
    }
    
    return results;
  }

  // Main method called by alert service
  async sendNotification(user, alert, message, notificationMethods = ['email']) {
    try {
      console.log(`📬 Sending notification to ${user.email} via methods:`, notificationMethods);
      
      const notification = {
        type: 'alert',
        subject: `🔔 Cryptosden Alert: ${alert.cryptocurrency.toUpperCase()}`,
        message: message,
        data: {
          cryptocurrency: alert.cryptocurrency,
          currentPrice: alert.currentValue,
          threshold: alert.threshold,
          alertType: alert.type,
          condition: alert.condition
        }
      };

      // Ensure notificationMethods is an array
      const methods = Array.isArray(notificationMethods) ? notificationMethods : [notificationMethods];
      
      const results = await this.sendMultiMethod(user, notification, methods);
      
      console.log('📬 Notification results:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Error in sendNotification:', error);
      return [{ success: false, error: error.message }];
    }
  }

  // Generate email content based on notification type
  generateEmailContent(type, message, data = {}, user) {
    const baseStyle = `
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    `;

    switch (type) {
      case 'alert':
        return `
          <html>
            <head>${baseStyle}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔔 Cryptosden Alert</h1>
                </div>
                <div class="content">
                  <h2>Hello ${user.name || 'Trader'}!</h2>
                  <div class="alert-box">
                    <strong>Alert Triggered:</strong> ${message}
                  </div>
                  ${data.cryptocurrency ? `<p><strong>Cryptocurrency:</strong> ${data.cryptocurrency.toUpperCase()}</p>` : ''}
                  ${data.currentPrice ? `<p><strong>Current Price:</strong> $${data.currentPrice.toLocaleString()}</p>` : ''}
                  ${data.threshold ? `<p><strong>Threshold:</strong> $${data.threshold.toLocaleString()}</p>` : ''}
                  <a href="http://localhost:3000/smart-alerts" class="button">Manage Alerts</a>
                </div>
                <div class="footer">
                  <p>This alert was sent because you have active notifications enabled.</p>
                  <p><a href="http://localhost:3000/notifications/unsubscribe/${user._id}">Unsubscribe</a> | <a href="http://localhost:3000/profile">Notification Settings</a></p>
                </div>
              </div>
            </body>
          </html>
        `;

      case 'market_update':
        return `
          <html>
            <head>${baseStyle}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📈 Market Update</h1>
                </div>
                <div class="content">
                  <h2>Hello ${user.name || 'Trader'}!</h2>
                  <p>${message}</p>
                  ${data.marketData ? `
                    <div class="alert-box">
                      <h3>Market Summary</h3>
                      <p><strong>Total Market Cap:</strong> $${(data.marketData.totalMarketCap / 1e12).toFixed(2)}T</p>
                      <p><strong>24h Volume:</strong> $${(data.marketData.totalVolume / 1e9).toFixed(2)}B</p>
                      <p><strong>BTC Dominance:</strong> ${data.marketData.btcDominance}%</p>
                    </div>
                  ` : ''}
                  <a href="http://localhost:3000/emotional-volatility" class="button">View Emotion Insights</a>
                </div>
                <div class="footer">
                  <p><a href="http://localhost:3000/notifications/unsubscribe/${user._id}">Unsubscribe</a> | <a href="http://localhost:3000/profile">Notification Settings</a></p>
                </div>
              </div>
            </body>
          </html>
        `;

      case 'security':
        return `
          <html>
            <head>${baseStyle}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔒 Security Alert</h1>
                </div>
                <div class="content">
                  <h2>Hello ${user.name || 'User'}!</h2>
                  <div class="alert-box" style="background: #ffebee; border-left-color: #f44336;">
                    <strong>Security Notice:</strong> ${message}
                  </div>
                  <p>If this wasn't you, please secure your account immediately.</p>
                  <a href="http://localhost:3000/profile" class="button">Review Account</a>
                </div>
                <div class="footer">
                  <p>This is a security notification and cannot be unsubscribed from.</p>
                </div>
              </div>
            </body>
          </html>
        `;

      case 'test':
        return `
          <html>
            <head>${baseStyle}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🧪 Test Notification</h1>
                </div>
                <div class="content">
                  <h2>Hello ${user.name || 'User'}!</h2>
                  <p>${message}</p>
                  <div class="alert-box">
                    <p>This is a test notification to verify your email settings are working correctly.</p>
                    <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <a href="http://localhost:3000/profile" class="button">Notification Settings</a>
                </div>
                <div class="footer">
                  <p><a href="http://localhost:3000/notifications/unsubscribe/${user._id}">Unsubscribe</a> | <a href="http://localhost:3000/profile">Notification Settings</a></p>
                </div>
              </div>
            </body>
          </html>
        `;

      default:
        return `
          <html>
            <head>${baseStyle}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📢 Cryptosden Notification</h1>
                </div>
                <div class="content">
                  <h2>Hello ${user.name || 'User'}!</h2>
                  <p>${message}</p>
                  <a href="http://localhost:3000/dashboard" class="button">Visit Dashboard</a>
                </div>
                <div class="footer">
                  <p><a href="http://localhost:3000/notifications/unsubscribe/${user._id}">Unsubscribe</a> | <a href="http://localhost:3000/profile">Notification Settings</a></p>
                </div>
              </div>
            </body>
          </html>
        `;
    }
  }

  // Check if current time is within user's quiet hours
  isQuietHours(user) {
    if (!user.notificationPreferences?.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const { start, end, timezone = 'UTC' } = user.notificationPreferences.quietHours;
    
    // Simple implementation - in production, you'd handle timezones properly
    const currentHour = now.getHours();
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    
    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  // Get next active time after quiet hours
  getNextActiveTime(user) {
    const now = new Date();
    const { end } = user.notificationPreferences.quietHours;
    const endHour = parseInt(end.split(':')[0]);
    const endMinute = parseInt(end.split(':')[1] || '0');
    
    const nextActive = new Date(now);
    nextActive.setHours(endHour, endMinute, 0, 0);
    
    if (nextActive <= now) {
      nextActive.setDate(nextActive.getDate() + 1);
    }
    
    return nextActive;
  }

  // Process queued notifications
  async processQueue() {
    const now = new Date();
    
    // Process email queue
    const readyEmails = this.emailQueue.filter(item => item.scheduledFor <= now);
    for (const item of readyEmails) {
      await this.sendEmail(item.user, item.notification);
      this.emailQueue = this.emailQueue.filter(queued => queued !== item);
    }
    
    // Process other queues similarly...
  }

  // Start queue processor
  startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 60000); // Check every minute
  }
}

module.exports = new NotificationService();