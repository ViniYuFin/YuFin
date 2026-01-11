@echo off
echo ========================================
echo Criando conta admin...
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0criar-admin.ps1"

pause

