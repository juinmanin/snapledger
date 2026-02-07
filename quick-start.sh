#!/bin/bash

# SnapLedger Quick Start Script
# This script helps you quickly set up and run the SnapLedger application

set -e  # Exit on error

echo "🚀 SnapLedger Quick Start"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version is too old (found v$NODE_VERSION, need v18+)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi
echo -e "${GREEN}✓ Docker $(docker -v | cut -d' ' -f3 | tr -d ',')${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose${NC}"

echo ""
echo "📦 Setting up environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env and add your API keys:${NC}"
    echo "   - GOOGLE_AI_API_KEY (for Gemini AI)"
    echo "   - GOOGLE_APPLICATION_CREDENTIALS (for Vision API)"
    echo "   - JWT_SECRET (change to a random string)"
    echo ""
    read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo ""
echo "🐳 Starting Docker containers..."

# Start Docker containers
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

echo "Waiting for services to be healthy..."
sleep 5

echo ""
echo "📥 Installing dependencies..."

# Install dependencies
npm install

echo ""
echo "🗄️  Setting up database..."

# Setup database
cd apps/server
npm run prisma:generate
npm run prisma:migrate
cd ../..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Start the backend server:"
echo "   ${GREEN}npm run dev:server${NC}"
echo ""
echo "2. In a new terminal, start the mobile app:"
echo "   ${GREEN}npm run dev:mobile${NC}"
echo ""
echo "3. Access the application:"
echo "   - Backend API: http://localhost:3000"
echo "   - API Docs: http://localhost:3000/api/docs"
echo "   - MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)"
echo ""
echo "📚 For more information, see TESTING.md or TESTING_KO.md"
echo ""
