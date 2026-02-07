@echo off
REM SnapLedger Quick Start Script for Windows
REM This script helps you quickly set up and run the SnapLedger application

echo.
echo ^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=
echo   SnapLedger Quick Start
echo ^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=
echo.

echo Checking prerequisites...

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)
echo [OK] Node.js found

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed
    exit /b 1
)
echo [OK] npm found

REM Check Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed
    echo Please install Docker from https://www.docker.com/get-started
    exit /b 1
)
echo [OK] Docker found

REM Check Docker Compose
where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    docker compose version >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Docker Compose is not installed
        exit /b 1
    )
)
echo [OK] Docker Compose found

echo.
echo Setting up environment...

REM Check if .env exists
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo [WARNING] Please edit .env and add your API keys:
    echo    - GOOGLE_AI_API_KEY (for Gemini AI)
    echo    - GOOGLE_APPLICATION_CREDENTIALS (for Vision API)
    echo    - JWT_SECRET (change to a random string)
    echo.
    pause
) else (
    echo [OK] .env file exists
)

echo.
echo Starting Docker containers...

REM Start Docker containers
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    docker compose up -d
)

echo Waiting for services to be healthy...
timeout /t 5 /nobreak >nul

echo.
echo Installing dependencies...

REM Install dependencies
call npm install

echo.
echo Setting up database...

REM Setup database
cd apps\server
call npm run prisma:generate
call npm run prisma:migrate
cd ..\..

echo.
echo [SUCCESS] Setup complete!
echo.
echo Next steps:
echo.
echo 1. Start the backend server:
echo    npm run dev:server
echo.
echo 2. In a new terminal, start the mobile app:
echo    npm run dev:mobile
echo.
echo 3. Access the application:
echo    - Backend API: http://localhost:3000
echo    - API Docs: http://localhost:3000/api/docs
echo    - MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)
echo.
echo For more information, see TESTING.md or TESTING_KO.md
echo.
pause
