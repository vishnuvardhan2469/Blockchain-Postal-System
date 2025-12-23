@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe

timeout /t 2

echo Starting Server...
start "Server" cmd /k "cd server && npm run dev"

echo Starting Controller Client...
start "Controller Client" cmd /k "cd controller-client && npm run dev -- --port 5174 --host"

echo Starting User Client...
start "User Client" cmd /k "cd user-client && npm run dev -- --port 5173 --host"

echo Starting Landing Page...
start "Landing Page" cmd /k "cd landing-client && npm run dev -- --host"

echo ========================================================
echo SYSTEM RESTARTED
echo Please wait 10 seconds, then open: http://localhost:5170
echo ========================================================
pause
