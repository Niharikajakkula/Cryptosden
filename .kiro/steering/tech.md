# Technology Stack & Build System

## Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB (Atlas cloud or local)
- **ODM**: Mongoose 7.5.0
- **Authentication**: JWT, Passport.js (Google OAuth 2.0, Facebook)
- **Security**: bcryptjs, helmet, express-rate-limit
- **Real-time**: Socket.io 4.7.2
- **2FA**: speakeasy, qrcode
- **Email**: nodemailer 6.10.1
- **Task Scheduling**: node-cron 3.0.2
- **File Upload**: multer 1.4.5
- **HTTP Client**: axios 1.13.2
- **Session**: express-session 1.17.3
- **CORS**: cors 2.8.5

## Frontend Stack
- **Framework**: React 18.2.0
- **Routing**: React Router 6.15.0
- **Styling**: Tailwind CSS 3.3.3
- **Icons**: Lucide React 0.263.1, Heroicons 2.2.0
- **UI Components**: Headless UI 1.7.17
- **Charts**: Recharts 2.8.0
- **HTTP Client**: axios 1.5.0
- **Real-time**: Socket.io-client 4.7.2
- **Build Tool**: react-scripts 5.0.1
- **CSS Processing**: PostCSS 8.4.29, autoprefixer 10.4.15

## Development Tools
- **Dev Server**: nodemon 3.0.1
- **Concurrent Execution**: concurrently 8.2.0
- **Environment**: dotenv 16.3.1
- **Testing**: React Testing Library, Jest

## Build & Run Commands

### Installation
```bash
npm run install-all          # Install all dependencies (root + client)
npm install                  # Install root dependencies only
cd client && npm install     # Install client dependencies only
```

### Development
```bash
npm run dev                  # Start both backend and frontend concurrently
npm run server               # Start backend only (with nodemon)
npm run client               # Start frontend only
```

### Production
```bash
npm run build                # Build frontend for production
npm start                    # Start backend server (production mode)
```

### Testing
```bash
cd client && npm test        # Run frontend tests
```

## Port Configuration
- **Frontend**: http://localhost:3000 (React dev server)
- **Backend API**: http://localhost:3463 (configurable via PORT env var)
- **MongoDB**: localhost:27017 (local) or MongoDB Atlas (cloud)

## Environment Variables
Key variables in `.env`:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Backend server port (default: 3463)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` - OAuth credentials
- `SESSION_SECRET` - Express session secret
- `OPENAI_API_KEY` - Optional OpenAI integration
- `GMAIL_USER` / `GMAIL_PASSWORD` - Email service credentials

## External APIs
- **CoinGecko API** - Real-time cryptocurrency market data (free tier)
- **Google OAuth** - User authentication
- **Facebook OAuth** - User authentication
- **OpenAI API** - Optional AI chatbot enhancement

## Code Organization
- **Backend**: `/server` - Express app, models, routes, services, middleware
- **Frontend**: `/client/src` - React components, pages, contexts, styles
- **Shared**: Root `package.json` for dev dependencies and scripts

## Key Architectural Patterns
- **MVC-style**: Models (Mongoose), Routes (Express), Services (business logic)
- **Context API**: Global state management (Auth, Crypto data)
- **Protected Routes**: Role-based access control on frontend
- **Middleware**: Authentication, authorization, error handling
- **Services**: Encapsulated business logic (crypto updates, alerts, notifications)
- **Socket.io**: Real-time bidirectional communication

## Database Models
Located in `/server/models`:
- User (with 2FA, KYC, OAuth fields)
- Wallet (multi-currency support)
- Transaction (audit trail)
- Order (trading orders)
- Portfolio (analytics)
- Post (community content)
- Poll (voting)
- Alert (price alerts)
- CryptoData (market data cache)
- AdminLog (audit logging)

## API Structure
All routes prefixed with `/api`:
- `/api/auth` - Authentication and user management
- `/api/crypto` - Market data and cryptocurrency info
- `/api/wallet` - Wallet operations
- `/api/trading` - Order management
- `/api/portfolio` - Portfolio analytics
- `/api/community` - Posts and polls
- `/api/admin` - Admin operations
- `/api/alerts` - Price alerts
- `/api/notifications` - Notification management
- `/api/chat` - Chatbot
- `/api/ai` - AI insights

## Performance Considerations
- Crypto data cached and updated every 60 seconds (1 minute)
- MongoDB indexes on frequently queried fields
- Rate limiting on API endpoints
- JWT token-based stateless authentication
- Socket.io for real-time updates without polling
- Lazy loading on frontend routes
