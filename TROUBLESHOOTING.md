# Troubleshooting Guide - THE RESSEY TOURS CRMS

## Frontend Not Loading (Port 3000)

### Solution 1: Start Frontend Manually

Open a new terminal/command prompt and run:

```bash
cd frontend
npm start
```

Wait for the message: "Compiled successfully!" then open http://localhost:3000

### Solution 2: Check if Port 3000 is Available

```bash
# Windows
netstat -ano | findstr :3000

# If port is in use, kill the process:
taskkill /PID <PID> /F
```

### Solution 3: Reinstall Frontend Dependencies

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

## Backend Not Running (Port 5000)

### Check Backend Status

```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Or in browser:
http://localhost:5000/api/health
```

### Start Backend Manually

```bash
npm run dev
```

You should see: "Server running on port 5000"

## MongoDB Connection Issues

### Check MongoDB Status

**Windows:**
```bash
net start MongoDB
```

**Or check if MongoDB service is running:**
```bash
sc query MongoDB
```

### Use MongoDB Atlas (Cloud) Instead

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ressey-tours-crms
   ```

## Common Issues

### "Cannot find module" Error

```bash
# Reinstall all dependencies
npm install
cd frontend && npm install && cd ..
```

### "Port already in use" Error

```bash
# Find process using port
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Frontend Shows "Network Error" or "Cannot connect"

1. Verify backend is running: http://localhost:5000/api/health
2. Check `frontend/.env` has: `REACT_APP_API_URL=http://localhost:5000`
3. Restart both servers

### "Module not found" in Frontend

```bash
cd frontend
rm -rf node_modules
npm install
npm start
```

### Login Not Working

1. Verify admin user exists:
   ```bash
   node create-admin.js
   ```

2. Check MongoDB connection

3. Verify JWT_SECRET in `.env`

## Quick Fix Commands

### Restart Everything

```bash
# Stop all Node processes
taskkill /F /IM node.exe

# Start fresh
npm run dev          # Terminal 1
cd frontend && npm start   # Terminal 2
```

### Complete Reset

```bash
# Remove all node_modules
rm -rf node_modules frontend/node_modules

# Reinstall
npm install
cd frontend && npm install && cd ..

# Recreate admin
node create-admin.js

# Start servers
npm run dev          # Terminal 1
cd frontend && npm start   # Terminal 2
```

## Still Having Issues?

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be v14 or higher

2. **Check npm version:**
   ```bash
   npm --version
   ```

3. **Verify files exist:**
   - `.env` file in root
   - `frontend/.env` file
   - `backend/server.js`
   - `frontend/src/App.js`

4. **Check browser console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

5. **Check terminal output:**
   - Look for error messages
   - Check if servers started successfully

## Getting Help

If issues persist:
1. Check all error messages
2. Verify MongoDB is running
3. Ensure ports 3000 and 5000 are available
4. Verify all dependencies are installed
5. Check `.env` files are configured correctly

