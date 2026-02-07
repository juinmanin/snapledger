#!/bin/bash

# SnapLedger v3.0 Quick Start Script for Linux/Mac
# This script automates the setup process

set -e

echo "🚀 SnapLedger v3.0 Quick Start"
echo "================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your Google Cloud credentials before continuing."
    echo "   Press Enter to continue after editing .env..."
    read
fi

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL, Redis, MinIO)..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 5

# Backend setup
echo ""
echo "🔧 Setting up backend..."
cd apps/server

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

echo "🗄️  Generating Prisma client..."
npm run prisma:generate

echo "🔄 Running database migrations..."
npm run prisma:migrate

echo "🌱 Seeding tax data for 4 countries..."
# Note: Add seed command when available
# npm run prisma:seed

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "To start the backend server, run:"
echo "  cd apps/server && npm run dev"
echo ""
echo "Backend will be available at: http://localhost:3000"
echo "API Documentation (Swagger): http://localhost:3000/api/docs"
echo ""

# Mobile setup
cd ../mobile

if [ ! -d "node_modules" ]; then
    echo "📦 Installing mobile dependencies..."
    npm install
fi

echo ""
echo "✅ Mobile setup complete!"
echo ""
echo "To start the mobile app, run:"
echo "  cd apps/mobile && npm start"
echo ""

cd ../..

echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Start backend: cd apps/server && npm run dev"
echo "  2. Start mobile: cd apps/mobile && npm start (in a new terminal)"
echo "  3. Read TESTING_KO.md for testing guide (한국어)"
echo "  4. Access Swagger API docs at http://localhost:3000/api/docs"
echo "  5. Access Prisma Studio at http://localhost:5555 (run: npx prisma studio)"
echo ""
echo "Happy coding! 🚀"
