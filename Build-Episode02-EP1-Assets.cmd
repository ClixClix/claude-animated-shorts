@echo off
setlocal
cd /d "%~dp0studio"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 24 is required.
 pause
 exit /b 1
)
echo ==================================================
echo  EPISODE 02 - ACTUAL EPISODE 01 ASSET REUSE PROOF
echo  Mocha / Essie / Latte / kitten / town / shaders
echo ==================================================
echo 12 stills only. NO full 60-shot render. NO paid voice.
node scripts/episode02-episode1-assets-preview.mjs
if errorlevel 1 (
 echo A preflight or render error occurred. No old puppet prototype was used.
 pause
 exit /b 1
)
start "" "%~dp0studio\out\v2-episodes\in-this-town-02\ep1-asset-reuse-proof"
echo Visual review is still required before production.
pause
