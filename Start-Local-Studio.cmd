@echo off
cd /d "%~dp0studio"
where node >nul 2>nul
if errorlevel 1 (
 echo Install Node.js 24, then open this shortcut again.
 pause
 exit /b 1
)
if not exist node_modules (
 call npm.cmd ci --no-audit --no-fund
 if errorlevel 1 (
  pause
  exit /b 1
 )
)
echo Opening Remotion Studio. Leave this window open while using it.
call npm.cmd run studio -- --port=3000
pause
