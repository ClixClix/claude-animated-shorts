param([switch]$SkipPython)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
function Run-Checked([string]$program, [string[]]$arguments) {
    & $program @arguments
    if ($LASTEXITCODE -ne 0) { throw "$program failed (exit $LASTEXITCODE)." }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 24 LTS, then reopen PowerShell.' }
if ((& node -p 'parseInt(process.versions.node)') -ne '24') { throw 'Use Node.js 24.x (tested 24.22.1).' }
foreach ($tool in @('ffmpeg', 'ffprobe')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Install FFmpeg with ffprobe and add its bin folder to PATH. Example: winget install Gyan.FFmpeg" }
}
Push-Location (Join-Path $root 'studio')
try { Run-Checked 'npm.cmd' @('ci', '--no-audit', '--no-fund') } finally { Pop-Location }
if (-not $SkipPython) {
    $venv = Join-Path $root '.venv\Scripts\python.exe'
    if (-not (Test-Path $venv)) {
        if (Get-Command py -ErrorAction SilentlyContinue) { Run-Checked 'py' @('-3.12', '-m', 'venv', (Join-Path $root '.venv')) }
        else { Run-Checked 'python' @('-m', 'venv', (Join-Path $root '.venv')) }
    }
    Run-Checked $venv @('-c', 'import sys; assert sys.version_info[:2] == (3,12)')
    Run-Checked $venv @('-m', 'pip', 'install', '-r', (Join-Path $root 'requirements-v2.lock.txt'))
}
Run-Checked 'node' @((Join-Path $root 'studio\scripts\produce-episode.mjs'), 'status')
Write-Host 'Setup complete. Review WINDOWS_SETUP.md, then run .\Render-Episode.ps1 -Concurrency 2'
