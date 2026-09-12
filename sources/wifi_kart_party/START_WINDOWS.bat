@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  set PY=py
) else (
  set PY=python
)
if not exist .venv (
  %PY% -m venv .venv
  if errorlevel 1 goto :fail
)
call .venv\Scripts\activate.bat
python -c "import aiohttp,qrcode,PIL" >nul 2>nul
if errorlevel 1 (
  echo Installing first-run dependencies...
  python -m pip install --disable-pip-version-check -r requirements.txt
  if errorlevel 1 goto :fail
)
python server.py
goto :eof
:fail
echo.
echo Could not start Wi-Fi Kart. Make sure Python 3.10+ and internet are available for the first install.
pause
