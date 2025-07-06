#!/bin/bash

# Development startup script for Care Services Platform

echo "🚀 Starting Care Services Platform in development mode..."

# Check and cleanup port
./scripts/cleanup-port.sh

# Check if database is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start it first."
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start it first."
    exit 1
fi

echo "✅ Database and Redis are running"

# Run database migrations
echo "🔄 Running database migrations..."
npm run migration:run

# Clear and seed database if requested
if [ "$1" = "--seed" ]; then
    echo "🌱 Seeding database with test data..."
    npm run seed
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the application
echo "🏃 Starting application..."
npm run start:dev