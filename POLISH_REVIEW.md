# Current polish review candidate

See [CURRENT_FIX_REVIEW.md](CURRENT_FIX_REVIEW.md) for the exact request mapping and verification limits, and [CONTINUATION_STATUS.md](CONTINUATION_STATUS.md) for the current approval state.

Close Studio and previous video players, then run each command separately in PowerShell:

```powershell
cd C:\V2
powershell -ExecutionPolicy Bypass -File .\Update-Local-Code.ps1
.\Preview-Polish.cmd
```

This is the checked preview path. The fast command remains available only when skipping offline checks is explicitly requested. No narration is generated. The current pass changes the environment, so a full refreshed preview is required; original movies remain preserved. Output is under `studio/out/v2-episodes/door-at-1111-polish/`, with the exact version-stamped movie recorded in `PREVIEW_QA.json` and selected in Explorer.

After local picture approval, `Render-Polish.cmd` performs native 1080x1920 rendering and separate audio finishing. Do not treat this unrendered source candidate as visual approval.

For another chat, run `powershell -ExecutionPolicy Bypass -File .\Export-ChatGPT-Context.ps1`, upload the resulting source ZIP and current review MP4, and paste `CHATGPT_CONTINUATION_PROMPT.md`. Runtime caches, secrets and private media stay local.
