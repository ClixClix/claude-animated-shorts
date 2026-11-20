[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-f]{40}$')][string]$Revision,
    [string]$StudioPath = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$studio = (Resolve-Path -LiteralPath $StudioPath).Path
$episode = 'src/v2/episodes/in-this-town-02'
$scene = Join-Path $studio $episode
foreach ($relative in @("$episode/Episode.tsx","$episode/timeline.ts",'scripts/episode02-render.mjs','package.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $studio $relative) -PathType Leaf)) {
        throw 'Run this from the studio folder where you installed Episode 02 V9.'
    }
}

$toolNames = @(
    'Local-Episode02-Review.ps1',
    'apply-v9-rescue.mjs',
    'v9-source-check.mjs',
    'locked-edit-gate.mjs',
    'locked-edit-gate.test.mjs',
    'rescue-continuity-test.mjs',
    'three-frame-gate.mjs',
    'review-inputs.mjs'
)
$files = @($toolNames | ForEach-Object { 'tools/' + $_ })
$baseline = 'V9_SOURCE_RECONCILIATION.json'
if (-not (Test-Path -LiteralPath (Join-Path $scene $baseline))) { $files += $baseline }
$tmp = Join-Path ([IO.Path]::GetTempPath()) ('v2-episode02-review-' + [guid]::NewGuid().ToString('N'))
$base = "https://raw.githubusercontent.com/ClixClix/claude-animated-shorts/$Revision/studio/$episode"
$backup = Join-Path $studio ('out/v2-episodes/in-this-town-02/review-tool-backup-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $tmp 'tools') -Force | Out-Null
try {
    foreach ($file in $files) {
        Invoke-WebRequest -UseBasicParsing -Uri "$base/$file" -OutFile (Join-Path $tmp $file)
    }
    New-Item -ItemType Directory -Path (Join-Path $scene 'tools') -Force | Out-Null
    foreach ($file in $files) {
        $destination = Join-Path $scene $file
        if (Test-Path -LiteralPath $destination -PathType Leaf) {
            $saved = Join-Path $backup $file
            New-Item -ItemType Directory -Path (Split-Path -Parent $saved) -Force | Out-Null
            Copy-Item -LiteralPath $destination -Destination $saved
        }
    }
    foreach ($file in $files) {
        Copy-Item -LiteralPath (Join-Path $tmp $file) -Destination (Join-Path $scene $file) -Force
    }
} finally {
    Remove-Item -LiteralPath $tmp -Recurse -Force
}
Write-Host 'Episode 02 review tools installed.'
if (Test-Path -LiteralPath $backup) { Write-Host "Previous tools saved in $backup" }
