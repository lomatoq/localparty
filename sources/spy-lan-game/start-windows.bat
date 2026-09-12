@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install Node.js 18+ from https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules call npm install
start "" http://localhost:3000/host
npm start
pause
