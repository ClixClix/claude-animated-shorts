param(
    [ValidateSet('All','Status','Smoke','Render','Assemble','Audio','QA')][string]$Stage = 'All',
    [ValidateRange(1,4)][int]$Concurrency = 2
)
$ErrorActionPreference = 'Stop'
$stageArgument = $Stage.ToLower()
& node (Join-Path $PSScriptRoot 'studio\scripts\produce-episode.mjs') $stageArgument '--concurrency' $Concurrency
if ($LASTEXITCODE -ne 0) { throw "Episode stage failed (exit $LASTEXITCODE). Completed shots are preserved; fix the reported issue and run the same command again." }
