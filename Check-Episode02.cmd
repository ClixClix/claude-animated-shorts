@echo off
setlocal
cd /d "%~dp0studio"
echo Episode 02: running the post-build batch technical and visual-evidence checks.
node scripts/produce-box.mjs check
if errorlevel 1 (
 echo Episode 02 batch QA found errors; see the generated report files.
 pause
 exit /b 1
)
echo Batch technical checks finished; human visual and rights approval still needed.
pause
