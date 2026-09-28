@echo off
echo ====================================================
echo     Starting AI Threat Analyzer...
echo ====================================================

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in your PATH.
    echo Please install Node.js (v18+) to run the AI Threat Analyzer.
    pause
    exit /b 1
)

echo [1/2] Setting up Backend Server (Port 5000)...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

if not exist .env (
    echo Creating default .env file...
    echo DATABASE_URL="file:./dev.db" > .env
    echo JWT_SECRET="default_secret_key_change_me_in_production" >> .env
    echo OPENROUTER_API_KEY="" >> .env
)
echo Updating database schema...
call npx prisma db push
call npx prisma generate

start "AI Threat Analyzer - Backend" cmd /k "npx -y tsx src/index.ts"
cd ..

echo [2/2] Setting up Frontend Server (Port 5173)...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

start "AI Threat Analyzer - Frontend" cmd /k "npm run dev"
cd ..

echo [3/3] Setting up Public Tunnel...
start "AI Threat Analyzer - Public Tunnel" cmd /k "node tunnel.js"

echo.
echo Servers and Tunnel are starting up in separate windows!
echo Please wait a few seconds for them to initialize...
echo.

timeout /t 5 /nobreak > nul

echo Opening the Dashboard in your default browser...
start http://localhost:5173

echo.
echo ====================================================
echo System is up and running!
echo You can safely close this launcher window.
echo ====================================================
pause
