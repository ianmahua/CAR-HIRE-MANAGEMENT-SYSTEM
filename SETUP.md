# THE RESSEY TOURS CRMS - Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation Steps

### 1. Install Backend Dependencies

```bash
npm install
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Update the following required variables:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT token signing
- `MPESA_CONSUMER_KEY`: Your M-Pesa Daraja API consumer key
- `MPESA_CONSUMER_SECRET`: Your M-Pesa Daraja API consumer secret
- `MPESA_SHORTCODE`: Your M-Pesa Paybill shortcode
- `MPESA_PASSKEY`: Your M-Pesa API passkey
- `EMAIL_USER`: Email for sending reports
- `EMAIL_PASS`: Email app password
- `DIRECTOR_EMAIL`: Director's email for weekly reports

### 4. Frontend Environment

Create `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:5503
```

### 5. Database Setup

Ensure MongoDB is running:

```bash
# Start MongoDB (varies by OS)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

The application will automatically create the database and collections on first run.

### 6. Create Initial Admin User

You can create an admin user via the API or directly in MongoDB:

```javascript
// Using MongoDB shell or Compass
use ressey-tours-crms
db.users.insertOne({
  user_id: "USR" + Date.now(),
  name: "Admin User",
  role: "Admin",
  email: "admin@ressytours.com",
  phone_msisdn: "254712345678",
  password_hash: "$2a$10$...", // Use bcrypt to hash password
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
})
```

Or use the registration endpoint after setting up an initial admin:

```bash
POST /api/auth/register
{
  "name": "Admin User",
  "email": "admin@ressytours.com",
  "phone_msisdn": "254712345678",
  "role": "Admin",
  "password_hash": "your-password"
}
```

## Running the Application

### Development Mode

1. Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

2. Start the frontend (in a new terminal):

```bash
npm run client
```

The frontend will run on `http://localhost:3000`

### Production Mode

1. Build the frontend:

```bash
npm run build
```

2. Start the backend:

```bash
npm start
```

## M-Pesa Daraja API Setup

1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an app and get your Consumer Key and Secret
3. Configure your Paybill or BuyGoods shortcode
4. Set up webhook URLs for callbacks:
   - Confirmation URL: `https://your-domain.com/api/mpesa/callback`
   - Validation URL: `https://your-domain.com/api/mpesa/validation`

## E-Signature API Setup

1. Choose an e-signature provider (Adobe Sign, DocuSign, etc.)
2. Register and get your API key
3. Configure webhook URL for signature completion:
   - Webhook URL: `https://your-domain.com/api/contracts/webhook`

## WhatsApp Business API Setup

1. Register for WhatsApp Business API
2. Get your API key and phone number ID
3. Configure webhook for message status updates

## Telematics/GPS Integration

1. Choose a telematics provider
2. Register and get your API key
3. Configure GPS device IDs in vehicle records

## Key Features

### Role-Based Access

- **Director**: Financial oversight, KPI dashboard, weekly reports
- **Admin**: Full system access, fleet management, bookings, financials
- **Driver**: Mobile portal for assignments, handovers, signatures
- **Owner**: Read-only access to vehicle performance and payouts

### Core Workflows

1. **Rental Booking**: Admin creates booking → Contract generated → Sent for e-signature → Payment via M-Pesa → Driver assigned → Handover
2. **Owner Payouts**: Automated calculation on due date → Admin approval → B2C disbursement
3. **Weekly Reports**: Automated generation every Monday → Email to Director

## API Documentation

### Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Key Endpoints

- `POST /api/auth/login` - User login
- `GET /api/vehicles` - List all vehicles
- `POST /api/rentals` - Create new rental
- `POST /api/mpesa/stk-push` - Initiate M-Pesa payment
- `GET /api/director/dashboard` - Director dashboard data
- `POST /api/reports/weekly` - Generate weekly report

## Troubleshooting

### MongoDB Connection Issues

- Verify MongoDB is running
- Check connection string in `.env`
- Ensure network access if using remote MongoDB

### M-Pesa Integration Issues

- Verify credentials in `.env`
- Check webhook URLs are accessible
- Ensure you're using the correct environment (sandbox/production)

### Frontend Not Connecting

- Verify `REACT_APP_API_URL` in `frontend/.env`
- Check CORS settings in backend
- Ensure backend is running

## Support

For issues or questions, refer to the main README.md or contact the development team.

