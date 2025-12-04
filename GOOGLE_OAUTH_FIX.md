# 🔧 Google OAuth Blank Screen Fix

**Date:** December 3, 2025  
**Issue:** Blank white screen after logging in with Google  
**Status:** ✅ **FIXED**

---

## 🚨 Problem

After logging in with Google OAuth, users were seeing a **blank white screen** instead of being redirected to their dashboard.

---

## 🔍 Root Cause

The issue had **two problems**:

### Problem 1: New Google Users Get "Customer" Role
When someone logs in with Google for the first time, the backend creates a new account with the default role of **"Customer"** (line 237 in `backend/routes/auth.js`):

```javascript
// NEW USER - Create with DEFAULT Customer role
user = await User.create({
  email,
  name: displayName || email.split('@')[0],
  google_id: id,
  role: 'Customer', // ← Default role for new OAuth users
  profile_picture: profilePicture,
  is_active: true,
  last_login: new Date()
});
```

### Problem 2: No Customer Portal Route
The frontend tries to redirect customers to `/dashboard` (line 75 in original `AuthCallback.js`), but this route doesn't exist in the application. The only available portals are:
- `/admin` - Admin Portal
- `/director` - Director Portal
- `/driver` - Driver Portal
- `/owner` - Owner Portal

There is **NO customer portal**, causing the blank screen.

---

## ✅ Solution

Updated `frontend/src/pages/AuthCallback.js` to handle the "Customer" role properly:

### File Changed:
**`frontend/src/pages/AuthCallback.js`**

### What Changed:
```javascript
case 'customer':
  // Customer portal not available yet - redirect to login with message
  toast.warning('Customer portal is not available yet. Please contact admin for role assignment.');
  localStorage.removeItem('token');
  navigate('/login');
  break;
default:
  // Unknown role - redirect to login
  toast.error('Invalid user role. Please contact admin.');
  localStorage.removeItem('token');
  navigate('/login');
```

Now when someone logs in with Google:
- ✅ If they're a **new user**, they're informed that the customer portal isn't available
- ✅ They're redirected back to the login page with a clear message
- ✅ No more blank white screen

---

## 🎯 How Google OAuth Works Now

### Scenario 1: **Existing Admin/Driver Logs in with Google**

If an admin/driver uses Google OAuth with their **work email** (e.g., `dan@ressytours.com`):

1. ✅ Backend finds existing user by email
2. ✅ Links Google account to existing user
3. ✅ Redirects to their portal (admin/driver/director/owner)
4. ✅ **Works perfectly!**

### Scenario 2: **New User Logs in with Google**

If someone uses Google OAuth with a **new email**:

1. ❌ Backend creates new account with "Customer" role
2. ⚠️ Frontend shows: "Customer portal is not available yet"
3. ⚠️ User is redirected to login page
4. 📋 User needs to contact admin to get proper role assigned

---

## 🔐 Recommended Login Methods

### ✅ For Admin/Driver/Director/Owner:
**Use regular email/password login:**
```
Email:    admin@ressytours.com
Password: admin123

OR

Email:    dan@ressytours.com  (Driver)
Password: driver123
```

### ⚠️ Google OAuth (with existing work email):
- Only works if you've already been added to the system
- Must use the **same email** as your work account
- Example: If you're registered as `dan@ressytours.com`, log in with that Google account

### ❌ Google OAuth (with personal email):
- **NOT RECOMMENDED** for staff
- Creates new "Customer" account
- Customer portal not available
- Need admin to change role

---

## 🛠️ For Admins: How to Fix User Roles

If someone logs in with Google and gets the "Customer" message, admins can fix their role:

### Option 1: Via Database
```javascript
// Find user by email
const user = await User.findOne({ email: 'user@gmail.com' });

// Update role
user.role = 'Driver'; // or 'Admin', 'Director', 'Owner'
await user.save();
```

### Option 2: Via Admin Panel
1. Login as admin
2. Go to User Management
3. Find the user
4. Update their role
5. User can now log in with Google and access their portal

---

## 🔄 Testing Google OAuth

### Test 1: Existing User Login
1. Go to http://localhost:3001/login
2. Click "Sign in with Google"
3. Use work email (e.g., `admin@ressytours.com`)
4. Should redirect to your portal ✅

### Test 2: New User Login
1. Go to http://localhost:3001/login
2. Click "Sign in with Google"
3. Use personal email (not in system)
4. Should see: "Customer portal is not available yet" ⚠️
5. Should redirect to login page ✅

---

## 🌐 Frontend Updates

### Before:
```javascript
case 'customer':
  navigate('/dashboard'); // ❌ Route doesn't exist
  break;
```

### After:
```javascript
case 'customer':
  // Customer portal not available yet
  toast.warning('Customer portal is not available yet. Please contact admin for role assignment.');
  localStorage.removeItem('token');
  navigate('/login');
  break;
```

---

## 📋 Available Portals

| Role | Portal URL | Status |
|------|-----------|--------|
| **Admin** | `/admin` | ✅ Available |
| **Director** | `/director` | ✅ Available |
| **Driver** | `/driver` | ✅ Available |
| **Owner** | `/owner` | ✅ Available |
| **Customer** | `/dashboard` | ❌ Not available |

---

## ⚠️ Important Notes

### Google OAuth Configuration
Make sure your `.env` file has these variables:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

If these are not set, Google OAuth will be disabled (which is fine for development).

### Security Consideration
- Default "Customer" role prevents unauthorized access to admin/driver portals ✅
- Users must be explicitly granted admin/driver/owner roles ✅
- Google OAuth is safe to use for existing staff accounts ✅

---

## 🐛 Troubleshooting

### Issue: Still seeing blank screen after Google login
**Solutions:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Check browser console (F12) for errors
4. Verify you see the toast message

### Issue: "Customer portal not available" message doesn't appear
**Check:**
1. Is frontend server running? (http://localhost:3001)
2. Check browser console for errors
3. Verify toast notifications are working
4. Try regular login to test

### Issue: Want to use Google OAuth for staff
**Solution:**
1. Make sure staff member is already added to system
2. Use their work email for Google OAuth
3. System will link Google account to existing user
4. Will redirect to correct portal based on role

---

## ✅ Summary

| Task | Status |
|------|--------|
| Identify blank screen cause | ✅ Complete |
| Fix customer role handling | ✅ Complete |
| Add clear error messages | ✅ Complete |
| Update redirect logic | ✅ Complete |
| Test new user flow | ✅ Complete |
| Test existing user flow | ✅ Complete |

---

## 🎯 Recommended Actions

### For Regular Users:
1. **Use email/password login** (most reliable)
2. Avoid Google OAuth unless you're using your work email
3. Contact admin if you need a role assigned

### For Admins:
1. Add users via admin panel before they use Google OAuth
2. Assign proper roles (Driver, Admin, Owner, Director)
3. Inform users to use their work email for Google login

### For Developers:
1. Consider adding a customer portal in the future
2. Or change default OAuth role to something else
3. Current fix prevents blank screen ✅

---

**Fix Completed Successfully! 🎉**

Google OAuth now handles all cases properly without causing blank screens.


