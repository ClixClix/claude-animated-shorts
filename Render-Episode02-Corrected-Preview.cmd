@echo off
setlocal
title Episode 02 - Corrected Story Preview
cd /d "%~dp0studio"
echo [1/4] Updating Episode 02 source from verified v2-local-render branch...
git pull --ff-only origin v2-local-render
if errorlevel 1 goto :fail
echo [2/4] Checking authoritative shot directions and physical actions...
node scripts/episode02-director-preflight.mjs --strict
if errorlevel 1 goto :fail
node scripts/episode02-action-evidence.mjs --strict
if errorlevel 1 goto :fail
echo [3/4] Checking all original-style cardboard box geometry...
node scripts/episode02-box-tests.mjs
if errorlevel 1 goto :fail
echo [4/4] Rendering NEW Episode 02 540p narrated review and assembling original music...
node scripts/produce-box.mjs build-preview
if errorlevel 1 goto :fail
echo.
echo SOURCE RENDERED. NOT VISUALLY APPROVED UNTIL VIDEO REVIEW.
echo Open the completed 540p preview in:
echo %CD%\out\v2-episodes\in-this-town-02
explorer.exe "%CD%\out\v2-episodes\in-this-town-02"
pause
exit /b 0
:fail
echo.
echo A source gate, update, audio input, or render stage failed.
echo No previous local render or approved private recording was deleted.
echo Please copy the error output into the ChatGPT conversation.
pause
exit /b 1
