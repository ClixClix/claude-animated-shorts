@echo off
setlocal
cd /d "%~dp0studio"
if "%~1"=="" (
 echo Drop a plain-text story file onto this CMD file to generate a first Episode 01-style storyboard.
 echo No paid narration, no render, no files are overwritten.
 echo.
 echo Example: Prepare-Next-InThisTown.cmd "C:\Stories\episode3.txt"
 pause
 exit /b 2
)
node scripts/series-one-prompt.mjs --story-file "%~1"
if errorlevel 1 (
 echo Generation stopped. The original story is untouched.
 pause
 exit /b 1
)
echo.
echo Initial storyboard lives in studio\production\. It is NOT an animated movie.
echo Review instructions: NEXT_EPISODE_ONE_PROMPT.md
pause
