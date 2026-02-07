#!/bin/bash

# Environment Check Script for SnapLedger
# This script verifies that your environment is properly configured

set -e

echo "🔍 SnapLedger Environment Check"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SUCCESS=0
WARNINGS=0
ERRORS=0

# Function to check a service
check_service() {
    local service_name=$1
    local check_command=$2
    
    if eval "$check_command" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $service_name is running"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} $service_name is NOT running"
        ((ERRORS++))
    fi
}

# Function to check a port
check_port() {
    local service_name=$1
    local port=$2
    
    if nc -z localhost "$port" 2>/dev/null || curl -s "http://localhost:$port" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service_name (port $port) is accessible"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} $service_name (port $port) is NOT accessible"
        ((ERRORS++))
    fi
}

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local required=$2
    
    if [ -f .env ]; then
        if grep -q "^${var_name}=" .env; then
            local value=$(grep "^${var_name}=" .env | cut -d'=' -f2-)
            if [[ "$value" == "your-"* ]] || [[ "$value" == "change-me-"* ]]; then
                echo -e "${YELLOW}⚠${NC} $var_name is set but needs to be updated"
                ((WARNINGS++))
            else
                echo -e "${GREEN}✓${NC} $var_name is configured"
                ((SUCCESS++))
            fi
        else
            if [ "$required" = "true" ]; then
                echo -e "${RED}✗${NC} $var_name is NOT set"
                ((ERRORS++))
            else
                echo -e "${YELLOW}⚠${NC} $var_name is NOT set (optional)"
                ((WARNINGS++))
            fi
        fi
    else
        echo -e "${RED}✗${NC} .env file not found"
        ((ERRORS++))
        return
    fi
}

echo -e "${BLUE}1. Checking Prerequisites${NC}"
echo "-------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js $(node -v)"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} Node.js not found"
    ((ERRORS++))
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} npm $(npm -v)"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} npm not found"
    ((ERRORS++))
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker installed"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} Docker not found"
    ((ERRORS++))
fi

echo ""
echo -e "${BLUE}2. Checking Docker Services${NC}"
echo "---------------------------"

# Check if Docker is running
if docker info &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker daemon is running"
    ((SUCCESS++))
    
    # Check each service
    check_service "PostgreSQL container" "docker ps | grep -q snapledger-postgres"
    check_service "Redis container" "docker ps | grep -q snapledger-redis"
    check_service "MinIO container" "docker ps | grep -q snapledger-minio"
else
    echo -e "${RED}✗${NC} Docker daemon is NOT running"
    ((ERRORS++))
fi

echo ""
echo -e "${BLUE}3. Checking Service Ports${NC}"
echo "-------------------------"

check_port "PostgreSQL" 5432
check_port "Redis" 6379
check_port "MinIO" 9000
check_port "MinIO Console" 9001

echo ""
echo -e "${BLUE}4. Checking Environment Configuration${NC}"
echo "--------------------------------------"

# Check critical environment variables
check_env_var "DATABASE_URL" "true"
check_env_var "JWT_SECRET" "true"
check_env_var "GOOGLE_AI_API_KEY" "false"
check_env_var "GOOGLE_APPLICATION_CREDENTIALS" "false"
check_env_var "GOOGLE_CLIENT_ID" "false"

echo ""
echo -e "${BLUE}5. Checking Node Dependencies${NC}"
echo "------------------------------"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Root dependencies installed"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} Root dependencies NOT installed (run: npm install)"
    ((ERRORS++))
fi

if [ -d "apps/server/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Server dependencies installed"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠${NC} Server dependencies NOT installed"
    ((WARNINGS++))
fi

if [ -d "apps/mobile/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Mobile dependencies installed"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠${NC} Mobile dependencies NOT installed"
    ((WARNINGS++))
fi

echo ""
echo -e "${BLUE}6. Checking Database${NC}"
echo "--------------------"

# Check if Prisma client is generated
if [ -d "apps/server/node_modules/.prisma" ]; then
    echo -e "${GREEN}✓${NC} Prisma client generated"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} Prisma client NOT generated (run: npm run prisma:generate)"
    ((ERRORS++))
fi

echo ""
echo "================================"
echo -e "${BLUE}Summary${NC}"
echo "================================"
echo -e "${GREEN}✓ Success: $SUCCESS${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo -e "${RED}✗ Errors: $ERRORS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Environment check failed!${NC}"
    echo "Please fix the errors above before running the application."
    echo ""
    echo "Common fixes:"
    echo "  - Run 'docker-compose up -d' to start Docker services"
    echo "  - Run 'npm install' to install dependencies"
    echo "  - Run 'cd apps/server && npm run prisma:generate' to generate Prisma client"
    echo "  - Check that .env file exists and has correct values"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Environment check passed with warnings${NC}"
    echo "Some optional features may not work correctly."
    echo "See warnings above for details."
    exit 0
else
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo "Your environment is ready to run SnapLedger."
    echo ""
    echo "Next steps:"
    echo "  1. Start backend: npm run dev:server"
    echo "  2. Start mobile: npm run dev:mobile"
    exit 0
fi
