@echo off
echo ========================================
echo Push RESSEY SYSTEM to GitHub
echo ========================================
echo.

REM Initialize git if not already done
if not exist .git (
    echo Initializing git repository...
    git init
)

REM Check if remote exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo.
    echo No remote repository configured.
    echo Please provide your GitHub repository URL:
    echo Example: https://github.com/yourusername/ressey-system.git
    echo.
    set /p REPO_URL="Enter GitHub repository URL: "
    
    if "%REPO_URL%"=="" (
        echo Error: Repository URL is required!
        pause
        exit /b 1
    )
    
    echo.
    echo Adding remote repository...
    git remote add origin %REPO_URL%
) else (
    echo Remote repository found:
    git remote get-url origin
    echo.
)

REM Stage all files
echo Staging all files...
git add -A

REM Create commit if there are changes
git diff --cached --quiet
if errorlevel 1 (
    echo Creating commit...
    git commit -m "Initial commit: RESSEY System - Paperless Car Rental Management System"
) else (
    echo No changes to commit.
)

REM Set branch to main
echo.
echo Setting branch to main...
git branch -M main 2>nul

REM Push to GitHub
echo.
echo Pushing to GitHub...
echo (You may be prompted for GitHub credentials)
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo Push failed!
    echo ========================================
    echo.
    echo Possible solutions:
    echo 1. Create the repository on GitHub first:
    echo    - Go to https://github.com/new
    echo    - Create a new repository (don't initialize with README)
    echo    - Then run this script again
    echo.
    echo 2. If authentication failed:
    echo    - Use Personal Access Token instead of password
    echo    - Go to: GitHub Settings ^> Developer settings ^> Personal access tokens
    echo    - Generate token with 'repo' permissions
    echo    - Use token as password when prompted
    echo.
) else (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
)

pause







