# MongoDB Setup Guide for Cryptosden

## Option 1: MongoDB Atlas (Cloud - Recommended)

### Steps:
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (M0 Sandbox - Free)
4. Wait for cluster to be created (2-3 minutes)
5. Click "Connect" → "Connect your application"
6. Copy the connection string
7. Update your `.env` file with the connection string

### Example .env update:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cryptosden
```

## Option 2: Local MongoDB Installation

### Windows:
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer (.msi file)
3. Choose "Complete" installation
4. Install MongoDB as a Service (recommended)
5. Install MongoDB Compass (GUI tool) when prompted
6. MongoDB will start automatically as a Windows service

### Verify Installation:
- Open Command Prompt
- Run: `mongod --version`
- Should show MongoDB version

### Start MongoDB (if not running as service):
```cmd
mongod --dbpath C:\data\db
```

## Option 3: Docker (Advanced)

### If you have Docker installed:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Verification Steps

### Test Connection:
1. Start your Cryptosden server: `npm run server`
2. Look for: "MongoDB connected" in the console
3. If successful, crypto data will start populating automatically

### Using MongoDB Compass (GUI):
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017` (local) or your Atlas connection string
3. You should see the `cryptosden` database appear after running the app

## Troubleshooting

### Common Issues:

1. **Connection refused**: MongoDB service not running
   - Windows: Check Services → MongoDB Server
   - Start the service if stopped

2. **Authentication failed**: Wrong username/password in Atlas
   - Double-check credentials in Atlas dashboard
   - Ensure IP address is whitelisted (0.0.0.0/0 for development)

3. **Network timeout**: Firewall or network issues
   - Check firewall settings
   - For Atlas: Whitelist your IP address

### Default Configuration:
- **Local MongoDB**: `mongodb://localhost:27017/cryptosden`
- **Default Port**: 27017
- **Database Name**: cryptosden (created automatically)

## What Happens When You Run the App:

1. **Database Creation**: The `cryptosden` database is created automatically
2. **Collections**: Two main collections are created:
   - `users` - For user accounts and watchlists
   - `cryptodatas` - For cryptocurrency information
3. **Data Population**: Crypto data is automatically fetched from CoinGecko API
4. **Updates**: Data refreshes every 5 minutes automatically

## Quick Start Commands:

```bash
# Install dependencies
npm run setup

# Start the application (MongoDB must be running)
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017 (if local)