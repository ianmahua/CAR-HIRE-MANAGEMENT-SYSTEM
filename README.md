# THE RESSEY TOURS AND CAR HIRE Management System (CRMS)

A comprehensive, paperless Car Rental Management System built with the MERN stack, featuring M-Pesa integration, digital contracts, and advanced financial tracking.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Set up environment:**
   ```bash
   node setup-env.js
   node create-admin.js
   ```

3. **Start development servers:**

   **Windows:**
   ```bash
   start-dev.bat
   ```

   **Manual (any OS):**
   ```bash
   # Terminal 1 - Backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

4. **Access the system:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Login: admin@ressytours.com / admin123

## ✨ Features

- **100% Paperless Operation**: Digital contracts with e-signature integration
- **Role-Based Access Control**: Director, Admin, Driver, and Vehicle Owner portals
- **M-Pesa Integration**: C2B payments, B2C disbursements, and Bill Manager API
- **Fleet Management**: Track company-owned and leased vehicles
- **Financial Automation**: Automated profitability calculations and reporting
- **Mobile-First Driver Portal**: PWA for field operations
- **Automated Reporting**: Weekly Director reports with KPIs
- **Telematics Integration**: GPS tracking and geo-fencing

## 📁 Project Structure

```
RESSEY SYSTEM/
├── backend/          # Node.js/Express API
├── frontend/         # React.js application
├── .env              # Environment configuration
└── Documentation/    # Setup and API docs
```

## 🎯 Key Features

### Admin Portal
- Fleet management and inventory control
- Booking and rental management
- Customer relationship management
- Financial reconciliation
- User administration

### Director Portal
- Real-time KPI dashboard
- Financial health metrics
- Fleet performance analytics
- Automated weekly reports

### Driver Portal
- Mobile-first interface
- Job assignments and dispatch
- Digital vehicle handover forms
- GPS logging and signature capture

### Owner Portal
- Vehicle performance tracking
- Revenue and payout history
- Read-only access to enrolled vehicles

## 🔧 Technology Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js, Material-UI
- **Database**: MongoDB (NoSQL)
- **APIs**: M-Pesa Daraja, E-Signature, WhatsApp Business, Telematics

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get started in minutes
- **[Setup Guide](SETUP.md)** - Detailed installation instructions
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment
- **[Project Summary](PROJECT_SUMMARY.md)** - System overview

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@ressytours.com`
- Password: `admin123`

⚠️ **Change password after first login!**

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start backend in development mode
npm run client       # Start frontend development server
npm run build        # Build frontend for production
npm start            # Start backend in production mode
npm run setup        # Set up environment and create admin
```

## 📝 Configuration

Update `.env` file with your credentials:
- M-Pesa Daraja API keys
- E-Signature API configuration
- WhatsApp Business API
- Email settings
- MongoDB connection string

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment options:
- PM2 process manager
- Docker containerization
- Cloud platforms (Heroku, Railway, Render)

## 📊 System Capabilities

- **Fleet Management**: Complete vehicle inventory tracking
- **Rental Operations**: End-to-end booking lifecycle
- **Financial Tracking**: Automated calculations and reporting
- **Contract Management**: Digital agreements with e-signatures
- **Payment Processing**: M-Pesa integration for payments
- **Reporting**: Automated weekly reports and analytics

## 🆘 Support

For issues or questions:
1. Check the documentation files
2. Review API_DOCUMENTATION.md
3. Verify environment configuration
4. Check MongoDB connection

## 📄 License

ISC

## 👥 Author

THE RESSEY TOURS AND CAR HIRE

---

**Built with ❤️ for THE RESSEY TOURS AND CAR HIRE**

Version 1.0.0
