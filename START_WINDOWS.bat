@echo off
setlocal
cd /d "%~dp0"
title LOCAL PARTY
if not exist "runtime\node\node.exe" (
  echo Missing bundled Node.js. Extract the entire Windows ZIP before starting.
  pause
  exit /b 1
)
set "PATH=%~dp0runtime\node;%PATH%"
echo LOCAL PARTY - keep this window open while playing.
echo Allow access on Private networks if Windows Firewall asks.
"%~dp0runtime\node\node.exe" "%~dp0server.js"
if errorlevel 1 pause
