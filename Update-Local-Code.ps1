param([string]$ProjectRoot = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$tempFolder = Join-Path ([IO.Path]::GetTempPath()) ('v2-code-' + [guid]::NewGuid().ToString('N'))
$archive = Join-Path $tempFolder 'source.zip'
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null
try {
    Write-Host 'Downloading the latest ChatGPT code update...'
    Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/ClixClix/claude-animated-shorts/archive/refs/heads/v2-local-render.zip' -OutFile $archive
    Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $tempFolder 'expanded')
    $sourceRoot = (Get-ChildItem (Join-Path $tempFolder 'expanded') -Directory | Select-Object -First 1).FullName
    $files = Get-Content (Join-Path $sourceRoot 'LOCAL_UPDATE_FILES.json') -Raw | ConvertFrom-Json
    $backupRoot = Join-Path $ProjectRoot ('studio\backup\code-updates\' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
    $oldLock = Join-Path $ProjectRoot 'studio\package-lock.json'
    $oldHash = if (Test-Path $oldLock) { (Get-FileHash $oldLock -Algorithm SHA256).Hash } else { '' }
    # Explicit source-only list. Never update caches, private assets, local secrets or Git data.
    foreach ($relative in $files) {
        if ($relative -match '(^|[\\/])\.\.?([\\/]|$)' -or $relative -match '(^|[\\/])\.env' -or [IO.Path]::IsPathRooted($relative)) { throw 'Invalid update path.' }
        $allowed = $relative -match '^studio/(src|scripts|assets)/' -or $relative -match '^studio/(package(-lock)?\.json|tsconfig\.json|remotion\.config\.ts)$' -or $relative -match '^[^/\\]+\.(cmd|ps1|md|json|txt)$'
        if (-not $allowed) { throw "Update path is outside the source list: $relative" }
        $from = Join-Path $sourceRoot $relative
        $to = Join-Path $ProjectRoot $relative
        if (-not (Test-Path $from -PathType Leaf)) { throw "Missing source file: $relative" }
        if (Test-Path $to -PathType Leaf) {
            $backup = Join-Path $backupRoot $relative
            New-Item -ItemType Directory -Path (Split-Path $backup -Parent) -Force | Out-Null
            Copy-Item -LiteralPath $to -Destination $backup
        }
        New-Item -ItemType Directory -Path (Split-Path $to -Parent) -Force | Out-Null
        Copy-Item -LiteralPath $from -Destination $to -Force
    }
    $newHash = (Get-FileHash $oldLock -Algorithm SHA256).Hash
    if ($oldHash -ne $newHash -or -not (Test-Path (Join-Path $ProjectRoot 'studio\node_modules'))) {
        Push-Location (Join-Path $ProjectRoot 'studio')
        try { & npm.cmd ci --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' } } finally { Pop-Location }
    }
    Write-Host 'Code updated. Renders, narration caches and private assets are unchanged.'
    Write-Host "Previous source files were backed up under $backupRoot"
} finally {
    Remove-Item -LiteralPath $tempFolder -Recurse -Force -ErrorAction SilentlyContinue
}
