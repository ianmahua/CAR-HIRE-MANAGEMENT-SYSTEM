#!/bin/bash

echo "Starting THE RESSEY TOURS CRMS Development Servers..."
echo ""

# Start backend in background
echo "Starting Backend Server..."
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting Frontend Server..."
cd frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

