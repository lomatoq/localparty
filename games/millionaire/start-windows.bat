@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18+ ne naiden. Ustanovi Node.js s https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies once...
  call npm install
  if errorlevel 1 pause
)
start "" http://localhost:3000/host
node server.js
pause
