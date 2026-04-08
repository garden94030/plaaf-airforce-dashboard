@echo off
setlocal

set "REPO_DIR=%~dp0"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_FILE=%STARTUP_DIR%\plaaf_dashboard_auto_backup.cmd"

if not exist "%STARTUP_DIR%" (
  echo Startup folder not found.
  exit /b 1
)

> "%STARTUP_FILE%" echo @echo off
>> "%STARTUP_FILE%" echo cd /d "%REPO_DIR%"
>> "%STARTUP_FILE%" echo start "PLAAF Auto Backup" /min py -3 auto_backup.py

echo Installed startup launcher:
echo %STARTUP_FILE%
