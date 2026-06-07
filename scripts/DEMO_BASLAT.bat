@echo off
:: Script'in bulundugu klasorun bir ust klasorunu ROOT olarak al (cunku scripts altindayiz)
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
for %%I in ("%SCRIPT_DIR%") do set "ROOT=%%~dpI"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
chcp 65001 >nul 2>&1
call "%~dp0scripts\DEMO_BASLAT.bat"
