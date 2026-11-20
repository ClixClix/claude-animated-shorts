<#
.SYNOPSIS
  Episode 02 Windows local renderer (safe coordinator, not a scene replacement).
.DESCRIPTION
  Uses the installed V9 scene and Episode 02 Remotion renderer. Repair applies
  the hash-guarded rescue changes after saving a backup. The other stages read
  scene sources and write review output.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\studio\src\v2\episodes\in-this-town-02\tools\Local-Episode02-Review.ps1 -Stage Status
#>
[CmdletBinding()]
param(
    [ValidateSet('Status','Repair','Validate','Stills','Clips')]
    [string]$Stage = 'Status',
    [ValidatePattern('^[0-9]{1,2}[A-Z]?(,[0-9]{1,2}[A-Z]?)*$')]
    [string]$Shots = '06,07,49,50,51,52',
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$studio = (Resolve-Path (Join-Path $here '../../../../..')).Path
$out = Join-Path $studio 'out\v2-episodes\in-this-town-02'
$scene = Join-Path $studio 'src\v2\episodes\in-this-town-02'
$tools = Join-Path $scene 'tools'
$propsPath = Join-Path $out 'render-props.json'

function Invoke-Checked {
    param([string]$Executable,[string[]]$Arguments)
    Write-Host ('> ' + $Executable + ' ' + ($Arguments -join ' ')) -ForegroundColor Cyan
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Stopped: $Executable exited $LASTEXITCODE. No further rendering was started."
    }
}
function Show-SourceStatus {
    Write-Host ''
    Write-Host 'Episode 02 LOCAL source and render status' -ForegroundColor Green
    Write-Host "Studio: $studio"
    Write-Host 'No Git checkout, reset, pull, fetch, cloud render or paid call will be made.'
    $baseline = Join-Path $scene 'V9_SOURCE_RECONCILIATION.json'
    if (Test-Path $baseline) {
        $manifest = Get-Content $baseline -Raw | ConvertFrom-Json
        foreach ($entry in $manifest.files) {
            $file = Join-Path $studio $entry.path
            if (-not (Test-Path $file)) {
                Write-Warning "Missing scene file: $($entry.path)"
                continue
            }
            $actual = (Get-FileHash -Algorithm SHA256 $file).Hash.ToLowerInvariant()
            $normalized = [System.IO.File]::ReadAllText($file).Replace("`r`n","`n")
            $sha = [System.Security.Cryptography.SHA256]::Create()
            try {
                $normalizedHash = ([BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($normalized)))).Replace('-','').ToLowerInvariant()
            } finally {
                $sha.Dispose()
            }
            if ($actual -eq $entry.sha256 -or $normalizedHash -eq $entry.sha256) {
                Write-Host "Original V9 source: $($entry.path)"
            } else {
                Write-Warning "Different/newer scene file (will not overwrite): $($entry.path)"
            }
        }
    } else {
        Write-Warning 'V9_SOURCE_RECONCILIATION.json missing; local source cannot be reconciled yet.'
    }
    if (Test-Path $propsPath) {
        $props = Get-Content $propsPath -Raw | ConvertFrom-Json
        Write-Host "Actual live render manifest: $($props.shots.Count) segments"
        if ($props.PSObject.Properties['audioApproved'] -and $props.audioApproved -eq $true) {
            Write-Host 'Manifest: approved local narration expected; still verify provenance.' -ForegroundColor Green
        } else {
            Write-Warning 'Manifest is silent scratch; the locked Adam three-frame gate will refuse it. Do not overwrite approved local props with guessed timing.'
        }
    } else {
        Write-Warning 'No render-props.json found. Reconcile approved local Adam recording and word timing BEFORE rendering.'
    }
    Write-Host 'Status is read-only. Local scene files are never overwritten by this runner.'
}
function Confirm-LockedEdit {
    Require-Manifest
    Invoke-Checked 'node' @((Join-Path $tools 'locked-edit-gate.mjs'))
}
function Require-Manifest {
    if (-not (Test-Path $propsPath)) {
        throw "Missing live render-props.json: $propsPath. Do not generate synthetic replacement timing."
    }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node 24 must be installed and on PATH. Use the established Episode 01/02 Windows environment.'
}
Push-Location $studio
try {
    switch ($Stage) {
        'Status' {
            Show-SourceStatus
        }
        'Repair' {
            Confirm-LockedEdit
            $patcher = Join-Path $tools 'apply-v9-rescue.mjs'
            Invoke-Checked 'node' @($patcher)
            Invoke-Checked 'node' @($patcher,'--apply')
        }
        'Validate' {
            Show-SourceStatus
            Confirm-LockedEdit
            Invoke-Checked 'node' @('--test','src/v2/episodes/in-this-town-02/tools/locked-edit-gate.test.mjs')
            Invoke-Checked 'node' @('node_modules/typescript/bin/tsc','--noEmit')
            Invoke-Checked 'node' @('src/v2/episodes/in-this-town-02/tools/rescue-continuity-test.mjs')
            Invoke-Checked 'node' @('scripts/episode02-director-preflight.mjs','--strict')
            Invoke-Checked 'node' @('scripts/episode02-style-preflight.mjs')
            Write-Host 'Offline checks passed. Motion, framing and audio have NOT been visually approved.' -ForegroundColor Yellow
        }
        'Stills' {
            Require-Manifest
            Invoke-Checked 'node' @('src/v2/episodes/in-this-town-02/tools/three-frame-gate.mjs','--shots',$Shots)
            Write-Host "OPEN EVERY PNG in $out\three-frame-review BEFORE rendering the moving clips." -ForegroundColor Yellow
        }
        'Clips' {
            Confirm-LockedEdit
            $exactShots = & node (Join-Path $tools 'review-inputs.mjs') $Shots
            if ($LASTEXITCODE -ne 0 -or -not $exactShots) {
                throw 'Render and inspect the current start, middle and end PNGs for the same shots first.'
            }
            Write-Host 'Continuing assumes the three-frame PNGs were directly reviewed. No automatic artistic approval is claimed.' -ForegroundColor Yellow
            $params = @('scripts/episode02-render.mjs','preview','--shots',([string]$exactShots))
            if ($Force) { $params += '--force' }
            Invoke-Checked 'node' $params
            Write-Host "Review rendered moving MP4 clips at $out\preview-segments" -ForegroundColor Yellow
            Write-Host 'Do not mark the rescue complete from a successful exit code.'
        }
    }
}
finally {
    Pop-Location
}
