@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js не найден. Установи Node.js 18+ с https://nodejs.org/
  echo Потом запусти этот файл снова.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Устанавливаю зависимости один раз...
  call npm install
  if errorlevel 1 (
    echo Не удалось выполнить npm install.
    pause
    exit /b 1
  )
)
echo.
echo Запускаю MONSTER CIRCLE...
echo На экране компьютера появится QR. Телефоны подключаются сканированием камерой.
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:3000"
node server.js
pause
