const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Alert = require('../models/Alert');
const User = require('../models/User');

dotenv.config();

const setupAlerts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptosden');
    console.log('Connected to MongoDB');

    // Create indexes for better performance
    await Alert.collection.createIndex({ userId: 1, isActive: 1 });
    await Alert.collection.createIndex({ cryptocurrency: 1, type: 1, isActive: 1 });
    await Alert.collection.createIndex({ isTriggered: 1, isActive: 1 });
    await Alert.collection.createIndex({ triggeredAt: -1 });
    
    console.log('Alert indexes created successfully');

    // Optional: Create sample alerts for testing (uncomment if needed)
    /*
    const sampleUser = await User.findOne({ role: 'user' });
    if (sampleUser) {
      const sampleAlerts = [
        {
          userId: sampleUser._id,
          type: 'price',
          cryptocurrency: 'bitcoin',
          condition: 'above',
          threshold: 50000,
          notificationMethod: ['email']
        },
        {
          userId: sampleUser._id,
          type: 'sentiment',
          cryptocurrency: 'ethereum',
          condition: 'below',
          threshold: 30,
          notificationMethod: ['email']
        }
      ];

      for (const alertData of sampleAlerts) {
        const existingAlert = await Alert.findOne({
          userId: alertData.userId,
          type: alertData.type,
          cryptocurrency: alertData.cryptocurrency
        });

        if (!existingAlert) {
          await Alert.create(alertData);
          console.log(`Created sample ${alertData.type} alert for ${alertData.cryptocurrency}`);
        }
      }
    }
    */

    console.log('Alert system setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up alerts:', error);
    process.exit(1);
  }
};

setupAlerts();