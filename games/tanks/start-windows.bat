@echo off
cd /d %~dp0
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install Node.js 20+ from nodejs.org, then run this file again.
  pause
  exit /b 1
)
cls
echo =============================================
echo   LOCAL TANKS - server is starting...
echo   Keep this window open while you play.
echo =============================================
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 800; Start-Process 'http://localhost:3000/host'"
node server.js
pause
