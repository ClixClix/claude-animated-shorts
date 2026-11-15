# Current continuation status

Active delivery branch: `v2-local-render` in `ClixClix/claude-animated-shorts`. Use Git log and `CURRENT_FIX_REVIEW.md` for the latest source candidate; do not rely on historic setup completion counts.

## Active episode

**The Door at 11:11** is ready for a refreshed local review render after the current source pass. It is NOT visually approved. The uploaded baseline reviewed for this pass was `Polish_Review_d73d13af_540p.mp4`.

The requested sun/street/city/lamps/mouse/bus shelter/blackout/window/alley/nose/cafe-painting fixes are implemented in source. `CURRENT_FIX_REVIEW.md` maps each request to its behavior and states the limits of verification. Current instructions require checking work carefully; the earlier request to skip checks was temporary and superseded.

## Next action

On Windows, close Studio/video players, update the source, then run `Preview-Polish.cmd` (checks enabled). Review the version-stamped MP4 selected by Explorer against the actual requests and reference shorts. Do not claim the source candidate is a finished, visually approved episode before that playback review. No cloud scene/video rendering is authorized.

Do not start the next episode without approval or explicit new instructions. Preserve original movies, private caches, BridgeShort, narrator configuration and approved cat drawings. No new paid narration is authorized.

## Continue in normal ChatGPT

Read `HANDOFF_FOR_CHATGPT.md`, `CREATIVE_AND_QA_GUIDE.md`, `REFERENCE_QUALITY_NOTES.md` and `CHATGPT_CONTINUATION_PROMPT.md`. Use `Export-ChatGPT-Context.ps1` to create a source ZIP for a chat without connector access. Upload the latest review MP4 separately; keep runtime audio/private assets on the local PC. New chats do not automatically inherit tools, files or this conversation. Use `EPISODE_BRIEF_TEMPLATE.md` for an approved next episode.

The source-export script targets PowerShell 5.1. Its path/manifest behavior was reviewed, but it has not been executed on Windows in this Linux session. The current local rendering commands must not be represented as Windows-verified solely because Linux code checks passed.
