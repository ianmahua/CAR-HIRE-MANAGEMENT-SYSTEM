# THE RESSEY TOURS CRMS - API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login and get JWT token.

**Request:**
```json
{
  "email": "admin@ressytours.com",
  "password_hash": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user_id": "USR123",
    "name": "Admin User",
    "email": "admin@ressytours.com",
    "role": "Admin"
  }
}
```

#### GET /auth/me
Get current user information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "USR123",
    "name": "Admin User",
    "email": "admin@ressytours.com",
    "role": "Admin"
  }
}
```

### Vehicles

#### GET /vehicles
Get all vehicles (with optional filters).

**Query Parameters:**
- `status`: Filter by availability status
- `category`: Filter by category (Economy/Executive)
- `owner_type`: Filter by owner type
- `search`: Search by license plate, make, or model

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "vehicle_id": "VEH123",
      "make": "Toyota",
      "model": "Corolla",
      "license_plate": "KCA 123A",
      "category": "Economy",
      "daily_rate": 5000,
      "availability_status": "In-Fleet"
    }
  ]
}
```

#### POST /vehicles
Create a new vehicle (Admin only).

**Request:**
```json
{
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "category": "Economy",
  "license_plate": "KCA 123A",
  "owner_type": "Company Owned",
  "daily_rate": 5000
}
```

### Rentals

#### GET /rentals
Get all rentals.

**Query Parameters:**
- `status`: Filter by rental status
- `payment_status`: Filter by payment status
- `hire_type`: Filter by hire type
- `start_date`: Filter by start date
- `end_date`: Filter by end date

#### POST /rentals
Create a new rental (Admin only).

**Request:**
```json
{
  "vehicle_ref": "vehicle_id",
  "customer_ref": "customer_id",
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "destination": "Nairobi",
  "hire_type": "Direct Client",
  "driver_assigned": "driver_user_id"
}
```

#### POST /rentals/:id/handover
Record vehicle handover (delivery or pickup).

**Request:**
```json
{
  "type": "delivery",
  "odometer_reading": 50000,
  "fuel_level": "Full",
  "condition_notes": "Vehicle in good condition",
  "photos": ["url1", "url2"],
  "customer_signature": "base64_signature",
  "gps_coordinates": {
    "lat": -1.2921,
    "lng": 36.8219
  }
}
```

### M-Pesa Integration

#### POST /mpesa/stk-push
Initiate STK Push payment (Admin only).

**Request:**
```json
{
  "phone_number": "254712345678",
  "amount": 5000,
  "rental_id": "rental_id",
  "description": "Payment for rental"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutRequestID": "ws_CO_123456",
    "customerMessage": "Success. Request accepted for processing"
  }
}
```

#### POST /mpesa/b2c
Send B2C payment (Admin only).

**Request:**
```json
{
  "phone_number": "254712345678",
  "amount": 10000,
  "remarks": "Owner payout",
  "occasion": "Monthly payout",
  "owner_id": "owner_id"
}
```

### Contracts

#### POST /contracts/generate-rental
Generate rental agreement PDF (Admin only).

**Request:**
```json
{
  "rental_id": "rental_id"
}
```

#### POST /contracts/send-for-signature
Send contract for e-signature (Admin only).

**Request:**
```json
{
  "contract_id": "contract_id",
  "recipient_email": "customer@email.com",
  "recipient_phone": "254712345678"
}
```

### Director Dashboard

#### GET /director/dashboard
Get director dashboard with KPIs.

**Query Parameters:**
- `month`: Month for data (YYYY-MM format)

**Response:**
```json
{
  "success": true,
  "data": {
    "financial_health": {
      "net_income": {
        "net_income": 500000,
        "gross_profit_margin": "65.5",
        "net_profit_margin": "45.2"
      },
      "racd": 1500.50
    },
    "fleet_efficiency": {
      "utilization_rate": 75.5,
      "total_fleet": 20,
      "rented_vehicles": 15
    },
    "operational_insights": {
      "driver_performance": [...],
      "on_time_return_rate": 85.5
    }
  }
}
```

### Admin Dashboard

#### GET /admin/dashboard
Get admin dashboard overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_vehicles": 20,
    "available_vehicles": 5,
    "rented_vehicles": 15,
    "active_rentals": 15,
    "pending_payments": 3,
    "utilization_rate": 75.5
  }
}
```

#### GET /admin/payout-queue
Get pending payout queue for approval.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "owner_id": "OWN123",
      "owner_name": "John Doe",
      "total_monthly_revenue": 100000,
      "calculated_payout": 30000,
      "payout_due_day": 25
    }
  ]
}
```

### Driver Portal

#### GET /driver/assignments
Get driver's assigned rentals.

**Query Parameters:**
- `status`: Filter by rental status

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "rental_id": "RENT123",
      "vehicle_ref": {
        "make": "Toyota",
        "model": "Corolla",
        "license_plate": "KCA 123A"
      },
      "customer_ref": {
        "name": "Jane Doe",
        "phone": "254712345678"
      },
      "rental_status": "Active"
    }
  ]
}
```

### Owner Portal

#### GET /owner/vehicles
Get owner's vehicles and performance.

**Response:**
```json
{
  "success": true,
  "data": {
    "owner": {
      "owner_id": "OWN123",
      "name": "John Doe"
    },
    "vehicles": [
      {
        "vehicle": {
          "make": "Toyota",
          "model": "Corolla"
        },
        "performance": {
          "revenue": 50000,
          "hired_days": 15,
          "gccm": 45000
        }
      }
    ]
  }
}
```

#### GET /owner/payouts
Get owner payout history.

**Response:**
```json
{
  "success": true,
  "data": {
    "payout_history": [
      {
        "transaction_id": "TXN123",
        "amount": 30000,
        "date": "2024-01-25",
        "status": "Confirmed"
      }
    ],
    "next_payout": {
      "calculated_payout": 35000,
      "payout_due_day": 25
    },
    "total_earnings": 150000
  }
}
```

### Reports

#### POST /reports/weekly
Generate and send weekly report (Director/Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Weekly report generated and sent successfully"
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API rate limiting may be applied to prevent abuse. Check response headers for rate limit information.

## Webhooks

### M-Pesa Callback

**Endpoint:** `POST /api/mpesa/callback`

M-Pesa will send payment confirmation data to this endpoint.

### E-Signature Webhook

**Endpoint:** `POST /api/contracts/webhook`

E-signature provider will send signature completion data to this endpoint.

