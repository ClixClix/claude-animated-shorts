@echo off
setlocal
cd /d "%~dp0studio"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 24 is required. Open PowerShell after installing it.
 pause
 exit /b 1
)
echo =========================================
echo  WHAT IF CATS — IN THIS TOWN, EPISODE 02
echo  PART 1: Shots 01-04 visual pilot (6.1 sec)
echo =========================================
echo No paid voice generation. No full episode render.
node scripts/episode02-part1.mjs
if errorlevel 1 (
 echo The pilot completed with an error or quality warning.
 echo Check the Part 1 render status and upload any preview footage produced.
 pause
 exit /b 1
)
echo Pilot rendered. NOT YET VISUALLY APPROVED.
echo Open studio\out\v2-episodes\in-this-town-02\part1-pilot\
pause
