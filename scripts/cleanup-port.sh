#!/bin/bash

# Script to clean up port conflicts for Care Services Platform

PORT=${1:-3000}

echo "🧹 Cleaning up port $PORT..."

# Find and kill processes using the port
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "Found process on port $PORT, terminating..."
    lsof -ti:$PORT | xargs kill -9
    echo "✅ Port $PORT is now free"
else
    echo "✅ Port $PORT is already free"
fi

# Also check for any hanging Node.js processes
echo "🔍 Checking for hanging Node.js processes..."
if pgrep -f "node.*care-services" > /dev/null 2>&1; then
    echo "Found hanging Node.js processes, cleaning up..."
    pkill -f "node.*care-services"
    echo "✅ Cleaned up hanging processes"
fi

echo "✨ Cleanup complete!"