# Latest update: narration approved and generated

Read `EPISODE1_AUDIO_DELIVERY.md` first. The three approved patch calls are COMPLETE: 258 actual credits, no retries. Their 122.208s composite and original/processed caches are preserved and available via encrypted local transfer. The approval is consumed; do not request the same authorization again or regenerate missing audio. `generation-receipt.json` records the result and blocks repeat calls.

Visual synchronization of those three passages is STILL PENDING. Existing lamp/pan source fixes are delivered, but the active movie/edit retains old narration. Actual timing and the 19 written shot directions are ready in `timed-storyboard.json`. Finish the remaining focused staging locally using the exact source-change map, preserve the working old composition, and do not claim completion based on audio QA. The user has low usage and wants only small changes.

Earlier pending-approval text below describes the frozen pre-generation proposal and is superseded by this update.

---

# Active task: Episode 1 story polish (2026-11-15)

The user says this is already very good and wants VERY SMALL changes. Prioritize the remaining lamp placement/occlusion and missing window-to-door pan; preserve everything else that works. Usage was reported at 8%, so finish/deliver essentials before additional polish.

Read `EPISODE1_STORY_POLISH_PLAN.md` and `EPISODE1_STORY_POLISH_COMPARISON.md` first. The exact revised full script and 19 written storyboard shots are prepared in `studio/src/v2/episodes/door-at-1111-story-polish/`. Three replacement narration segments total 646 characters/estimated credits; approximately 91.90s of the existing recording is retained. Full proposed script: 2,352 characters. Runtime estimate: 119.79–133.74s, not a target.

**No new paid generation is authorized.** Request approval for three exact one-time patch calls, no automatic retries, before generating anything. Do not regenerate the full recording. Keep approved Adam, natural synthesis 1.0x and offline 1.35x varispeed. All old caches/movies stay intact. New provider alignment is required before revised captions/cuts/SFX and a separate revised render composition can be completed.

Additional user steering: Latte follows the mouse into the DARK existing alley beside the cafe. Streetlamps must form orderly curb rows and not block subjects. Restore the pan on “It moved toward the door.” The latter lamp/pan source fixes are implemented independently in the existing polish composition; their latest technical result is recorded below/in CURRENT_FIX_REVIEW.md. They do not activate the proposed new narration.

Technical checks completed: TypeScript/regressions, curb placement, all 3,349 geometry/character-alpha states and five narration-plan test groups passed. Actual local playback remains pending.

Checkpoint before this pass: `checkpoint/episode1-before-story-polish-20261115` at `5b8892f`. Active delivery remains `v2-local-render`. Normal-chat continuation must honor this newer task rather than restarting the earlier visual pass. No cloud video rendering.

---

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
