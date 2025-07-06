#!/bin/bash

# Care Services Platform - Quick Start Script
# This script sets up the entire platform for testing

echo "🚀 Care Services Platform - Quick Start"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are installed"

# Stop any running containers
echo ""
echo "Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Copy environment files if they don't exist
if [ ! -f .env ]; then
    echo ""
    echo "Setting up environment files..."
    cp .env.example .env
    print_status "Created .env file from .env.example"
else
    print_warning ".env file already exists, skipping..."
fi

# Start services
echo ""
echo "Starting all services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check if PostgreSQL is ready
echo "Checking PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
print_status "PostgreSQL is ready"

# Check if Redis is ready
echo "Checking Redis..."
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
print_status "Redis is ready"

# Wait a bit more for the app to fully start
sleep 10

# Run migrations
echo ""
echo "Running database migrations..."
docker-compose exec -T app npm run migration:run
print_status "Migrations completed"

# Seed test data
echo ""
echo "Seeding test data..."
docker-compose exec -T app npm run seed
print_status "Test data seeded"

# Create MinIO bucket
echo ""
echo "Setting up MinIO storage..."
docker-compose exec -T minio mc alias set myminio http://localhost:9000 minioadmin minioadmin 2>/dev/null || true
docker-compose exec -T minio mc mb myminio/care-services 2>/dev/null || true
print_status "MinIO storage configured"

# Display status and access information
echo ""
echo "======================================"
echo -e "${GREEN}✅ Platform is ready for testing!${NC}"
echo "======================================"
echo ""
echo "🌐 Access URLs:"
echo "   Main App: http://localhost:3000"
echo "   API Docs: http://localhost:3000/api-docs"
echo "   MinIO Console: http://localhost:9001"
echo "   pgAdmin: http://localhost:5050"
echo ""
echo "🔑 Test Credentials:"
echo "   Admin: admin@careservices.test / Admin@123456"
echo "   Provider: provider1@test.com / Provider@123"
echo "   Customer: customer1@test.com / Customer@123"
echo ""
echo "📋 Useful Commands:"
echo "   View logs: docker-compose logs -f app"
echo "   Stop all: docker-compose down"
echo "   Reset data: docker-compose exec app npm run db:reset"
echo "   Run tests: docker-compose exec app npm test"
echo ""
echo "🩺 Health Check:"
curl -s http://localhost:3000/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "API is responding at http://localhost:3000/health"
else
    print_warning "API is not yet responding, please wait a few more seconds..."
fi

echo ""
echo "Happy Testing! 🚀"