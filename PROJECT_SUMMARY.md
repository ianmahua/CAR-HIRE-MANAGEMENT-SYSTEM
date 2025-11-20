# THE RESSEY TOURS AND CAR HIRE Management System (CRMS)
## Project Summary

## Overview

This is a comprehensive, paperless Car Rental Management System built for THE RESSEY TOURS AND CAR HIRE. The system fully digitizes operations, replacing manual handwritten contracts and record-keeping with a modern, scalable web application.

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js with Material-UI
- **Database**: MongoDB (NoSQL)
- **Authentication**: JWT (JSON Web Tokens)
- **APIs Integrated**:
  - M-Pesa Daraja API (C2B, B2C, Bill Manager)
  - E-Signature API (for digital contracts)
  - WhatsApp Business API (for contract delivery)
  - Telematics/GPS API (for vehicle tracking)

## Key Features Implemented

### 1. Role-Based Access Control (RBAC)
- **Director**: Financial oversight, KPI dashboard, automated weekly reports
- **Admin**: Full system access, fleet management, bookings, financial reconciliation
- **Driver**: Mobile-first portal for assignments, vehicle handovers, digital signatures
- **Vehicle Owner**: Read-only access to vehicle performance and payout history

### 2. Core Modules

#### Fleet Management
- Vehicle inventory tracking (company-owned, leased, broker vehicles)
- Real-time availability status
- Service log tracking with cost allocation
- Monthly revenue and maintenance cost tracking per vehicle

#### Rental Management
- Complete booking lifecycle management
- Support for Direct Client, Broker Handoff, and External Brokerage rentals
- Automated contract generation
- Digital handover/pickup forms with GPS logging

#### Financial Management
- M-Pesa C2B integration for customer payments
- M-Pesa B2C integration for automated payouts
- Bill Manager API for invoicing and reconciliation
- Automated profitability calculations:
  - Gross Car Contribution Margin (GCCM)
  - Owner payout calculations
  - Monthly net income
  - Fleet utilization rate
  - Revenue Per Available Car-Day (RACD)

#### Contract Management
- Automated PDF contract generation
- E-signature integration with legal compliance
- WhatsApp and Email delivery
- Complete audit trail

#### Reporting
- Automated weekly reports (generated every Monday)
- Director dashboard with KPIs
- Vehicle performance metrics
- Driver performance matrix
- Financial health indicators

### 3. Database Schema

The system uses MongoDB with the following collections:

- **Users**: Authentication and role management
- **Customers**: CRM with hire history tracking
- **VehicleOwners**: Third-party owner management with payout terms
- **Vehicles**: Fleet inventory with embedded service logs
- **Rentals**: Transactional rental records
- **Transactions**: Financial ledger for all money movements
- **Contracts**: Digital contract metadata and audit trails

### 4. API Integrations

#### M-Pesa Daraja API
- **C2B (Customer-to-Business)**: STK Push for customer payments
- **B2C (Business-to-Customer)**: Automated payouts to owners and drivers
- **Bill Manager**: Automated invoicing and payment reminders

#### E-Signature API
- Contract generation and distribution
- Secure signing workflow
- Legal compliance (ESIGN Act, UETA)
- Complete audit trail

#### WhatsApp Business API
- Contract delivery (7x faster than email)
- Payment reminders
- Contract signing reminders

#### Telematics/GPS API
- Real-time vehicle location tracking
- Geo-fencing with breach alerts
- Proactive maintenance alerts
- Driver behavior monitoring

## Project Structure

```
RESSEY SYSTEM/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── middleware/      # Auth and error handling
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/       # React page components
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context (Auth)
│   │   └── utils/       # Utility functions
│   └── public/
├── package.json
├── README.md
├── SETUP.md
└── API_DOCUMENTATION.md
```

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Update MongoDB connection string
   - Add M-Pesa API credentials
   - Configure email settings
   - Add e-signature API key
   - Configure WhatsApp Business API

3. **Start Development Servers**
   ```bash
   # Backend
   npm run dev
   
   # Frontend (new terminal)
   npm run client
   ```

See `SETUP.md` for detailed instructions.

## Key Workflows

### Rental Booking Flow
1. Admin creates rental booking
2. System generates digital contract
3. Contract sent via WhatsApp and Email
4. Customer signs via e-signature platform
5. Payment initiated via M-Pesa STK Push
6. Driver assigned for vehicle delivery
7. Digital handover with GPS logging
8. Vehicle return with condition assessment

### Owner Payout Flow
1. System calculates monthly revenue per vehicle
2. Automated payout calculation on due date
3. Payout queued for Admin approval
4. Admin reviews and approves
5. B2C payment sent via M-Pesa
6. Transaction recorded in ledger

### Weekly Reporting Flow
1. Cron job triggers every Monday at 8:00 AM
2. System aggregates financial data
3. Calculates KPIs and metrics
4. Generates HTML report
5. Emails report to Director
6. Optional WhatsApp notification

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Secure API endpoints
- Audit trails for contracts
- GPS logging for handovers

## Performance Optimizations

- MongoDB indexes on frequently queried fields
- Pre-aggregated financial fields in Vehicles collection
- Compound indexes for date range queries
- Efficient lookup strategies

## Compliance & Legal

- ESIGN Act and UETA compliance for e-signatures
- Complete audit trails for all contracts
- Secure document storage
- Non-repudiable signature records

## Future Enhancements

- Loyalty program integration
- Marketing automation integration
- Advanced analytics dashboard
- Mobile app for drivers (native)
- Accounting system integration (QuickBooks, etc.)

## Support & Documentation

- **Setup Guide**: `SETUP.md`
- **API Documentation**: `API_DOCUMENTATION.md`
- **Main README**: `README.md`

## Development Status

✅ All core features implemented
✅ All portals functional
✅ API integrations complete
✅ Documentation complete

## Notes

- The system is designed for 100% paperless operation
- All financial calculations are automated
- Real-time updates for fleet status
- Mobile-first design for driver portal
- Scalable architecture for future growth

---

**Built for THE RESSEY TOURS AND CAR HIRE**
**Version 1.0.0**

