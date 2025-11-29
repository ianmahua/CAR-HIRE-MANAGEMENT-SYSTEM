const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const session = require('express-session');
const passport = require('passport');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const vehicleRoutes = require('./routes/vehicles');
const rentalRoutes = require('./routes/rentals');
const transactionRoutes = require('./routes/transactions');
const contractRoutes = require('./routes/contracts');
const adminRoutes = require('./routes/admin');
const directorRoutes = require('./routes/director');
const driverRoutes = require('./routes/driver');
const ownerRoutes = require('./routes/owner');
const mpesaRoutes = require('./routes/mpesa');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

// Import scheduled tasks
const { generateWeeklyReport } = require('./services/reportService');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ressey-tours-crms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRMS API is running' });
});

// Scheduled task: Generate weekly report every Monday at 8:00 AM
cron.schedule('0 8 * * 1', async () => {
  console.log('Generating weekly report...');
  try {
    await generateWeeklyReport();
    console.log('Weekly report generated successfully');
  } catch (error) {
    console.error('Error generating weekly report:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

