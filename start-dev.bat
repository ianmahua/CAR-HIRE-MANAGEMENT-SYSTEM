@echo off
echo Starting THE RESSEY TOURS CRMS Development Servers...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ✅ Development servers starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul

