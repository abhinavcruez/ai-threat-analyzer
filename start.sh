#!/bin/bash

echo "===================================================="
echo "    Starting AI Threat Analyzer..."
echo "===================================================="

# Trap SIGINT to kill background processes when the user presses Ctrl+C
trap 'echo -e "\nShutting down servers..."; kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null; exit' SIGINT SIGTERM

# Dependency Check & Auto-Install
if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is not installed or not in your PATH."
    echo "Attempting to install Node.js automatically via NVM (Node Version Manager)..."
    
    if command -v curl >/dev/null 2>&1; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    else
        echo "ERROR: Neither curl nor wget is installed. Cannot auto-install Node.js."
        exit 1
    fi

    # Load NVM directly into the current session
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    echo "Installing Node.js v20..."
    nvm install 20
    nvm use 20

    if ! command -v node >/dev/null 2>&1; then
        echo "ERROR: Auto-installation failed. Please install Node.js manually."
        exit 1
    fi
    echo "Node.js successfully installed!"
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
