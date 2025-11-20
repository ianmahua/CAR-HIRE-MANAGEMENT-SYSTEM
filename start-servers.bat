@echo off
echo ========================================
echo THE RESSEY TOURS CRMS - Starting Servers
echo ========================================
echo.

echo [1/2] Starting Backend Server on port 5000...
start "Backend Server - Port 5000" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend Server on port 3000...
cd frontend
start "Frontend Server - Port 3000" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo Servers are starting...
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Please wait 30-60 seconds for servers to fully start
echo Then open: http://localhost:3000
echo.
echo Login Credentials:
echo   Email: admin@ressytours.com
echo   Password: admin123
echo.
echo Press any key to close this window...
echo (Servers will continue running in separate windows)
pause >nul

