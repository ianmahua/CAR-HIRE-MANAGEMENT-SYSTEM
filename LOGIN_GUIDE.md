# 🔐 LOGIN GUIDE - THE RESSEY TOURS CRMS

## How to Login

### Option 1: Email/Password Login

1. **Go to the Login Page**
   - Open your browser and navigate to: `http://localhost:3001/login`

2. **Enter Your Credentials**
   - **Email**: Your registered email address
   - **Password**: Your password
   - **Role**: Select your role from the dropdown:
     - Admin
     - Director
     - Driver
     - Owner

3. **Click "Sign In"**
   - You will be redirected to your dashboard based on your role

### Option 2: Google OAuth Login

1. **Click "Continue with Google"**
   - This will redirect you to Google's sign-in page

2. **Sign in with Google**
   - Use your Google account credentials

3. **Select Your Role**
   - After Google authentication, select your role from the dropdown

4. **Click "Continue"**
   - You will be redirected to your dashboard

---

## 🚀 First Time Setup - Creating an Admin User

If you don't have a user account yet, you need to create one. Here are your options:

### Method 1: Using Google OAuth (Easiest)

1. **Make sure your email is in the role mapping**
   - Your email `iannjosh123@gmail.com` is already configured as Admin in `backend/config/roleMapping.js`

2. **Click "Continue with Google" on the login page**
   - Sign in with `iannjosh123@gmail.com`
   - Select "Admin" as your role
   - The system will automatically create your account

### Method 2: Create Admin via Script

Run this command in your terminal:

```bash
node create-admin.js
```

Or manually create via MongoDB:

```javascript
// Connect to MongoDB and run:
use ressey-tours-crms
db.users.insertOne({
  user_id: "USR" + Date.now(),
  name: "Admin User",
  role: "Admin",
  email: "your-email@example.com",
  password_hash: "$2a$10$YourHashedPassword", // Use bcrypt to hash
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
})
```

### Method 3: Use "Forgot Password" (If user exists but no password)

1. Click "Forgot Password?" on the login page
2. Enter your email
3. Check your email for the reset link
4. Set your password
5. Return to login page and sign in

---

## 📋 Login Requirements

To successfully login, you need:

✅ **Valid Email** - Must be registered in the system  
✅ **Password** - Must be set (or use Google OAuth)  
✅ **Correct Role** - Must match your account's role in the database  
✅ **Active Account** - Account must be active (is_active: true)

---

## 🔧 Troubleshooting

### "Invalid credentials"
- Check that your email exists in the database
- Verify your password is correct
- Make sure you selected the correct role

### "Invalid role. Your account is registered as [Role]"
- You selected the wrong role
- Select the role that matches your account (shown in the error message)

### "No password set"
- Use "Forgot Password" to set your password
- Or use Google OAuth to login

### "Account is inactive"
- Contact an administrator to activate your account

### Can't login at all?
1. Check that both servers are running:
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:3001`
2. Check browser console (F12) for errors
3. Verify MongoDB is running and connected
4. Check that `.env` file has correct configuration

---

## 🎯 Quick Start for Admin (iannjosh123@gmail.com)

Since your email is already configured as Admin:

1. **Go to login page**: `http://localhost:3001/login`
2. **Click "Continue with Google"**
3. **Sign in with**: `iannjosh123@gmail.com`
4. **Select Role**: Admin
5. **You're in!** 🎉

---

## 📞 Need Help?

If you're still having issues:
1. Check the browser console (F12) for error messages
2. Check the backend server logs
3. Verify your user exists in MongoDB
4. Make sure your role matches your account








