# 🔐 Login Credentials - RESSEY TOURS CRMS

## 🌐 Login URL
```
http://localhost:3001/login
```

---

## 👤 ADMIN ACCOUNTS

### Main Admin (Recommended)
```
Email:    admin@ressytours.com
Password: admin123
Role:     Admin
```
**Use this for full administrative access!**

---

### Additional Admin Accounts

**Sarah Wanjiku**
```
Email:    sarah.admin@ressytours.com
Password: password123
Role:     Admin
```

**David Kariuki**
```
Email:    david.admin@ressytours.com
Password: password123
Role:     Admin
```

---

## 🎭 DIRECTOR ACCOUNT

**Robert Mwangi**
```
Email:    robert.director@ressytours.com
Password: password123
Role:     Director
```

---

## 🚗 DRIVER ACCOUNTS

### Driver 1 (Recommended for Testing)
**Dan Wesa**
```
Email:    dan@ressytours.com
Password: driver123
Role:     Driver
```
**This driver has test notifications set up!**

---

### Other Driver Accounts

**James Ochieng**
```
Email:    james@ressytours.com
Password: password123
Role:     Driver
```

**Peter Kipchoge**
```
Email:    peter@ressytours.com
Password: password123
Role:     Driver
```

**Mary Njeri**
```
Email:    mary@ressytours.com
Password: password123
Role:     Driver
```

**Grace Akinyi**
```
Email:    grace@ressytours.com
Password: password123
Role:     Driver
```

---

## 📝 Quick Reference Table

| Name | Email | Password | Role |
|------|-------|----------|------|
| **Main Admin** | admin@ressytours.com | admin123 | Admin |
| Sarah Wanjiku | sarah.admin@ressytours.com | password123 | Admin |
| David Kariuki | david.admin@ressytours.com | password123 | Admin |
| Robert Mwangi | robert.director@ressytours.com | password123 | Director |
| **Dan Wesa** | dan@ressytours.com | driver123 | Driver |
| James Ochieng | james@ressytours.com | password123 | Driver |
| Peter Kipchoge | peter@ressytours.com | password123 | Driver |
| Mary Njeri | mary@ressytours.com | password123 | Driver |
| Grace Akinyi | grace@ressytours.com | password123 | Driver |

---

## 🎯 Recommended Accounts for Testing

### For Admin Features:
```
Email:    admin@ressytours.com
Password: admin123
```
- Full access to all features
- Can manage users, vehicles, bookings
- Can view financial reports
- Can configure system settings

### For Driver Features:
```
Email:    dan@ressytours.com
Password: driver123
```
- Has test notifications set up
- Can hire out vehicles
- Can process returns
- Can manage bookings
- Can update vehicle mileage

---

## 🔄 How to Reset All Passwords

If you need to reset or reseed the database with fresh data:

```powershell
cd backend
node seeds/reseedDatabase.js
```

This will:
- Clear all data (except main admin)
- Recreate all user accounts
- Generate fresh test data
- Maintain the same passwords

---

## ⚠️ Security Note

**These are development/testing credentials only!**

For production deployment:
- Change all default passwords
- Use strong, unique passwords
- Enable 2-factor authentication
- Implement password complexity requirements
- Add account lockout after failed attempts

---

## 🆘 Forgot Password?

Currently, the system doesn't have a "forgot password" feature.

**To reset a user's password manually:**

1. Connect to MongoDB
2. Update the user's password_hash
3. Or re-run the seed script to reset all accounts

---

## 📞 Support

If you encounter login issues:
1. Check if servers are running (ports 5000 and 3001)
2. Clear browser cache and cookies
3. Check browser console for errors
4. Verify MongoDB connection
5. Re-run seed script if needed

---

**Last Updated:** December 3, 2025


