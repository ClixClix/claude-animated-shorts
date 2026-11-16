@echo off
setlocal
cd /d "%~dp0studio"
if not exist "out\v2-episodes\in-this-town-02\Approved_Narration.wav" (
 echo Episode 02 approved narration is missing.
 echo Place Approved_Narration.wav under studio\out\v2-episodes\in-this-town-02\
 echo OR manually run: node scripts/produce-box.mjs build --allow-scratch
 echo No rendering or paid requests were started.
 pause
 exit /b 1
)
node scripts/produce-box.mjs build
if errorlevel 1 (
 echo Episode 02 build failed. Existing completed shots remain cached.
 pause
 exit /b 1
)
echo Complete Episode 02 build assembled. QA was NOT run.
echo When ready for ALL checks at once, use Check-Episode02.cmd.
pause
