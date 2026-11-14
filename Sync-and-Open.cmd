@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Update-Local-Code.ps1"
if errorlevel 1 (
 echo Update stopped. Your local renders and private assets were preserved.
 pause
 exit /b 1
)
call "%~dp0Start-Local-Studio.cmd"
