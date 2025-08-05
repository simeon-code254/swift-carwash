#!/bin/bash

echo "🚀 SwiftWash Deployment Script"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm is installed"

# Install dependencies for all projects
echo "📦 Installing dependencies..."

echo "Installing server dependencies..."
cd server && npm install && cd ..

echo "Installing client dependencies..."
cd client && npm install && cd ..

echo "Installing admin app dependencies..."
cd admin-app && npm install && cd ..

echo "✅ All dependencies installed"

# Check MongoDB connection
echo "🔗 Testing MongoDB connection..."
node fix-mongodb.js

echo ""
echo "🎯 Starting all services..."
echo "================================"

# Start server in background
echo "🚀 Starting server on port 5000..."
cd server && npm start &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start client app in background
echo "🚀 Starting client app on port 3000..."
cd ../client && npm start &
CLIENT_PID=$!

# Wait a moment for client to start
sleep 3

# Start admin app in background
echo "🚀 Starting admin app on port 3001..."
cd ../admin-app && npm run start:admin &
ADMIN_PID=$!

echo ""
echo "✅ All services started!"
echo "================================"
echo "📱 Client App: http://localhost:3000"
echo "👨‍💼 Admin App: http://localhost:3001"
echo "🔧 Server API: http://localhost:5000"
echo ""
echo "🔑 Admin Login: admin / admin123"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    kill $ADMIN_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait 