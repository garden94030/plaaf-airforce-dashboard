@echo off
cd /d "%~dp0"
start "PLAAF Auto Backup" /min py -3 auto_backup.py
