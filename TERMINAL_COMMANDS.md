# terminal Commands - Fetch Data

## Quick Commands to Test and Fetch Data

### 1. Test API Connection and Fetch Data

```bash
node test-api.js
```

This will:
- ✅ Test backend connection
- ✅ Login and get token
- ✅ Fetch current user data
- ✅ Fetch all vehicles
- ✅ Fetch all customers
- ✅ Fetch all rentals
- ✅ Fetch admin dashboard
- ✅ Fetch transactions

### 2. Fetch All Data from Database

```bash
node fetch-data.js
```

This will display:
- 📋 All users in the system
- 📋 All customers
- 📋 All vehicles
- 📋 All rentals
- 📋 Recent transactions
- 📋 Vehicle owners
- 📊 Summary statistics

### 3. Test Backend Health

```bash
curl http://localhost:5000/api/health
```

Or in PowerShell:
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/health | Select-Object -ExpandProperty Content
```

### 4. Test Login via API

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@ressytours.com\",\"password_hash\":\"admin123\"}"
```

### 5. Create Admin User

```bash
node create-admin.js
```

### 6. Check MongoDB Data Directly

If you have MongoDB shell installed:

```bash
mongo ressey-tours-crms
```

Then run:
```javascript
db.users.find().pretty()
db.customers.find().pretty()
db.vehicles.find().pretty()
db.rentals.find().pretty()
```

## 📋 Most Useful Commands

### Quick Data Overview
```bash
node fetch-data.js
```

### Test Everything
```bash
node test-api.js
```

### Check if Backend is Running
```bash
curl http://localhost:5000/api/health
```

## 🔍 Troubleshooting Commands

### Check if Ports are in Use
```bash
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```

### Check Node Processes
```bash
tasklist | findstr node
```

### Kill Node Processes
```bash
taskkill /F /IM node.exe
```

---

**Use `node fetch-data.js` to see all your data in the terminal!**




