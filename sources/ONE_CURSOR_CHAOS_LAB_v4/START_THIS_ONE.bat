@echo off
cd /d "%~dp0"
title ONE CURSOR UNLIMITED v3.1
cls
echo ========================================
echo   ONE CURSOR UNLIMITED v3.1
echo   2+ PLAYERS / FRESH PORT EVERY LAUNCH
echo ========================================
echo.
where py >nul 2>&1
if %errorlevel%==0 (
  py -3 -m pip install -r requirements.txt >nul 2>&1
  py -3 server.py
) else (
  python -m pip install -r requirements.txt >nul 2>&1
  python server.py
)
pause
