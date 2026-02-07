@echo off
REM SnapLedger v3.0 Quick Start Script for Windows
REM This script automates the setup process

echo.
echo ^=================================
echo  SnapLedger v3.0 Quick Start
echo ^=================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

echo [OK] Prerequisites check passed
echo.

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo [WARNING] Please edit .env file with your Google Cloud credentials before continuing.
    echo           Press any key to continue after editing .env...
    pause >nul
)

REM Start Docker services
echo.
echo Starting Docker services (PostgreSQL, Redis, MinIO)...
docker-compose up -d

echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM Backend setup
echo.
echo Setting up backend...
cd apps\server

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

echo Generating Prisma client...
call npm run prisma:generate

echo Running database migrations...
call npm run prisma:migrate

echo Seeding tax data for 4 countries...
REM Note: Add seed command when available
REM call npm run prisma:seed

echo.
echo [OK] Backend setup complete!
echo.
echo To start the backend server, run:
echo   cd apps\server ^&^& npm run dev
echo.
echo Backend will be available at: http://localhost:3000
echo API Documentation (Swagger): http://localhost:3000/api/docs
echo.

REM Mobile setup
cd ..\mobile

if not exist "node_modules" (
    echo Installing mobile dependencies...
    call npm install
)

echo.
echo [OK] Mobile setup complete!
echo.
echo To start the mobile app, run:
echo   cd apps\mobile ^&^& npm start
echo.

cd ..\..

echo.
echo ^=================================
echo  Setup complete!
echo ^=================================
echo.
echo Next steps:
echo   1. Start backend: cd apps\server ^&^& npm run dev
echo   2. Start mobile: cd apps\mobile ^&^& npm start (in a new terminal)
echo   3. Read TESTING_KO.md for testing guide (Korean)
echo   4. Access Swagger API docs at http://localhost:3000/api/docs
echo   5. Access Prisma Studio: npx prisma studio
echo.
echo Happy coding!
echo.
pause
