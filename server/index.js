// Load environment variables FIRST (before any other imports)
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

console.log('🔍 Environment Debug:');
console.log('📁 Current working directory:', process.cwd());
console.log(' SMTP_USER from env:', process.env.SMTP_USER);
console.log('📧 SMTP_PASS from env:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
console.log('� Facebook OAuth Debug:');
console.log('📱 FACEBOOK_APP_ID from env:', process.env.FACEBOOK_APP_ID);
console.log('🔐 FACEBOOK_APP_SECRET from env:', process.env.FACEBOOK_APP_SECRET ? '***SET***' : 'NOT SET');

// Force Facebook credentials to ensure they're loaded correctly
console.log('� Setting Facebook credentials...');
process.env.FACEBOOK_APP_ID = '2346972445774727';
process.env.FACEBOOK_APP_SECRET = '455f6997b412763cf482f8b653619610';
console.log('✅ Facebook credentials set'); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('./models/User');
const { initCryptoUpdater } = require('./services/cryptoUpdater');
const alertService = require('./services/alertService');
const notificationService = require('./services/notificationService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Session middleware (required for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'cryptosden_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Required for OAuth redirect from Google
  }
}));

// Passport configuration - use full callback URL for OAuth (required for Google Cloud Console)
const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3456}`;
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${API_BASE}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google did not provide an email address. Please grant email permission.'), null);
    }

    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email }
      ]
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    user = new User({
      googleId: profile.id,
      name: profile.displayName || profile.name?.givenName || 'User',
      email,
      isVerified: true,
      role: 'user'
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${API_BASE}/api/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'email', 'photos']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔵 Facebook OAuth - Profile received:', {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails ? profile.emails[0].value : 'No email provided'
    });

    let user = await User.findOne({ 
      $or: [
        { facebookId: profile.id },
        { email: profile.emails ? profile.emails[0].value : null }
      ]
    });

    if (user) {
      console.log('🔵 Facebook OAuth - Existing user found:', user.email);
      if (!user.facebookId) {
        user.facebookId = profile.id;
        await user.save();
        console.log('🔵 Facebook OAuth - Updated existing user with Facebook ID');
      }
      return done(null, user);
    }

    console.log('🔵 Facebook OAuth - Creating new user');
    user = new User({
      facebookId: profile.id,
      name: profile.displayName,
      email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
      profilePicture: profile.photos ? profile.photos[0].value : null,
      isVerified: true,
      role: 'user'
    });

    await user.save();
    console.log('🔵 Facebook OAuth - New user created:', user.email);
    return done(null, user);
  } catch (error) {
    console.error('❌ Facebook OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crypto', require('./routes/crypto'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/trading', require('./routes/trading'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/community', require('./routes/community'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/evim', require('./routes/evim'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      alerts: 'active',
      notifications: 'active'
    }
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Skip MongoDB connection - run in API-only mode
console.log('🔄 Attempting MongoDB Atlas connection...');
console.log('📍 Connecting to MongoDB Atlas...');
console.log("MONGODB_URI =", process.env.MONGODB_URI ? 'Set (Atlas)' : 'Not found');

const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority'
  })
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('📊 Database: CryptosdenDB');
    
    // Initialize services after successful connection
    const { initCryptoUpdater } = require('./services/cryptoUpdater');
    const alertService = require('./services/alertService');
    const notificationService = require('./services/notificationService');
    
    console.log('🚀 Initializing MongoDB-dependent services...');
    initCryptoUpdater();
    alertService.start();
    notificationService.startQueueProcessor();
    console.log('🔔 All services initialized successfully');
  })
  .catch(err => {
    console.log('❌ MongoDB Atlas connection failed:');
    console.log('   Error:', err.message);
    console.log('   Code:', err.code);
    console.log('⚠️  Running in API-only mode');
  });
} else {
  console.log('❌ No MongoDB URI found');
  console.log('⚠️  Running in API-only mode');
}

// Initialize services without MongoDB
console.log('� Initializing services...');
// Skip crypto updater and alert service that require MongoDB
console.log('📊 Crypto data will be fetched directly from CoinGecko API');
console.log('✅ Server ready in API-only mode');
// MongoDB connection handlers - disabled for API-only mode
// mongoose.connection.on('connected', () => {
//   console.log('🔗 Mongoose connected to MongoDB');
// });

// mongoose.connection.on('error', (err) => {
//   console.log('❌ Mongoose connection error:', err.message);
// });

// mongoose.connection.on('disconnected', () => {
//   console.log('🔌 Mongoose disconnected from MongoDB');
// });

// Use PORT from .env - OAuth requires exact callback URL match in Google Console
const PORT = parseInt(process.env.PORT, 10) || 3463;
server.listen(PORT, () => {
  const apiUrl = process.env.API_BASE_URL || `http://localhost:${PORT}`;
  console.log(`✅ Cryptosden Server running on port ${PORT}`);
  console.log(`🌐 Backend API: ${apiUrl}`);
  if (process.env.GOOGLE_CLIENT_ID) {
    console.log(`🔐 Google OAuth callback: ${apiUrl}/api/auth/google/callback`);
  }
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is in use. Stop the other process or change PORT in .env`);
    console.error('   Run: Get-Process -Id (Get-NetTCPConnection -LocalPort ' + PORT + ').OwningProcess | Stop-Process');
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

module.exports = { app, io };