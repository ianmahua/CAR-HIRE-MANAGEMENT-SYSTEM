# 🚀 How to Start THE RESSEY TOURS CRMS

## Current Situation

✅ **Backend is RUNNING** on http://localhost:5000
⏳ **Frontend is STARTING** on http://localhost:3000

## 📋 Step-by-Step Instructions

### Method 1: Use the Batch File (Easiest)

1. **Double-click** `start-servers.bat` in the project folder
2. **Wait 30-60 seconds** for both servers to start
3. **Open browser** to: http://localhost:3000

### Method 2: Manual Start (Two Terminals)

**Terminal 1 - Backend (Already Running):**
```bash
# This should already be running
# If not, run:
npm run dev
```

**Terminal 2 - Frontend (NEW Terminal):**
```bash
cd frontend
npm start
```

Wait for: "Compiled successfully!"
Then open: http://localhost:3000

## 🔍 Verify Servers Are Running

### Check Backend:
Open in browser: http://localhost:5000/api/health
Should show: `{"status":"OK","message":"CRMS API is running"}`

### Check Frontend:
Open in browser: http://localhost:3000
Should show: Login page

## 🔐 Login Credentials

- **Email:** admin@ressytours.com
- **Password:** admin123

## ⚠️ Important Notes

1. **Two servers must run:**
   - Backend on port 5000 ✅ (running)
   - Frontend on port 3000 ⏳ (starting)

2. **Frontend takes 30-60 seconds** to compile and start

3. **Keep both terminals open** while using the system

4. **If frontend doesn't load:**
   - Wait a bit longer (compilation takes time)
   - Check terminal for errors
   - Verify port 3000 is not blocked

## 🆘 Still Not Working?

See `FIX_FRONTEND.md` for detailed troubleshooting.

---

**The frontend server is now starting in a new window. Please wait 30-60 seconds, then try http://localhost:3000 again!**

