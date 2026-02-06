# Cryptosden - Complete Cryptocurrency Trading & Community Platform

**Cryptosden** is a comprehensive, full-stack cryptocurrency platform that combines advanced trading capabilities, community features, portfolio management, and administrative tools. Built with modern web technologies, it provides everything needed for a complete crypto ecosystem.

## 🎯 What We Built

We created a **complete cryptocurrency platform** from scratch with 5 major modules:

### 🔐 **Module 1: Advanced Authentication & User Management**
- **Multi-Role System**: User → Trader → Admin progression
- **Two-Factor Authentication (2FA)**: TOTP with backup codes
- **KYC Verification**: Document upload and admin review
- **OAuth Integration**: Google & Facebook login
- **Account Security**: Lockout protection, secure passwords
- **Account Management**: Profile settings, account deletion with 30-day grace period

### 💰 **Module 2: Cryptocurrency Wallets & Transactions**
- **Multi-Currency Wallets**: Bitcoin, Ethereum, major altcoins
- **Secure Storage**: Encrypted private keys
- **Transaction Processing**: Deposits, withdrawals, transfers
- **Real-time Tracking**: Live transaction monitoring
- **Balance Management**: Available vs locked funds
- **Transaction History**: Complete audit trail

### 📈 **Module 3: Professional Trading Platform**
- **Advanced Order Types**: Market, Limit, Stop-Loss orders
- **Real-time Order Book**: Live bid/ask data
- **Portfolio Analytics**: P&L tracking, performance metrics
- **Risk Assessment**: Automated risk scoring
- **Trading Interface**: Professional-grade trading dashboard
- **Order Management**: Place, modify, cancel orders

### 👥 **Module 4: Community & Social Features**
- **Discussion Forums**: Categorized posts with voting
- **Interactive Polls**: Community polls with analytics
- **Reputation System**: User reputation based on contributions
- **Content Moderation**: Admin tools and automated flagging
- **Real-time Engagement**: Live voting and commenting
- **Search & Discovery**: Advanced content search

### 🛡️ **Module 5: Admin Dashboard & Management**
- **Platform Analytics**: Real-time statistics and monitoring
- **User Management**: Complete user administration
- **Transaction Oversight**: Fraud detection and monitoring
- **Content Moderation**: Community management tools
- **Reporting System**: Detailed analytics with CSV export
- **System Health**: Platform monitoring and alerts

## 🚀 Core Platform Features

### **Real-time Market Data**
- Live cryptocurrency prices from CoinGecko API
- Automatic updates every 60 seconds (1 minute)
- Trust Score & EVI (Emotional Volatility Index) calculations
- Market statistics and trends

### **AI-Powered Chatbot**
- Intelligent cryptocurrency assistance
- Platform guidance and help
- Enhanced rule-based responses
- Optional OpenAI integration

### **Advanced Security**
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS protection and rate limiting
- Encrypted sensitive data storage

### **Modern UI/UX**
- Dark theme with cyan branding
- Responsive design (mobile-first)
- Glass-morphism effects
- Smooth animations and transitions
- Professional trading interface

## 🛠 Technology Stack

### **Backend (Node.js + Express.js)**
```
✅ Authentication: JWT, Passport.js, 2FA
✅ Database: MongoDB Atlas with Mongoose
✅ Security: bcrypt, helmet, rate limiting
✅ Real-time: Socket.io integration
✅ APIs: CoinGecko market data
✅ Services: Crypto updater, portfolio analytics
```

### **Frontend (React.js)**
```
✅ Framework: React.js with modern hooks
✅ Styling: Tailwind CSS with custom theme
✅ Icons: Lucide React library
✅ Routing: React Router v6
✅ State: Context API for global state
✅ HTTP: Axios for API communication
```

### **Database Models**
```
✅ User: Roles, 2FA, KYC, reputation, account deletion
✅ Wallet: Multi-currency with encrypted keys
✅ Transaction: Complete transaction tracking
✅ Order: Advanced trading orders
✅ Portfolio: Real-time analytics
✅ Post/Poll: Community content with voting
✅ AdminLog: Platform management tracking
```

## 📱 User Experience Flow

### **For Regular Users:**
1. **Register** → Choose User or Trader role
2. **Dashboard** → View market data and portfolio
3. **Watchlist** → Track favorite cryptocurrencies
4. **Community** → Participate in discussions and polls
5. **Profile** → Manage account settings and security

### **For Traders:**
1. **All User Features** +
2. **Trading** → Place orders and manage positions
3. **Portfolio** → Advanced analytics and tracking
4. **Wallets** → Manage cryptocurrency wallets
5. **Advanced Tools** → Professional trading interface

### **For Admins:**
1. **All Features** +
2. **User Management** → Manage users and roles
3. **KYC Review** → Approve/reject verification
4. **Content Moderation** → Manage community content
5. **Analytics** → Platform statistics and reports

## 🔧 Setup & Installation

### **Quick Start:**
```bash
# 1. Navigate to project
cd Cryptosden

# 2. Start backend server
npm run server

# 3. Start frontend client (new terminal)
cd client
npm start
```

### **Access Points:**
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3461
- **Database**: MongoDB Atlas (cloud)

## 🎨 Design Features

### **Visual Design:**
- **Dark Theme**: Professional dark interface
- **Cyan Branding**: #06b6d4 accent color
- **Glass Effects**: Modern glass-morphism
- **Responsive Layout**: Mobile-first design
- **Corner Glows**: Subtle lighting effects

### **User Interface:**
- **Navigation**: Clean, intuitive menu structure
- **Forms**: Consistent styling across all forms
- **Tables**: Professional data presentation
- **Modals**: Smooth overlay interactions
- **Buttons**: Gradient effects and hover states

## 🔒 Security Implementation

### **Authentication Security:**
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based auth
- **2FA Protection**: TOTP with backup codes
- **Account Lockout**: Automatic protection
- **Session Management**: Secure session handling

### **Data Protection:**
- **Input Validation**: Comprehensive sanitization
- **SQL Injection**: MongoDB injection prevention
- **XSS Protection**: Content sanitization
- **CORS Policy**: Controlled cross-origin access
- **Rate Limiting**: API abuse prevention

## 📊 Key Achievements

### **Technical Accomplishments:**
✅ **Full-Stack MERN Application** - Complete modern web app
✅ **Real-time Features** - Live updates and WebSocket integration
✅ **Advanced Security** - 2FA, RBAC, encryption
✅ **Professional UI** - Modern, responsive design
✅ **Scalable Architecture** - Modular, maintainable code

### **Business Features:**
✅ **Multi-Role System** - User progression path
✅ **Trading Platform** - Professional trading tools
✅ **Community Platform** - Social engagement features
✅ **Admin Tools** - Complete platform management
✅ **Compliance Ready** - KYC, reporting, audit trails

## 🚀 What Makes This Special

1. **Complete Ecosystem** - Not just a trading app, but a full platform
2. **Professional Grade** - Enterprise-level features and security
3. **Modern Technology** - Latest React, Node.js, and MongoDB
4. **User-Centric Design** - Intuitive interface and smooth UX
5. **Scalable Architecture** - Built to handle growth and expansion

This is a **production-ready cryptocurrency platform** that demonstrates advanced full-stack development skills, modern web technologies, and comprehensive feature implementation. It's suitable for real-world deployment with proper API keys and production configurations.

## 📞 Support & Documentation

For detailed API documentation, setup guides, and troubleshooting, refer to the technical documentation or contact the development team.

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cryptosden
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - MongoDB connection string
   - JWT secret key
   - OAuth credentials (optional)

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend client (port 3000).

## 📁 Project Structure

```
cryptosden/
├── server/                     # Backend application
│   ├── models/                # Database schemas
│   │   ├── User.js           # Enhanced user model with roles, 2FA, KYC
│   │   ├── Wallet.js         # Cryptocurrency wallet management
│   │   ├── Transaction.js    # Transaction processing and history
│   │   ├── Order.js          # Trading order management
│   │   ├── Portfolio.js      # Portfolio tracking and analytics
│   │   ├── Post.js           # Community forum posts
│   │   └── Poll.js           # Community polls and voting
│   ├── routes/               # API endpoints
│   │   ├── auth.js           # Authentication, 2FA, KYC, OAuth
│   │   ├── wallet.js         # Wallet operations and management
│   │   ├── trading.js        # Order placement and execution
│   │   ├── portfolio.js      # Portfolio analytics and tracking
│   │   ├── community.js      # Forum posts and polls
│   │   ├── admin.js          # Admin dashboard and management
│   │   ├── crypto.js         # Market data and price feeds
│   │   └── chat.js           # AI chatbot integration
│   ├── middleware/           # Security and authentication
│   │   └── auth.js           # RBAC, 2FA, verification middleware
│   ├── services/             # Business logic
│   │   ├── twoFactorAuth.js  # 2FA implementation
│   │   ├── walletService.js  # Wallet operations
│   │   ├── tradingService.js # Order execution engine
│   │   └── cryptoUpdater.js  # Real-time price updates
│   └── config/
│       └── passport.js       # OAuth configuration
├── client/                   # Frontend application
│   ├── src/
│   │   ├── pages/           # Main application pages
│   │   │   ├── Dashboard.js # Market overview and statistics
│   │   │   ├── Trading.js   # Professional trading interface
│   │   │   ├── Portfolio.js # Portfolio analytics and tracking
│   │   │   ├── Community.js # Forum posts and polls
│   │   │   ├── Profile.js   # User profile and settings
│   │   │   ├── Login.js     # Authentication with 2FA
│   │   │   ├── Register.js  # Registration with role selection
│   │   │   └── AdminDashboard.js # Admin control panel
│   │   ├── components/      # Reusable UI components
│   │   │   ├── TwoFactorAuth.js    # 2FA setup and verification
│   │   │   ├── KYCVerification.js  # KYC document upload
│   │   │   ├── SecuritySettings.js # Security configuration
│   │   │   ├── CryptoTable.js      # Market data display
│   │   │   └── ui/                 # Base UI components
│   │   └── contexts/        # React context providers
│   │       ├── AuthContext.js      # Authentication state
│   │       └── CryptoContext.js    # Market data state
│   └── public/              # Static assets
├── .kiro/                   # Development specifications
│   └── specs/               # Platform expansion specifications
└── package.json             # Root dependencies
```

## 🌐 API Endpoints

### Authentication & Users
- `POST /api/auth/register` - User registration with role selection
- `POST /api/auth/login` - Login with 2FA support
- `POST /api/auth/2fa/setup` - Setup two-factor authentication
- `POST /api/auth/2fa/verify` - Verify and enable 2FA
- `POST /api/auth/kyc/submit` - Submit KYC documents
- `GET /api/auth/kyc/status` - Get KYC verification status
- `POST /api/auth/upgrade-role` - Upgrade to trader role
- `GET /api/auth/me` - Get current user profile

### Wallets & Transactions
- `GET /api/wallet` - Get user wallets
- `POST /api/wallet/create` - Create new cryptocurrency wallet
- `POST /api/wallet/deposit` - Process deposit transaction
- `POST /api/wallet/withdraw` - Process withdrawal transaction
- `POST /api/wallet/transfer` - Internal wallet transfer
- `GET /api/wallet/transactions` - Get transaction history
- `GET /api/wallet/balance/:cryptocurrency` - Get wallet balance

### Trading & Portfolio
- `POST /api/trading/orders` - Place trading order (market/limit/stop-loss)
- `GET /api/trading/orders` - Get user trading orders
- `DELETE /api/trading/orders/:id` - Cancel trading order
- `GET /api/trading/orderbook/:pair` - Get order book for trading pair
- `GET /api/portfolio` - Get portfolio analytics and holdings
- `GET /api/portfolio/performance` - Get portfolio performance history
- `GET /api/portfolio/allocation` - Get portfolio asset allocation

### Community & Social
- `GET /api/community/posts` - Get forum posts with filtering
- `POST /api/community/posts` - Create new forum post
- `POST /api/community/posts/:id/vote` - Vote on forum post
- `POST /api/community/posts/:id/replies` - Add reply to post
- `GET /api/community/polls` - Get community polls
- `POST /api/community/polls` - Create new poll
- `POST /api/community/polls/:id/vote` - Vote on poll
- `GET /api/community/stats` - Get community statistics
- `GET /api/community/categories` - Get discussion categories

### Admin & Management
- `GET /api/admin/dashboard` - Admin dashboard overview
- `GET /api/admin/users` - User management with pagination
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/suspend` - Suspend/unsuspend user
- `POST /api/admin/kyc/review/:id` - Review KYC documents
- `GET /api/admin/transactions` - Transaction monitoring
- `PUT /api/admin/transactions/:id/flag` - Flag suspicious transaction
- `GET /api/admin/reports/user-activity` - Generate user activity report
- `GET /api/admin/reports/transactions` - Generate transaction report

### Market Data
- `GET /api/crypto/top` - Get top cryptocurrencies with Trust Score & EVI
- `GET /api/crypto/:id` - Get specific cryptocurrency data
- `POST /api/chat/message` - Send message to AI chatbot

## Key Features Explained

### Trust Score Algorithm
The proprietary Trust Score evaluates cryptocurrencies based on:
- Market capitalization
- Trading volume
- Price volatility
- Historical performance
- Market age and stability

### Emotional Volatility Index (EVI)
EVI measures market sentiment by analyzing:
- Price volatility patterns
- Volume-to-market-cap ratios
- Community engagement metrics
- Social sentiment indicators

### Real-time Updates
- WebSocket connections for live price updates
- Automatic data refresh every 60 seconds (1 minute)
- Real-time chat functionality
- Live market statistics

## Development

### Available Scripts
- `npm run dev` - Start development servers
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run build` - Build for production

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Secure OAuth integration

## Future Enhancements
- Advanced AI analytics
- Portfolio tracking
- Price alerts and notifications
- Social trading features
- Mobile application
- Advanced charting tools

## License
This project is licensed under the MIT License.

## Support
For support and questions, please contact the development team or create an issue in the repository.