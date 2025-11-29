@echo off
echo ========================================
echo Upload RESSEY SYSTEM to GitHub
echo ========================================
echo.

echo Please provide your GitHub repository URL:
echo Example: https://github.com/yourusername/ressey-tours-crms.git
echo.
set /p REPO_URL="Enter GitHub repository URL: "

if "%REPO_URL%"=="" (
    echo Error: Repository URL is required!
    pause
    exit /b 1
)

echo.
echo Adding remote repository...
git remote add origin %REPO_URL% 2>nul
if errorlevel 1 (
    echo Remote already exists, updating...
    git remote set-url origin %REPO_URL%
)

echo.
echo Setting branch to main...
git branch -M main

echo.
echo Pushing to GitHub...
echo (You may be prompted for GitHub credentials)
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo Error pushing to GitHub!
    echo.
    echo If authentication failed:
    echo 1. Use Personal Access Token instead of password
    echo 2. Go to: GitHub Settings ^> Developer settings ^> Personal access tokens
    echo 3. Generate token with 'repo' permissions
    echo.
) else (
    echo.
    echo ========================================
    echo SUCCESS! Code uploaded to GitHub!
    echo ========================================
    echo.
)

pause




