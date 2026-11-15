param([string]$ProjectRoot = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
$destination = Join-Path $ProjectRoot 'studio\out\handoff'
$temporary = Join-Path ([IO.Path]::GetTempPath()) ('v2-chat-context-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $destination,$temporary | Out-Null
try {
    $files = Get-Content (Join-Path $ProjectRoot 'LOCAL_UPDATE_FILES.json') -Raw | ConvertFrom-Json
    foreach ($relative in $files) {
        if ([IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[\\/])\.\.?([\\/]|$)' -or $relative -match '(^|[\\/])\.env' -or $relative -match '(^|[\\/])(out|backup|node_modules|\.git|private)([\\/]|$)' -or $relative -match '\.(mp3|wav|mp4|mov|zip|enc|bundle)$') { throw "Excluded context path: $relative" }
        $source = Join-Path $ProjectRoot $relative
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing source: $relative" }
        $target = Join-Path $temporary $relative
        New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
        Copy-Item -LiteralPath $source -Destination $target
    }
    $archive = Join-Path $destination 'WhatIfCatsV2_ChatGPT_Source.zip'
    Compress-Archive -Path (Join-Path $temporary '*') -DestinationPath $archive -Force
    Write-Host "Source context saved: $archive"
    Write-Host 'Upload this ZIP and your latest review MP4 to the new chat. Paste CHATGPT_CONTINUATION_PROMPT.md.'
    Write-Host 'Runtime audio caches, secrets, private references and third-party media are not included.'
} finally {
    Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
}
