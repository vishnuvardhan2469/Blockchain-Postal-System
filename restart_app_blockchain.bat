@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe
timeout /t 2

echo Starting Local Blockchain Node...
start "Blockchain Node" cmd /k "cd blockchain && npx hardhat node"

echo Waiting for Blockchain to Initialize...
timeout /t 20

echo Deploying Smart Contract...
cd blockchain
call npx hardhat run scripts/deploy.js --network localhost
cd ..

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && node index.js"
timeout /t 5

echo Starting Controller Client...
start "Controller Client" cmd /k "cd controller-client && npm run dev -- --port 5174 --host"

echo Starting User Client...
start "User Client" cmd /k "cd user-client && npm run dev -- --port 5173 --host"

echo Starting Landing Page...
start "Landing Page" cmd /k "cd landing-client && npm run dev -- --host"

echo ========================================================
echo BLOCKCHAIN SYSTEM STARTED
echo Contract deployed to Localhost Network
echo Open: http://localhost:5170
echo ========================================================
pause
