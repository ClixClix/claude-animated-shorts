@echo off
cd /d "%~dp0"
node "%~dp0studio\scripts\produce-polish.mjs" preview --skip-checks
pause
