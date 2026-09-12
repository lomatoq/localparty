@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\quick-test.ps1" -View host
if errorlevel 1 pause
