# Testing Guide: Automated Contract System

This guide will help you set up and test the automated contract generation and email delivery system.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Gmail App Password](#getting-gmail-app-password)
3. [Configuring Environment Variables](#configuring-environment-variables)
4. [Running the Test](#running-the-test)
5. [Troubleshooting](#troubleshooting)
6. [Integration Guide](#integration-guide)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js installed (v14 or higher)
- ✅ npm installed
- ✅ A Gmail account
- ✅ MongoDB running (for full system testing)
- ✅ All dependencies installed (`npm install`)

---

## Getting Gmail App Password

### Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", find **2-Step Verification**
4. Click on it and follow the prompts to enable 2-Step Verification
   - You'll need to verify your phone number
   - Google will send you a verification code

### Step 2: Generate App Password

1. Once 2-Step Verification is enabled, go back to **Security**
2. Under "Signing in to Google", you'll now see **App passwords**
3. Click on **App passwords**
4. You may be asked to sign in again
5. Select **Mail** as the app
6. Select **Other (Custom name)** as the device
7. Type: "RESSEY TOURS CRMS" (or any name you prefer)
8. Click **Generate**
9. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
   - ⚠️ **Important**: You can only see this password once! Copy it immediately.
   - Remove spaces when using it (e.g., `abcdefghijklmnop`)

### Step 3: Save Your App Password

- Save the password in a secure location
- You'll need it for the `.env` file configuration

**Direct Link to App Passwords:** https://myaccount.google.com/apppasswords

---

## Configuring Environment Variables

### Step 1: Locate Your .env File

The `.env` file should be located at: `backend/.env`

If it doesn't exist, create it:

```bash
cd backend
touch .env
```

### Step 2: Add Required Variables

Open `backend/.env` and add/verify these variables:

```env
# Email Configuration (Gmail + Nodemailer)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM_NAME=The Ressey Tours & Car Hire
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Company Details
COMPANY_NAME=The Ressey Tours & Car Hire Company
COMPANY_ADDRESS=Nairobi-Muthaiga Square Block B
COMPANY_EMAIL=ressytourscarhire@gmail.com
COMPANY_PHONE_1=0727347926
COMPANY_PHONE_2=0725997121
DIRECTOR_NAME=Rebecca Wanja Kamau
DIRECTOR_POSITION=Director Ressey Tours
DIRECTOR_EMAIL=ressytourscarhire@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ressey-tours-crms

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-session-secret-key-change-in-production
```

### Step 3: Important Notes

- **EMAIL_USER**: Your full Gmail address (e.g., `iannjosh123@gmail.com`)
- **EMAIL_PASS** or **EMAIL_PASSWORD**: The 16-character app password (no spaces)
- Make sure there are **no quotes** around the values
- Make sure there are **no spaces** before or after the `=` sign

### Step 4: Verify .env File Location

The `.env` file must be in the `backend/` directory, not the root directory.

---

## Running the Test

### Step 1: Navigate to Project Root

```bash
cd "C:\Users\USER\Desktop\RESSEY SYSTEM"
```

### Step 2: Run the Test Script

```bash
npm run test:contract
```

### Step 3: What to Expect

#### ✅ Success Output

You should see output like this:

```
═══════════════════════════════════════════════════════════════════════════════
                    🧪 CONTRACT SYSTEM TEST
═══════════════════════════════════════════════════════════════════════════════

📋 Checking Environment Variables...
✓ EMAIL_USER: your-email@gmail.com
✓ EMAIL_PASSWORD: ***abcd

🔧 Initializing ContractService...

📧 Testing Email Connection...
✓ Email connection test successful!

📝 Creating Sample Booking Data...
Sample Booking Data:
{
  "rental_id": "BKG20251201001",
  "customer_name": "Ian Njoroge",
  ...
}

═══════════════════════════════════════════════════════════════════════════════
                    🚀 GENERATING AND SENDING CONTRACT
═══════════════════════════════════════════════════════════════════════════════

[ContractService] Starting contract generation for booking: BKG20251201001
[ContractService] Step 1: Preparing contract data...
[ContractService] Step 2: Generating PDF contract...
[ContractService] ✓ PDF contract generated successfully: contract_BKG20251201001_...
[ContractService] Step 3: Preparing email data...
[ContractService] Step 4: Sending email with contract attachment...
[ContractService] ✓ Email sent successfully. Message ID: <...>

═══════════════════════════════════════════════════════════════════════════════
                    📊 TEST RESULTS
═══════════════════════════════════════════════════════════════════════════════

✅ SUCCESS! Contract generated and email sent successfully!

📄 Contract Details:
   Contract Path: C:\Users\...\backend\contracts\contract_BKG20251201001_...
   Email Message ID: <message-id>
   Customer Email: iannjosh123@gmail.com
   Booking ID: BKG20251201001
   Processing Time: 1234ms

📧 Email Information:
   ✓ Email sent to: iannjosh123@gmail.com
   ✓ Check your inbox (and spam folder) for the contract
   ✓ The PDF contract is attached to the email

📁 File Location:
   C:\Users\...\backend\contracts\contract_BKG20251201001_...
   You can also find the contract PDF in: backend/contracts/
```

### Step 4: Check Your Email

1. **Check Inbox**: Look for an email from "The Ressey Tours & Car Hire"
2. **Check Spam Folder**: Sometimes emails go to spam initially
3. **Subject Line**: "Your Car Hire Contract - Booking BKG20251201001"
4. **Attachment**: The PDF contract should be attached

### Step 5: Verify Contract PDF

1. Navigate to: `backend/contracts/`
2. You should see a file named: `contract_BKG20251201001_[timestamp].pdf`
3. Open it to verify the contract was generated correctly

---

## Troubleshooting

### Issue 1: "Invalid login" or "Authentication failed"

**Symptoms:**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solutions:**

1. **Verify App Password**:
   - Make sure you're using the App Password, not your regular Gmail password
   - Ensure there are no spaces in the password
   - Check that 2-Step Verification is enabled

2. **Check .env File**:
   - Verify `EMAIL_USER` is your full Gmail address
   - Verify `EMAIL_PASS` or `EMAIL_PASSWORD` is the 16-character app password
   - Make sure there are no quotes around values
   - Ensure no trailing spaces

3. **Regenerate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Delete the old app password
   - Generate a new one
   - Update `.env` file

### Issue 2: Email Not Received

**Symptoms:**
- Test shows success but email doesn't arrive

**Solutions:**

1. **Check Spam Folder**: Gmail may mark automated emails as spam initially
2. **Wait a Few Minutes**: Sometimes there's a delay
3. **Check Email Address**: Verify the email address in the test output
4. **Check Email Logs**: Look at the console output for the email message ID
5. **Verify Email Service**: Run the email connection test:
   ```javascript
   const EmailSender = require('./utils/emailSender');
   const sender = new EmailSender();
   sender.testConnection().then(console.log);
   ```

### Issue 3: "Cannot find module 'pdfkit'" or Missing Dependencies

**Symptoms:**
```
Error: Cannot find module 'pdfkit'
```

**Solutions:**

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Verify package.json**:
   - Check that `pdfkit` is listed in dependencies
   - Check that `nodemailer` is listed
   - Check that `dotenv` is listed

3. **Reinstall**:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Issue 4: "Contract file not found" or File Permission Issues

**Symptoms:**
```
Error: Contract file not found: ...
```

**Solutions:**

1. **Check Directory Exists**:
   ```bash
   ls backend/contracts/
   ```
   If it doesn't exist, create it:
   ```bash
   mkdir -p backend/contracts
   ```

2. **Check Permissions**:
   - Ensure the `backend/contracts/` directory is writable
   - On Windows, right-click folder → Properties → Security → Edit permissions

3. **Check Path**:
   - Verify the contract path in the error message
   - Ensure the file was actually created

### Issue 5: "Email transporter not initialized"

**Symptoms:**
```
Error: Email transporter not initialized. Check EMAIL_USER and EMAIL_PASSWORD in .env
```

**Solutions:**

1. **Check .env File Location**:
   - Must be in `backend/.env`, not root `.env`
   - Verify file exists: `ls backend/.env`

2. **Check Variable Names**:
   - Should be `EMAIL_USER` and `EMAIL_PASS` (or `EMAIL_PASSWORD`)
   - Case-sensitive!

3. **Restart Server**:
   - If you changed `.env`, restart the Node.js process

### Issue 6: PDF Generation Fails

**Symptoms:**
```
Error: Failed to generate PDF contract
```

**Solutions:**

1. **Check Required Fields**:
   - Ensure all required booking data fields are provided
   - Check console for specific missing field

2. **Check PDFKit Installation**:
   ```bash
   npm list pdfkit
   ```
   If not installed:
   ```bash
   npm install pdfkit
   ```

3. **Check Disk Space**:
   - Ensure you have enough disk space
   - Check write permissions on `backend/contracts/`

---

## Integration Guide

### Basic Integration

To integrate contract generation into your booking system, use the `ContractService`:

```javascript
const ContractService = require('./utils/contractService');

// After creating a rental/booking
const contractService = new ContractService();

const bookingData = {
  rental_id: rental.rental_id,
  customer_name: customer.name,
  customer_email: customer.email,
  customer_phone: customer.phone,
  customer_address: customer.address,
  customer_id_number: customer.ID_number,
  vehicle: {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    license_plate: vehicle.license_plate,
    color: vehicle.color,
    fuel_type: vehicle.fuel_type,
    daily_rate: vehicle.daily_rate
  },
  start_date: rental.start_date,
  end_date: rental.end_date,
  duration_days: rental.duration_days,
  destination: rental.destination,
  daily_rate: vehicle.daily_rate,
  total_fee_gross: rental.total_fee_gross,
  booking_date: rental.booking_date
};

// Generate and send contract
const result = await contractService.generateAndSendContract(bookingData);

if (result.success) {
  // Update rental with contract info
  rental.contract_url = result.contractPath;
  rental.contract_generated_at = new Date();
  rental.contract_sent_via_email = result.emailSent;
  await rental.save();
  
  console.log('Contract sent successfully!');
} else {
  console.error('Contract generation failed:', result.message);
}
```

### Using the API Endpoint

The system includes a ready-to-use API endpoint:

**POST** `/api/rentals/:id/send-contract`

**Example Request:**
```javascript
// Using fetch
const response = await fetch('http://localhost:5000/api/rentals/RENTAL_ID/send-contract', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
```

**Example Response (Success):**
```json
{
  "success": true,
  "message": "Contract generated and sent successfully",
  "data": {
    "rental_id": "RENT1234567890",
    "contract_url": "/path/to/contract.pdf",
    "contract_generated_at": "2025-12-01T10:30:00.000Z",
    "email_sent": true,
    "email_message_id": "<message-id>",
    "customer_email": "customer@example.com"
  }
}
```

### Automatic Contract Generation

Contracts are **automatically generated** when creating a new rental via:

**POST** `/api/rentals`

If the customer has an email address, the contract will be generated and sent automatically.

### Required Data Fields

When calling `generateAndSendContract()`, ensure you provide:

**Required Fields:**
- `rental_id` (String)
- `customer_name` (String)
- `customer_email` (String)

**Recommended Fields:**
- `customer_phone` (String)
- `customer_address` (String)
- `customer_id_number` (String)
- `vehicle` (Object with make, model, year, license_plate, etc.)
- `start_date` (Date)
- `end_date` (Date)
- `duration_days` (Number)
- `destination` (String)
- `daily_rate` (Number)
- `total_fee_gross` (Number)
- `booking_date` (Date)

### Error Handling

Always handle errors gracefully:

```javascript
try {
  const result = await contractService.generateAndSendContract(bookingData);
  
  if (result.success) {
    // Success - update database
    await updateRentalWithContractInfo(result);
  } else {
    // Partial success or failure
    if (result.contractGenerated) {
      // Contract was created but email failed
      console.warn('Contract generated but email failed:', result.emailError);
      // You might want to retry email sending later
    } else {
      // Complete failure
      console.error('Contract generation failed:', result.error);
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
  // Don't fail the booking creation if contract generation fails
}
```

---

## Additional Resources

### Testing Email Connection Only

To test just the email connection without generating a contract:

```javascript
const EmailSender = require('./utils/emailSender');
const sender = new EmailSender();

sender.testConnection().then(result => {
  if (result.success) {
    console.log('✓ Email connection successful!');
  } else {
    console.error('✗ Email connection failed:', result.message);
  }
});
```

### Viewing Generated Contracts

Contracts are stored in: `backend/contracts/`

They can also be accessed via URL:
```
http://localhost:5000/contracts/contract_RENTAL_ID_timestamp.pdf
```

### Logs and Debugging

The contract service provides detailed logging. Check your console for:
- `[ContractService]` - Main service logs
- Step-by-step progress indicators
- Error messages with context

---

## Support

If you encounter issues not covered in this guide:

1. Check the console output for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that MongoDB is running (if using database features)
5. Review the error messages - they often contain helpful hints

---

## Success Checklist

Before considering the system fully operational, verify:

- [ ] Gmail App Password generated and added to `.env`
- [ ] `npm run test:contract` completes successfully
- [ ] Email received in inbox (check spam if not in inbox)
- [ ] PDF contract attached to email
- [ ] Contract PDF opens and displays correctly
- [ ] Contract file exists in `backend/contracts/` directory
- [ ] API endpoint `/api/rentals/:id/send-contract` works
- [ ] Automatic contract generation works when creating rentals

---

**Last Updated:** December 2025  
**System Version:** 1.0.0

