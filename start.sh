#!/bin/bash

echo "===================================================="
echo "    Starting AI Threat Analyzer..."
echo "===================================================="

# Trap SIGINT to kill background processes when the user presses Ctrl+C
trap 'echo -e "\nShutting down servers..."; kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null; exit' SIGINT SIGTERM

# Dependency Check
if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js is not installed or not in your PATH."
    if [ "$EUID" -eq 0 ]; then
        echo "HINT: You ran this script with sudo (root). If you installed Node via NVM,"
        echo "it might only be available to your standard user. Try running without sudo,"
        echo "or install Node system-wide."
    fi
    echo "Please install Node.js (v18+) to run the AI Threat Analyzer."
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm is not installed or not in your PATH."
    exit 1
fi

echo "[1/2] Setting up Backend Server (Port 5000)..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "Creating default .env file..."
    echo 'DATABASE_URL="file:./dev.db"' > .env
    echo 'JWT_SECRET="default_secret_key_change_me_in_production"' >> .env
    echo 'OPENROUTER_API_KEY=""' >> .env
fi
echo "Updating database schema..."
npx prisma db push
npx prisma generate

npx -y tsx src/index.ts &
BACKEND_PID=$!
cd ..

echo "[2/2] Setting up Frontend Server (Port 5173)..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
cd ..

echo "[3/3] Setting up Public Tunnel..."
node tunnel.js &
TUNNEL_PID=$!

echo ""
echo "Servers and Tunnel are starting up in the background!"
echo "Please wait a few seconds for them to initialize..."
echo ""

sleep 5

echo "Opening the Dashboard in your default browser..."
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:5173
elif command -v open > /dev/null; then
  open http://localhost:5173
else
  echo "Could not automatically launch browser. Please manually open: http://localhost:5173"
fi

echo ""
echo "===================================================="
echo "System is up and running!"
echo "Press Ctrl+C in this terminal to safely stop the servers."
echo "===================================================="

# Keep the script running to keep the background processes alive and catch Ctrl+C
wait $BACKEND_PID $FRONTEND_PID $TUNNEL_PID
