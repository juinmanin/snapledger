# SnapLedger Testing Guide

This guide explains how to run and test the SnapLedger application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Testing Individual Components](#testing-individual-components)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Docker**: Latest version
- **Docker Compose**: Latest version

Verify your installations:
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
docker --version
docker-compose --version
```

**Quick Environment Check**: After setup, you can verify your environment:
```bash
./check-env.sh  # Runs automated environment verification
```

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/juinmanin/snapledger.git
cd snapledger
```

### 2. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your credentials
# At minimum, you need to configure:
# - DATABASE_URL (can use default for local)
# - JWT_SECRET (change to a random string)
# - GOOGLE_AI_API_KEY (for Gemini AI features)
# - GOOGLE_APPLICATION_CREDENTIALS (for Vision API and Cloud Storage)
```

### 3. Start Infrastructure Services
Start PostgreSQL, Redis, and MinIO using Docker Compose:
```bash
docker-compose up -d
```

Verify services are running:
```bash
docker-compose ps
```

All services should show as "healthy" or "running".

### 4. Install Dependencies
Install all dependencies for the monorepo:
```bash
npm install
```

This will install dependencies for both the server and mobile apps.

## Running the Application

### Backend Server

#### Development Mode
```bash
# Option 1: From root directory
npm run dev:server

# Option 2: From server directory
cd apps/server
npm install  # If not already done
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The server will start at:
- API: http://localhost:3000
- API Documentation (Swagger): http://localhost:3000/api/docs

#### Production Build
```bash
cd apps/server
npm run build
npm run start:prod
```

### Mobile Application

#### Start Expo Development Server
```bash
# Option 1: From root directory
npm run dev:mobile

# Option 2: From mobile directory
cd apps/mobile
npm install  # If not already done
npm start
```

After starting, you can:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan QR code with Expo Go app on your physical device
- Press `w` to open in web browser

## Running Tests

### Run All Tests
From the root directory:
```bash
npm test
```

This will run tests for all workspaces (both server and mobile).

### Backend Tests

#### Run All Backend Tests
```bash
cd apps/server
npm test
```

#### Run Tests in Watch Mode
```bash
cd apps/server
npm run test:watch
```

#### Run Tests with Coverage
```bash
cd apps/server
npm run test:cov
```

Coverage report will be generated in `apps/server/coverage/`.

#### Run Specific Test File
```bash
cd apps/server
npm test -- <test-file-name>

# Example:
npm test -- auth.service.spec.ts
```

### Linting

#### Lint All Code
```bash
npm run lint
```

#### Lint Server Code Only
```bash
cd apps/server
npm run lint
```

#### Format Code
```bash
cd apps/server
npm run format
```

## Testing Individual Components

### 1. Test Database Connection
```bash
cd apps/server
npm run prisma:studio
```

This opens Prisma Studio at http://localhost:5555 where you can view and edit database records.

### 2. Test API Endpoints

#### Using Swagger UI
1. Start the backend server
2. Open http://localhost:3000/api/docs
3. Use the interactive API documentation to test endpoints

#### Using curl
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### 3. Test MinIO Storage
Access MinIO console:
- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin123`

### 4. Test Database
Connect to PostgreSQL:
```bash
docker exec -it snapledger-postgres psql -U snapledger -d snapledger
```

Common queries:
```sql
-- List all tables
\dt

-- Count users
SELECT COUNT(*) FROM "User";

-- View recent transactions
SELECT * FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 10;

-- Exit
\q
```

### 5. Test Redis
Connect to Redis:
```bash
docker exec -it snapledger-redis redis-cli

# Test commands
PING
KEYS *
exit
```

## Testing Specific Features

### AI Receipt Processing
1. Ensure you have `GOOGLE_AI_API_KEY` and `GOOGLE_APPLICATION_CREDENTIALS` configured
2. Start the backend server
3. Use the mobile app or API to upload a receipt image
4. Check the response for AI-generated categorization

### Google OAuth
1. Configure OAuth credentials in `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL`
2. Start the server
3. Navigate to http://localhost:3000/api/v1/auth/google
4. Complete the OAuth flow

### Multi-language Support
1. Start the mobile app
2. Navigate to Settings
3. Change language (Korean, English, Malay, Chinese)
4. Verify all UI elements are translated

## Troubleshooting

### Port Already in Use
If you get port errors:
```bash
# Check what's using the port
lsof -i :3000  # For backend
lsof -i :8081  # For mobile

# Kill the process or change the port in .env
```

### Database Connection Issues
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres

# Reset database (WARNING: This deletes all data)
cd apps/server
npm run prisma:migrate reset
```

### Docker Issues
```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Restart everything
docker-compose up -d
```

### Clean Install
If you encounter dependency issues:
```bash
# Remove all node_modules and lock files
rm -rf node_modules apps/*/node_modules package-lock.json

# Reinstall
npm install
```

### Prisma Issues
```bash
cd apps/server

# Regenerate Prisma client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Reset database (WARNING: This deletes all data)
npm run prisma:migrate reset
```

## Environment-Specific Testing

### Development Environment
- Uses MinIO for storage (local)
- Uses local PostgreSQL database
- Hot-reload enabled for both backend and mobile

### Production-like Testing
```bash
# Build and run backend in production mode
cd apps/server
npm run build
NODE_ENV=production npm run start:prod

# Set STORAGE_PROVIDER=gcs in .env to test Google Cloud Storage
```

## Continuous Integration

This project uses npm scripts for CI/CD:
```bash
# Run all checks
npm run lint
npm test
npm run build:server
```

## Additional Resources

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)
- [Prisma Studio](https://www.prisma.io/studio)
- [Swagger/OpenAPI Documentation](http://localhost:3000/api/docs)

## Quick Reference

### Common Commands
```bash
# Start everything
docker-compose up -d && npm run dev:server

# Run tests
npm test

# Lint code
npm run lint

# View database
cd apps/server && npm run prisma:studio

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

### Default URLs
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs
- Prisma Studio: http://localhost:5555
- MinIO Console: http://localhost:9001
- Mobile App: http://localhost:8081 (or Expo DevTools)

### Default Credentials
- **PostgreSQL**: snapledger / password
- **MinIO**: minioadmin / minioadmin123
- **Redis**: No authentication (local dev)
