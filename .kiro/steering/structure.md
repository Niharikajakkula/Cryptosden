# Project Structure & Organization

## Root Level
```
cryptosden/
├── server/                 # Backend Express application
├── client/                 # Frontend React application
├── .kiro/                  # Kiro specifications and steering
├── .env                    # Environment variables (local)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Root dependencies (dev tools)
├── package-lock.json       # Dependency lock file
├── setup.js                # Initial setup script
├── test-mongo.js           # MongoDB connection test
├── README.md               # Project documentation
├── FEATURES_SUMMARY.md     # Feature overview
├── NOTIFICATION_SYSTEM_GUIDE.md
├── SMART_ALERTS_GUIDE.md
├── GMAIL_SETUP.md
├── GOOGLE_OAUTH_SETUP.md
└── mongodb-setup.md
```

## Backend Structure (`/server`)

### Core Files
```
server/
├── index.js                # Express app initialization, Socket.io setup
├── config/
│   └── passport.js         # OAuth strategy configuration
├── middleware/
│   └── auth.js             # JWT verification, role-based access control
└── routes/                 # API endpoint handlers
    ├── auth.js             # Authentication, 2FA, KYC, OAuth
    ├── crypto.js           # Market data endpoints
    ├── wallet.js           # Wallet operations
    ├── trading.js          # Order management
    ├── portfolio.js        # Portfolio analytics
    ├── community.js        # Posts and polls
    ├── admin.js            # Admin operations
    ├── alerts.js           # Price alerts
    ├── notifications.js    # Notification management
    ├── chat.js             # Chatbot endpoint
    ├── ai.js               # AI insights
    └── oauth.js            # OAuth callbacks
```

### Models (`/server/models`)
Database schemas using Mongoose:
```
models/
├── User.js                 # User with 2FA, KYC, OAuth, roles
├── Wallet.js               # Multi-currency wallets
├── Transaction.js          # Transaction history
├── Order.js                # Trading orders
├── Portfolio.js            # Portfolio holdings and analytics
├── Post.js                 # Community forum posts
├── Poll.js                 # Community polls
├── Alert.js                # Price alerts
├── CryptoData.js           # Cached cryptocurrency data
├── AdminLog.js             # Admin action audit trail
└── Notification.js         # Notification queue
```

### Services (`/server/services`)
Business logic and external integrations:
```
services/
├── cryptoUpdater.js        # CoinGecko API integration, data caching
├── alertService.js         # Price alert monitoring and triggering
├── notificationService.js  # Email/push notification queue
├── emailService.js         # Nodemailer email sending
├── twoFactorAuth.js        # TOTP generation and verification
├── walletService.js        # Wallet operations and validation
├── tradingService.js       # Order execution and matching
├── portfolioService.js     # Portfolio calculations
└── openaiService.js        # OpenAI API integration (optional)
```

### Scripts (`/server/scripts`)
Utility and setup scripts:
```
scripts/
└── setupAlerts.js          # Initialize alert system
```

## Frontend Structure (`/client/src`)

### Pages (`/client/src/pages`)
Full-page components (one per route):
```
pages/
├── Welcome.js              # Landing page
├── Login.js                # Login with 2FA
├── Register.js             # Registration with role selection
├── ForgotPassword.js       # Password recovery
├── ResetPassword.js        # Password reset
├── RestoreAccount.js       # Account restoration after deletion
├── Dashboard.js            # Main dashboard with market overview
├── MarketAnalysis.js       # Market analysis and insights
├── CryptoDetail.js         # Individual cryptocurrency details
├── Watchlist.js            # User's watchlist
├── PricePredictions.js     # Price prediction analytics
├── SmartAlerts.js          # Alert management
├── NotificationCenter.js   # Notification history
├── Community.js            # Forum posts and polls
├── CreatePost.js           # Create forum post
├── CreatePoll.js           # Create poll
├── PostDetail.js           # View post with replies
├── Trading.js              # Trading interface
├── Portfolio.js            # Portfolio analytics
├── Profile.js              # User profile and settings
├── AdminDashboard.js       # Admin control panel
└── OAuthSuccess.js         # OAuth callback handler
```

### Components (`/client/src/components`)
Reusable UI components:
```
components/
├── Navbar.js               # Navigation bar
├── ProtectedRoute.js       # Route protection wrapper
├── AIChatbot.js            # Floating AI chatbot
├── AlertNotifications.js   # Alert notification display
├── LoginForm.js            # Login form component
├── RegisterForm.js         # Registration form
├── ForgotPasswordForm.js   # Password recovery form
├── ResetPasswordForm.js    # Password reset form
├── TwoFactorAuth.js        # 2FA setup and verification
├── KYCVerification.js      # KYC document upload
├── SecuritySettings.js     # Security configuration
├── ProfileSettings.js      # Profile management
├── NotificationSettings.js # Notification preferences
├── DangerZone.js           # Account deletion
├── CryptoTable.js          # Cryptocurrency data table
├── TradingChart.js         # Trading chart display
├── TradeHistory.js         # Trade history table
├── CreateAlertModal.js     # Alert creation modal
├── AlertCard.js            # Alert display card
├── ChatBot.js              # Chat interface
├── OAuthSuccess.js         # OAuth success handler
└── ui/                     # Base UI components
    ├── button.js           # Button component
    └── input.js            # Input component
```

### Contexts (`/client/src/contexts`)
Global state management:
```
contexts/
├── AuthContext.js          # Authentication state (user, token, login/logout)
└── CryptoContext.js        # Cryptocurrency data state (prices, watchlist)
```

### Styling
```
client/src/
├── App.css                 # App-level styles
├── index.css               # Global styles
├── global.css              # Global theme and utilities
└── tailwind.config.js      # Tailwind CSS configuration
```

### Public Assets (`/client/public`)
```
public/
├── index.html              # HTML entry point
└── manifest.json           # PWA manifest
```

## Configuration Files

### Root Level
- `package.json` - Root dependencies (concurrently, nodemon)
- `.env` - Environment variables (local, not committed)
- `.env.example` - Environment template
- `.gitignore` - Git ignore patterns
- `setup.js` - Initial setup script

### Backend
- `server/config/passport.js` - OAuth configuration
- `server/middleware/auth.js` - Authentication middleware

### Frontend
- `client/package.json` - React dependencies
- `client/tailwind.config.js` - Tailwind CSS config
- `client/postcss.config.js` - PostCSS config
- `client/public/index.html` - HTML template
- `client/public/manifest.json` - PWA manifest

## Kiro Specifications (`/.kiro`)

### Specs
```
.kiro/specs/
└── cryptosden-platform-expansion/
    └── requirements.md     # Feature specifications
```

### Steering
```
.kiro/steering/
├── product.md              # Product overview
├── tech.md                 # Technology stack
└── structure.md            # This file
```

## Code Organization Principles

### Backend
- **Routes**: Handle HTTP requests, validate input, call services
- **Services**: Contain business logic, external API calls, data processing
- **Models**: Define database schemas and validation
- **Middleware**: Cross-cutting concerns (auth, logging, error handling)

### Frontend
- **Pages**: Full-page components, route-level components
- **Components**: Reusable UI elements, form components
- **Contexts**: Global state (auth, crypto data)
- **Styling**: Tailwind CSS with custom theme

## File Naming Conventions
- **Components**: PascalCase (e.g., `LoginForm.js`)
- **Services**: camelCase with Service suffix (e.g., `cryptoUpdater.js`)
- **Routes**: lowercase (e.g., `auth.js`)
- **Models**: PascalCase (e.g., `User.js`)
- **Contexts**: PascalCase with Context suffix (e.g., `AuthContext.js`)
- **CSS**: lowercase with .css extension (e.g., `global.css`)

## Key Directories Summary

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `/server` | Backend API | index.js, routes, models, services |
| `/server/models` | Database schemas | User, Wallet, Order, etc. |
| `/server/services` | Business logic | cryptoUpdater, alertService, etc. |
| `/server/routes` | API endpoints | auth, crypto, wallet, etc. |
| `/client/src` | Frontend app | pages, components, contexts |
| `/client/src/pages` | Route pages | Dashboard, Trading, Profile, etc. |
| `/client/src/components` | UI components | Forms, Tables, Modals, etc. |
| `/client/src/contexts` | Global state | AuthContext, CryptoContext |
| `/.kiro` | Specifications | specs, steering documents |

## Development Workflow
1. Backend changes: Modify `/server` files, nodemon auto-restarts
2. Frontend changes: Modify `/client/src` files, React dev server hot-reloads
3. Database changes: Update models in `/server/models`
4. API changes: Update routes in `/server/routes` and services
5. UI changes: Update components in `/client/src/components`
6. State changes: Update contexts in `/client/src/contexts`
