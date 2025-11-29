@echo off
echo ========================================
echo Starting RESSEY TOURS CRMS
echo Frontend on Port 3001
echo ========================================
echo.

echo [1/2] Starting Backend Server (port 5000)...
start "Backend Server" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (port 3001)...
cd frontend
start "Frontend Server - Port 3001" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo Servers are starting...
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3001
echo.
echo Please wait 30-60 seconds for compilation
echo Then open: http://localhost:3001
echo.
echo Login Credentials:
echo   Email: admin@ressytours.com
echo   Password: admin123
echo.
echo Press any key to close this window...
echo (Servers will continue running in separate windows)
pause >nul




