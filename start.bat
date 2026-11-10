@echo off
cd /d "%~dp0"
title ClaimKeeper Launcher

echo ========================================================
echo   Launching ClaimKeeper AI in your browser...
echo ========================================================

:: Try Google Chrome first
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%~dp0index.html"
    exit /b
)

:: Try Microsoft Edge next
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "%~dp0index.html"
    exit /b
)

:: Fallback to Windows default registered browser
start "" "%~dp0index.html"
exit /b
