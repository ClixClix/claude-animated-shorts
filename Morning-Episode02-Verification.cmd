@echo off
setlocal
cd /d "%~dp0"
echo [In This Town] Syncing latest approved production code...
git pull --ff-only origin v2-local-render
if errorlevel 1 goto error
cd /d "%~dp0studio"
echo.
echo [1/4] One-prompt future-episode starter self-tests...
call npm.cmd run inthis:next-test
if errorlevel 1 goto error
echo.
echo [2/4] Source typecheck (NO RENDER)...
call npm.cmd run typecheck
if errorlevel 1 goto error
echo.
echo [3/4] Episode 2 director/scene blockers (NO RENDER)...
call npm.cmd run episode2:director-audit
if errorlevel 1 goto error
echo.
echo [4/4] Episode 2 narration/visual output status...
call npm.cmd run episode2:status
if errorlevel 1 goto error
echo.
echo Source checks passed. This does not certify camera moves, CGI acting or music rights.
echo To render a locally narrated 540p preview, launch this script with --preview
if /I "%~1"=="--preview" (
 echo.
 echo STARTING local narrated preview. Music must be the ORIGINAL Episode 1 song.
 call npm.cmd run episode2:preview-adam
 if errorlevel 1 goto error
)
echo.
echo Finished source verification. Read studio\out\v2-episodes\in-this-town-02\EP02_REMAINING_WORK.md
pause
exit /b 0
:error
echo.
echo STOPPED at a failing stage. No expensive full-resolution render started.
echo Read the terminal error and studio\out\v2-episodes\in-this-town-02\EP02_REMAINING_WORK.md if available.
pause
exit /b 1
