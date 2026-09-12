@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)
start "" http://localhost:3000/host
node server.js
pause
