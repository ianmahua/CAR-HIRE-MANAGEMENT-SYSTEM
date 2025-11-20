# Quick Start Guide - THE RESSEY TOURS CRMS

## ✅ Setup Complete!

The system has been set up with:
- ✅ Dependencies installed
- ✅ Environment files created
- ✅ Development servers ready

## 🚀 Start the System

### Windows:
Double-click `start-dev.bat` or run:
```bash
start-dev.bat
```

### Manual Start:

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 🌐 Access the System

1. **Open your browser:** http://localhost:3000
2. **Login with:**
   - Email: `admin@ressytours.com`
   - Password: `admin123`

⚠️ **Important:** Change the password after first login!

## 📋 Default Admin Credentials

- **Email:** admin@ressytours.com
- **Password:** admin123
- **Role:** Admin

## 🔧 MongoDB Setup

If MongoDB is not running:

**Windows:**
```bash
net start MongoDB
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

Or use MongoDB Atlas (cloud): Update `MONGODB_URI` in `.env`

## 📝 Next Steps

1. **Update API Credentials** in `.env`:
   - M-Pesa Daraja API keys
   - E-Signature API key
   - WhatsApp Business API key
   - Email configuration

2. **Create Additional Users:**
   - Use the Admin portal to create Director, Driver, and Owner accounts

3. **Add Vehicles:**
   - Go to Admin Portal → Fleet Management
   - Add your vehicle inventory

4. **Configure M-Pesa:**
   - Register at Safaricom Developer Portal
   - Update credentials in `.env`

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5000 or 3000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify MongoDB is accessible

### Frontend Not Loading
- Check if backend is running on port 5000
- Verify `REACT_APP_API_URL` in `frontend/.env`

## 📚 Documentation

- **Setup Guide:** SETUP.md
- **API Documentation:** API_DOCUMENTATION.md
- **Deployment Guide:** DEPLOYMENT.md
- **Project Summary:** PROJECT_SUMMARY.md

## ✨ Features Available

- ✅ Fleet Management
- ✅ Rental Bookings
- ✅ Customer Management
- ✅ Financial Tracking
- ✅ Digital Contracts
- ✅ M-Pesa Integration
- ✅ Automated Reports
- ✅ Role-Based Access

---

**System is ready to use!** 🎉

