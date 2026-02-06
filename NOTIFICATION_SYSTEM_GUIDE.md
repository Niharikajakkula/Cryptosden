# Notification System - Cryptosden

## Overview
The Notification System is a comprehensive communication platform that manages user preferences, sends notifications via multiple channels, and provides a centralized notification center for users to manage their communication settings.

## Features

### Notification Methods
1. **Email Notifications** - Rich HTML email notifications (active)
2. **Push Notifications** - Browser and mobile push notifications (coming soon)
3. **SMS Notifications** - Text message alerts (coming soon)

### Notification Categories
1. **Smart Alerts** - Price, sentiment, risk, volume, and technical alerts
2. **Market Updates** - Daily market summaries and insights
3. **Security Alerts** - Account security and login notifications
4. **Newsletter** - Weekly crypto news and platform updates

### Advanced Features
- **Quiet Hours** - Pause non-urgent notifications during specific hours
- **Frequency Control** - Immediate, daily digest, or weekly summary
- **Notification History** - Track all sent notifications
- **Test Notifications** - Verify notification settings
- **Unsubscribe Links** - Easy opt-out from email notifications

## Backend Architecture

### Models
- **User Model** - Extended with comprehensive notification preferences
- **Alert Model** - Integrated with notification system for alert delivery

### Services
- **Notification Service** (`server/services/notificationService.js`)
  - Multi-channel notification delivery
  - Template-based email generation
  - Quiet hours management
  - Notification queuing system

### API Routes
- **GET /api/notifications/preferences** - Fetch user notification preferences
- **PUT /api/notifications/preferences** - Update notification preferences
- **GET /api/notifications/history** - Get notification history
- **PATCH /api/notifications/read** - Mark notifications as read
- **POST /api/notifications/test** - Send test notifications
- **GET /api/notifications/stats** - Get notification statistics
- **GET /api/notifications/unsubscribe/:token** - Unsubscribe from notifications

## Frontend Components

### Pages
- **NotificationCenter** (`client/src/pages/NotificationCenter.js`)
  - Tabbed interface for settings and history
  - Notification statistics dashboard
  - Comprehensive notification management

### Components
- **NotificationSettings** (`client/src/components/NotificationSettings.js`)
  - Method toggles (Email, Push, SMS)
  - Category preferences per method
  - Frequency settings
  - Quiet hours configuration
  - Test notification functionality

## Notification Preferences Structure

```javascript
notificationPreferences: {
  email: {
    enabled: true,
    alerts: true,
    marketUpdates: true,
    newsletter: false,
    security: true
  },
  push: {
    enabled: false,
    alerts: true,
    marketUpdates: false,
    newsletter: false,
    security: true
  },
  sms: {
    enabled: false,
    alerts: false,
    marketUpdates: false,
    newsletter: false,
    security: false
  },
  frequency: {
    immediate: true,
    daily: false,
    weekly: false
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC'
  }
}
```

## Email Templates

### Alert Notifications
- **Subject**: Cryptosden Alert: [CRYPTOCURRENCY]
- **Content**: Alert details, current price, threshold information
- **Actions**: Manage Alerts button, unsubscribe link

### Market Updates
- **Subject**: Daily Market Update - Cryptosden
- **Content**: Market summary, key statistics, insights
- **Actions**: View Market Analysis button

### Security Alerts
- **Subject**: Security Alert - Cryptosden
- **Content**: Security event details, recommended actions
- **Actions**: Review Account button (no unsubscribe)

### Test Notifications
- **Subject**: Test Notification - Cryptosden
- **Content**: Confirmation message with timestamp
- **Actions**: Notification Settings button

## Usage Guide

### Setting Up Notifications
1. Navigate to Notification Center
2. Configure notification methods (Email, Push, SMS)
3. Set category preferences for each method
4. Choose notification frequency
5. Configure quiet hours if needed
6. Test notifications to verify setup

### Managing Preferences
- **Enable/Disable Methods**: Toggle entire notification channels
- **Category Control**: Fine-tune which types of notifications to receive
- **Frequency Settings**: Choose between immediate, daily, or weekly delivery
- **Quiet Hours**: Set time periods to pause non-urgent notifications

### Viewing History
- **Recent Notifications**: See all triggered notifications
- **Filter by Type**: View specific notification categories
- **Statistics**: Track notification performance and delivery

## Technical Implementation

### Notification Flow
1. **Trigger Event** - Alert condition met or manual trigger
2. **User Preferences Check** - Verify user wants this notification type
3. **Quiet Hours Check** - Queue if during quiet hours
4. **Template Generation** - Create appropriate content for notification type
5. **Delivery** - Send via configured methods
6. **Logging** - Record delivery status and statistics

### Queue Management
- **Quiet Hours Queue** - Hold notifications during user's quiet hours
- **Retry Logic** - Retry failed deliveries with exponential backoff
- **Rate Limiting** - Prevent notification spam
- **Priority System** - Security alerts bypass quiet hours

### Email Service Integration
```javascript
// Send notification via email
await notificationService.sendEmail(user, {
  subject: 'Alert Notification',
  message: 'Your alert has been triggered',
  type: 'alert',
  data: {
    cryptocurrency: 'bitcoin',
    currentPrice: 45000,
    threshold: 44000
  }
});
```

### Template System
- **Dynamic Content** - Personalized with user data and alert information
- **Responsive Design** - Mobile-friendly email templates
- **Brand Consistency** - Cryptosden branding and styling
- **Action Buttons** - Direct links to relevant platform sections

## Configuration

### Environment Variables
```env
# Email Service
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Push Notifications (future)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# SMS Service (future)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

### Server Configuration
- **Queue Processing** - Runs every minute to process queued notifications
- **Template Caching** - Cache email templates for performance
- **Rate Limiting** - Prevent abuse and ensure deliverability

## Monitoring and Analytics

### Notification Statistics
- **Total Notifications** - Count of all sent notifications
- **Delivery Success Rate** - Percentage of successful deliveries
- **Method Performance** - Success rates by notification method
- **User Engagement** - Open rates and click-through rates

### Error Handling
- **Failed Deliveries** - Log and retry failed notifications
- **Invalid Preferences** - Handle corrupted user preferences
- **Service Outages** - Graceful degradation when services are unavailable

## Future Enhancements

### Planned Features
1. **Push Notifications** - Browser and mobile push via Firebase
2. **SMS Integration** - Text message alerts via Twilio
3. **Webhook Support** - Custom webhook endpoints for notifications
4. **Advanced Analytics** - Detailed notification performance metrics
5. **A/B Testing** - Test different notification templates and timing

### Technical Improvements
1. **WebSocket Integration** - Real-time notification updates
2. **Redis Queue** - Scalable notification queuing
3. **Microservices** - Separate notification service
4. **Machine Learning** - Optimal notification timing
5. **Multi-language** - Localized notification templates

## Troubleshooting

### Common Issues
1. **Notifications Not Received**
   - Check user preferences are enabled
   - Verify email service configuration
   - Check spam folder for emails

2. **Test Notifications Failing**
   - Verify notification method is enabled
   - Check server logs for errors
   - Confirm email service credentials

3. **Quiet Hours Not Working**
   - Check timezone configuration
   - Verify quiet hours are enabled
   - Review queue processing logs

### Debug Commands
```bash
# Check notification service status
curl -H "Authorization: Bearer $TOKEN" http://localhost:3456/api/notifications/stats

# Send test notification
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"email","message":"Test notification"}' \
  http://localhost:3456/api/notifications/test

# View notification history
curl -H "Authorization: Bearer $TOKEN" http://localhost:3456/api/notifications/history
```

## Security Considerations

### Data Protection
- **Preference Encryption** - Sensitive preferences encrypted at rest
- **Secure Tokens** - Unsubscribe tokens with expiration
- **Rate Limiting** - Prevent notification spam and abuse
- **Audit Logging** - Track all notification preference changes

### Privacy Controls
- **Granular Permissions** - Fine-grained control over notification types
- **Easy Unsubscribe** - One-click unsubscribe from emails
- **Data Retention** - Automatic cleanup of old notification history
- **GDPR Compliance** - Support for data export and deletion

This comprehensive notification system provides users with full control over their communication preferences while ensuring reliable delivery of important alerts and updates.