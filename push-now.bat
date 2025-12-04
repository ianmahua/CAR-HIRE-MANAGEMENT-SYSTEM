@echo off
echo ========================================
echo Pushing RESSEY System to GitHub
echo Repository: https://github.com/ianmahua/ressey-tours-crms.git
echo ========================================
echo.

REM Ensure we're in the right directory
cd /d "%~dp0"

REM Initialize git if needed
if not exist .git (
    echo Initializing git repository...
    git init
)

REM Stage all files
echo Staging all files...
git add -A

REM Check if there are changes to commit
git diff --cached --quiet
if errorlevel 1 (
    echo Creating commit...
    git commit -m "Update: RESSEY System - Paperless Car Rental Management System"
) else (
    echo Checking for uncommitted changes...
    git status --short
)

REM Set branch to main
git branch -M main 2>nul

REM Set remote
echo.
echo Setting remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/ianmahua/ressey-tours-crms.git

REM Show remote URL
echo Remote configured: 
git remote get-url origin

REM Push to GitHub
echo.
echo ========================================
echo Pushing to GitHub...
echo ========================================
echo.
echo You will be prompted for credentials:
echo - Username: ianmahua
echo - Password: Use a Personal Access Token (not your GitHub password)
echo.
echo If you need to create a token:
echo 1. Go to: https://github.com/settings/tokens
echo 2. Generate new token (classic)
echo 3. Select 'repo' scope
echo 4. Use the token as your password
echo.
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo View your repository at:
    echo https://github.com/ianmahua/ressey-tours-crms
    echo.
) else (
    echo.
    echo ========================================
    echo Push may have failed or requires authentication
    echo ========================================
    echo.
    echo Please check:
    echo 1. You are authenticated with GitHub
    echo 2. You have access to the repository
    echo 3. Try running: git push -u origin main
    echo.
)

pause







