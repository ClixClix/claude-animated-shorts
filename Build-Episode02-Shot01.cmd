@echo off
setlocal
cd /d "%~dp0studio"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 24 is required to render the local performance proof.
 pause
 exit /b 1
)
echo ================================================
echo  WHAT IF CATS — EPISODE 02
echo  SINGLE-SHOT ARTICULATED PERFORMANCE PROOF
echo ================================================
echo 2.6 seconds / one shot / original Episode 01 town.
echo Geometry and framing samples come BEFORE video encoding.
echo This is not the old Part 1 draft, not a final episode.
node scripts/episode02-shot01-performance.mjs
if errorlevel 1 (
 echo QA or source check found a problem. Inspect:
 echo studio\out\v2-episodes\in-this-town-02\shot01-performance\
 pause
 exit /b 1
)
echo Review the MP4 and QA before animating more shots.
start "" "%~dp0studio\out\v2-episodes\in-this-town-02\shot01-performance"
pause
