# YesITryMe - MLM Platform Documentation

## 1. Project Overview

**YesITryMe** is a comprehensive Multi-Level Marketing (MLM) platform with integrated social media earning features. The application enables users to earn through referrals, complete social media tasks, and manage their MLM business with advanced analytics and commission tracking.

### Core Functionality
- **User Registration & Authentication** - JWT-based auth
- **MLM System** - 120-level commission structure with automatic level progression
- **Package Management** - Regular packages (₹799) and Super Diamond packages (₹2999, ₹4999)
- **Social Media Tasks** - YouTube task completion with embedded videos and automatic claiming
- **Coin Reward System** - 1000 coin welcome bonus, 20 coin referral bonus, task-based earnings
- **Multiple Income Streams** - Active, Passive, Special Income, and Funds
- **Admin Panel** - Complete user management, payment verification, and analytics dashboard

### MLM Levels & Progression
- **Free** → **Active Member** → **Team Leader** → **Assistant Manager** → **Manager** → **Zonal Head** → **National Head Promoter**

### Income Types
- **Active Income** - Level 1 commissions from direct referrals
- **Passive Income** - Level 2-120 commissions from downline
- **Special Income** - Royalty, Rewards, Leadership Fund
- **Super Package Commissions** - Additional earnings from Super Diamond packages

## 2. Codebase Details

### Project Structure
```
YesITryMe/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   │   ├── Admin/      # Admin dashboard (20 files)
│   │   │   ├── Auth/       # Authentication (5 files)
│   │   │   ├── Pages/      # Main pages (15 files)
│   │   │   ├── User/       # User dashboard (19 files)
│   │   │   └── UI/         # Reusable components (20 files)
│   │   ├── config/         # API configuration
│   │   ├── hooks/          # Custom hooks (2 files)
│   │   ├── Router/         # Route setup
│   │   └── store/          # Zustand state management
│   └── public/             # Static assets
├── server/                 # Node.js Backend
│   ├── controllers/        # API handlers (15 files)
│   ├── models/            # Database schemas (15 files)
│   ├── routes/            # Express routes (12 files)
│   ├── services/          # Business logic (5 files)
│   ├── middleware/         # Auth & rate limiting (2 files)
│   ├── scripts/           # Database scripts (15 files)
│   └── utils/             # Utility functions (8 files)
└── README.md              # This file
```

### Key Modules
- **Authentication System** - JWT tokens, OTP verification, password reset
- **MLM Engine** - 120-level commission structure, automatic level updates
- **Payment Processing** - Package purchases, payment verification, commission distribution
- **Social Integration** - YouTube API integration for task verification
- **Notification System** - Real-time notifications
- **Admin Dashboard** - User management, analytics, payment verification

### Configuration Files
- **client/package.json** - Frontend dependencies and scripts
- **server/package.json** - Backend dependencies and scripts
- **server/.env** - Environment variables and credentials
- **server/vercel.json** - Vercel deployment configuration
- **client/tailwind.config.js** - Tailwind CSS configuration
- **client/postcss.config.js** - PostCSS configuration

## 3. Plugins & Integrations

### Frontend Dependencies
```json
{
  "react": "^19.1.0",
  "react-router-dom": "^7.6.3",
  "axios": "^1.10.0",
  "zustand": "^5.0.6",
  "lucide-react": "^0.525.0",
  "react-hot-toast": "^2.5.2",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.3.0",
  "tailwindcss": "^3.3.0",
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6"
}
```

### Backend Dependencies
```json
{
  "express": "^5.1.0",
  "mongoose": "^8.16.3",
  "bcryptjs": "^3.0.2",
  "jsonwebtoken": "^3.0.2",
  "nodemailer": "^6.9.7",
  "cloudinary": "^2.7.0",
  "express-rate-limit": "^8.0.1",
  "sharp": "^0.33.5",
  "cors": "^2.8.5",
  "dotenv": "^17.2.0"
}
```

### External Services & APIs
- **MongoDB Atlas** - Production database cluster (logged in via Google - yesitrymeofficial@gmail.com)
- **Vercel** - Frontend and backend hosting platform (logged in via Google - yesitrymeofficial@gmail.com)
- **Cloudinary** - Image storage and optimization service (logged in via Google - yesitrymeofficial@gmail.com)
- **Gmail SMTP** - Email notifications and OTP delivery (yesitrymeofficial@gmail.com)
- **YouTube Data API v3** - Social task verification and channel data (logged in via Google - yesitrymeofficial@gmail.com)
- **Google OAuth 2.0** - YouTube authentication flow (yesitrymeofficial@gmail.com)

### Configuration Details
- **CORS Origins**: localhost:3000, www.yesitryme.com, vercel.app domains
- **Rate Limiting**: API endpoints protected with express-rate-limit
- **Image Processing**: Sharp for image compression and optimization
- **Authentication**: JWT tokens with 24-hour expiration
- **Database Indexing**: Optimized queries with proper MongoDB indexes

## 4. Hosting Server Information

### Production Environment
- **GitHub Repository**: https://github.com/SwapnilSuskar/YesITryMe_Codebase (logged in via Google - yesitrymeofficial@gmail.com)
- **Frontend Hosting**: Vercel (https://i-try-me-codebase.vercel.app) - logged in via Google (yesitrymeofficial@gmail.com)
- **Backend Hosting**: Vercel (https://i-try-me-codebase-server.vercel.app) - logged in via Google (yesitrymeofficial@gmail.com)
- **Domain**: https://www.yesitryme.com
- **Database**: MongoDB Atlas (Production cluster) - logged in via Google (yesitrymeofficial@gmail.com)
- **Environment**: Production
- **Region**: Mumbai (bom1) - Vercel

### Development Environment
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Database**: MongoDB Atlas (Development cluster) - logged in via Google (yesitrymeofficial@gmail.com)
- **Environment**: Development

### Deployment Configuration
- **Platform**: Vercel
- **Build Command**: `npm run build` (frontend), `node index.js` (backend)
- **Node Version**: 18.x
- **Memory**: 4GB (--max-old-space-size=4096)
- **Auto-deployment**: Enabled from main branch

## 5. Server Credentials & Access Details

### Database Credentials
```env
# MongoDB Atlas (logged in via Google - yesitrymeofficial@gmail.com)
MONGO_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/YesITryMe?retryWrites=true&w=majority&appName=YesITryMe
```

### External Service Credentials
```env
# Email (Gmail SMTP - yesitrymeofficial@gmail.com)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Cloudinary (Image Storage - logged in via Google - yesitrymeofficial@gmail.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# YouTube API (Google OAuth - yesitrymeofficial@gmail.com)
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret

# Recharge Provider HTTP proxy (Fixie or any static IP proxy)
# Route all outbound calls to A1Topup through a proxy that exposes the
# vendor-whitelisted egress IPs. Example Fixie credentials:
RECHARGE_PROXY_URL=http://fixie:password@ventoux.usefixie.com:80
# The Fixie "tricycle" plan currently advertises 54.217.142.99 and 54.195.3.54
# as the outbound IPs; share these with the vendor for whitelisting.
```

### Admin Access
- **Admin Password**: `your-admin-password`
- **Admin Panel**: `/admin` route (protected)
- **JWT Secret**: `your-jwt-secret`

## 6. Setup Instructions

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas account
- Vercel account (for deployment)
- Git repository access

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd YesITryMe
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with credentials from section 5
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm start
   ```

4. **Database Setup**
   ```bash
   cd server
   node scripts/insertPackages.js
   node scripts/insertSuperPackages.js
   node scripts/seedAiTools.js
   ```

### Production Deployment

1. **Vercel CLI Setup**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Backend Deployment**
   ```bash
   cd server
   vercel --prod
   ```

3. **Frontend Deployment**
   ```bash
   cd client
   vercel --prod
   ```

4. **Environment Variables**
   - Set all variables from section 5 in Vercel dashboard
   - Update CORS origins for production domains
   - Configure MongoDB connection string

## 7. Other Important Notes

### Important Considerations
- **Security**: All API endpoints are rate-limited and protected with JWT authentication
- **Performance**: Database queries are optimized with proper indexing for large user bases
- **Scalability**: MLM calculations are optimized but may need further optimization for very large teams
- **Compliance**: Ensure MLM regulations compliance in target markets
- **Data Backup**: Regular MongoDB Atlas backups are essential
- **Monitoring**: Monitor API response times and error rates

### Development Guidelines
- Use TypeScript for better type safety (future enhancement)
- Follow RESTful API conventions
- Implement proper error handling and logging
- Use environment variables for all configuration
- Test all MLM calculations thoroughly before deployment
- Follow Git best practices with meaningful commit messages

### Monitoring & Maintenance
- **Database Performance**: Monitor MongoDB Atlas performance and scaling
- **API Monitoring**: Track response times and error rates
- **Commission Accuracy**: Regular verification of commission distributions
- **User Analytics**: Monitor user engagement and conversion rates
- **Security Audits**: Regular security reviews and updates