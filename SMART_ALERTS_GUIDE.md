# Smart Alert System - Cryptosden

## Overview
The Smart Alert System is a comprehensive notification system that monitors cryptocurrency markets and alerts users when specific conditions are met. It supports multiple alert types, real-time monitoring, and various notification methods.

## Features

### Alert Types
1. **Price Alerts** - Monitor price movements and thresholds
2. **Sentiment Alerts** - Track market sentiment changes
3. **Risk Alerts** - Monitor risk level fluctuations
4. **Volume Alerts** - Watch for volume spikes or drops
5. **Technical Alerts** - Technical indicator signals (RSI, MACD, etc.)

### Conditions
- **Above/Below** - Trigger when value crosses threshold
- **Crosses Up/Down** - Trigger when value crosses through threshold
- **Change Percent** - Trigger on percentage change

### Notification Methods
- **Email** - Immediate email notifications (active)
- **Push Notifications** - Browser/mobile push (coming soon)
- **SMS** - Text message alerts (coming soon)

## Backend Architecture

### Models
- **Alert Model** (`server/models/Alert.js`)
  - Stores alert configurations and status
  - Tracks trigger history and current values
  - Supports metadata for different alert types

### Services
- **Alert Service** (`server/services/alertService.js`)
  - Background monitoring system
  - Fetches market data from CoinGecko API
  - Evaluates alert conditions
  - Sends notifications via email service
  - Runs every minute to check active alerts

### API Routes
- **GET /api/alerts** - Fetch user alerts
- **POST /api/alerts** - Create new alert
- **PUT /api/alerts/:id** - Update alert
- **DELETE /api/alerts/:id** - Delete alert
- **PATCH /api/alerts/:id/toggle** - Toggle alert status
- **GET /api/alerts/stats** - Get alert statistics
- **POST /api/alerts/:id/test** - Send test notification

## Frontend Components

### Pages
- **SmartAlerts** (`client/src/pages/SmartAlerts.js`)
  - Main alerts dashboard
  - Alert statistics and filtering
  - Create/manage alerts interface

### Components
- **AlertCard** (`client/src/components/AlertCard.js`)
  - Individual alert display
  - Status indicators and actions
  - Toggle, test, and delete functionality

- **CreateAlertModal** (`client/src/components/CreateAlertModal.js`)
  - Alert creation interface
  - Form validation and submission
  - Dynamic condition options based on alert type

- **AlertNotifications** (`client/src/components/AlertNotifications.js`)
  - Real-time notification display
  - Notification bell with badge
  - Recent alerts panel

## Usage Guide

### Creating Alerts
1. Navigate to Smart Alerts page
2. Click "Create Alert" button
3. Select alert type (Price, Sentiment, Risk, Volume, Technical)
4. Choose cryptocurrency
5. Set condition and threshold value
6. Select notification methods
7. Submit to activate alert

### Managing Alerts
- **Toggle Status** - Activate/deactivate alerts
- **Test Alerts** - Send test notifications
- **Delete Alerts** - Remove unwanted alerts
- **Filter Alerts** - View by type or status

### Alert Conditions

#### Price Alerts
- **Above**: `BTC > $50,000`
- **Below**: `ETH < $3,000`
- **Crosses Up**: `ADA crosses above $0.50`
- **Crosses Down**: `SOL crosses below $100`

#### Sentiment Alerts
- **Above**: `Sentiment score > 70%`
- **Below**: `Sentiment score < 30%`
- **Change**: `Sentiment changes by > 20%`

#### Risk Alerts
- **Above**: `Risk level > 80%`
- **Below**: `Risk level < 20%`

#### Volume Alerts
- **Above**: `24h volume > $1B`
- **Below**: `24h volume < $100M`
- **Change**: `Volume changes by > 50%`

#### Technical Alerts
- **RSI Above**: `RSI > 70 (overbought)`
- **RSI Below**: `RSI < 30 (oversold)`
- **MACD Signals**: `MACD crossover`

## Technical Implementation

### Alert Monitoring Flow
1. **Scheduler** runs every minute
2. **Fetch Active Alerts** from database
3. **Group by Cryptocurrency** for efficient API calls
4. **Fetch Market Data** from CoinGecko
5. **Evaluate Conditions** for each alert
6. **Trigger Notifications** when conditions are met
7. **Update Alert Status** and log triggers

### Notification System
- **Email Service** integration for immediate alerts
- **Template-based** HTML email notifications
- **Error Handling** for failed deliveries
- **Rate Limiting** to prevent spam

### Performance Optimizations
- **Database Indexing** for fast alert queries
- **Batch API Calls** to reduce external requests
- **Caching** of market data between checks
- **Efficient Filtering** of active alerts only

## Configuration

### Environment Variables
```env
# Email Service (for notifications)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Database
MONGODB_URI=mongodb://localhost:27017/cryptosden

# API Keys (if needed for premium features)
COINGECKO_API_KEY=your-api-key
```

### Server Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run setup script: `node server/scripts/setupAlerts.js`
4. Start server: `npm run dev`

### Client Setup
1. Install dependencies: `npm install`
2. Start development server: `npm start`
3. Navigate to `/smart-alerts` to access the system

## Monitoring and Maintenance

### Logs
- Alert service logs all monitoring activities
- Failed notifications are logged with error details
- Performance metrics tracked for optimization

### Database Maintenance
- Regular cleanup of old triggered alerts
- Index optimization for query performance
- Backup of critical alert configurations

### API Rate Limits
- CoinGecko API: 50 calls/minute (free tier)
- Batch requests to minimize API usage
- Fallback mechanisms for API failures

## Future Enhancements

### Planned Features
1. **Push Notifications** - Browser and mobile push alerts
2. **SMS Notifications** - Text message integration
3. **Webhook Support** - Custom webhook endpoints
4. **Advanced Analytics** - Alert performance metrics
5. **Machine Learning** - Predictive alert suggestions
6. **Social Alerts** - Community-driven alert sharing

### Technical Improvements
1. **WebSocket Integration** - Real-time alert updates
2. **Redis Caching** - Improved performance
3. **Microservices** - Scalable architecture
4. **Load Balancing** - High availability
5. **Advanced Monitoring** - System health tracking

## Troubleshooting

### Common Issues
1. **Alerts Not Triggering**
   - Check alert is active
   - Verify threshold values
   - Check server logs for errors

2. **Email Notifications Not Received**
   - Verify email service configuration
   - Check spam folder
   - Test email service connection

3. **Performance Issues**
   - Monitor API rate limits
   - Check database indexes
   - Review server resource usage

### Support
For technical support or feature requests, please refer to the main project documentation or contact the development team.