# Read first: What If Cats V2 continuation

## Current status and authority

The active episode is **The Door at 11:11**. Its original silent/native episode is preserved. The separate `door-at-1111-polish` composition is the active review candidate. The user has NOT approved its final visuals. Do not start another episode until this one is approved, unless explicitly instructed otherwise.

Current delivery branch: `v2-local-render` in `ClixClix/claude-animated-shorts`. Editing worktree may use another local branch; push only the intended source update to that delivery branch. Never overwrite another session's changes: fetch and inspect differences first.

The user renders on Windows at `C:\V2`, using Node 24.x, Python 3.12, FFmpeg/ffprobe, Chrome, Ryzen 5950X, RTX 4070 Ti, 32 GB RAM. Use concurrency 2 initially, 1 for diagnosis. No cloud scene/video rendering is authorized. Source inspection, builds, CPU Canvas tests and geometry checks are allowed. The most recent instruction is to check work carefully; an earlier temporary request to skip checks is superseded.

The current uploaded review is `Polish_Review_d73d13af_540p.mp4`, 111.63 seconds. Review the actual attached movie if available. Contact sheets are useful for staging but do not prove motion quality. Another chat does NOT automatically inherit attachments, local caches, credentials, tool access or this conversation.

## First actions for the next chat

1. Read this file, `CONTINUATION_STATUS.md`, `CREATIVE_AND_QA_GUIDE.md`, `CHATGPT_CONTINUATION_PROMPT.md`, and `POLISH_REVIEW.md`.
2. Inspect Git status/log and the actual source. Preserve uncommitted changes and original outputs. Historic setup documents may contain obsolete shot-completion counts; the local render metadata is authoritative.
3. Ask for the current review movie and missing runtime files only if unavailable. Do not claim to have watched unavailable footage or heard unavailable audio.
4. Restate the requested scope briefly, then implement. Maintain a per-request status record. Do not promise a final flawless run based on compilation.

## Source map

- `studio/src/v2/cats/`: approved Canvas character drawings, palettes, views and poses. Preserve the actual artwork files.
- `studio/src/v2/cafe/`: permanent cafe architecture, configuration and fixtures. Exactly one serving counter, one preparation counter, two customer tables. One world coordinate system, metres/Y-up; +Z is street/front.
- `studio/src/v2/animation/`: original eight-second test, kitten, deterministic motion.
- `studio/src/v2/episodes/door-at-1111/`: preserved original full episode.
- `studio/src/v2/episodes/door-at-1111-polish/`: active episode. `timeline.ts` owns paths/cameras/acting; `world.ts` owns shared environment extensions; `city.ts`/`cityConfig.ts` own city blocks/roads; `shelter.ts` owns supporting-cat routes; `actors.ts`/`walkingLegs.ts` adapt approved drawings; `cameraQA.ts` checks visibility; `Episode.tsx` integrates rendering; `edit.json`/`captions.json` are generated editorial data.
- `studio/src/v2/narration/config.ts`: permanent narrator and processing settings.
- `studio/scripts/door-polish-*.mjs`, `produce-polish.mjs`: offline preparation, checks, resumable rendering, assembly, finishing and QA.
- `studio/scripts/lib/polish-cache.mjs`: source/props/integrity cache identity. Never reuse stale pictures by blindly changing hashes. Compatibility exceptions must identify exact old/new source hashes and exclude every affected shot.
- `studio/src/videos/bridge/`: original working BridgeShort and rendering foundation. Preserve it.

## Local workflow

Close Studio/video players before updating:

```powershell
cd C:\V2
powershell -ExecutionPolicy Bypass -File .\Update-Local-Code.ps1
.\Preview-Polish.cmd
```

`Preview-Polish-Fast.cmd` skips offline test suites; use only if explicitly requested. It does not bypass actual render failures. Preview is 540x960, native production is 1080x1920 at 30 FPS. `Render-Polish.cmd` performs native rendering and separate finishing after approval. No command above synthesizes new narration.

Outputs: `studio/out/v2-episodes/door-at-1111-polish/`. `PREVIEW_QA.json` identifies the exact version-stamped movie. Keep old movies; validate complete clip ranges, hashes and audits before resuming. `studio/out` and private caches are NOT supplied by a normal GitHub source ZIP; the user's local installation already has them. Preserve/transfer private caches separately when moving computers.

To diagnose an error, capture the FIRST renderer error, not just `Polish stage failed`. Run the specific failing stage with one worker and save its output. Do not turn off an obstruction check to hide a staging failure.

## Narration and private assets

- In This Town: Adam `pNInz6obpgDQGcFmaJgB`, approved straight **1.35x varispeed** (tempo and pitch rise together). Earlier +5-semitone/independent-processing auditions are NOT the selected permanent preset. Use config.ts as source of truth.
- What If Cats: original Daniel `onwK4e9ZLuTAKqWW03F9`; retain recovered settings.
- Sawyer fallback and archived Darian/Adam auditions remain preserved.
- Current episode uses cached `studio/out/v2-narration/Door_At_1111_Adam.mp3` plus timestamps/metadata. Never regenerate to fix picture timing. No new paid generation is currently authorized.
- New narration requires exact script/voice/model/settings, estimated credits, explicit approval, one request unless additional calls are authorized, an attempt journal, original/processed caches, no automatic billable retries, complete playback and encoded true-peak QA <= -1 dBTP.
- Never include API keys, transfer passwords, .env, private reference photos/videos, licensed music, or private audio caches in a public commit. Local ElevenLabs secrets stay in environment variables.
- Music is private: `%USERPROFILE%\WhatIfCatsPrivate\audio\temporex-numbers-intro.mp3`. Preserve the clean-loop pipeline that excludes the later whistle. See `PRIVATE_ASSET_TRANSFER.md` and `THIRD_PARTY_ASSETS.md`. Do not fetch replacement music without authorization.

## Delivering patches from normal ChatGPT

Normal ChatGPT can write story plans and source patches. It can apply edits, render or call ElevenLabs only if its session actually has those tools/access. Otherwise provide complete files or a unified patch with exact relative paths and commands for local application. Do not invent a deployed app, uploaded ZIP or download link.

For repo delivery, update `LOCAL_UPDATE_FILES.json`. The installed Windows updater accepts `studio/src/`, `studio/scripts/`, `studio/assets/`, selected studio configs, and root .md/.json/.txt/.cmd/.ps1 files. It REJECTS `references/...`; this previously broke updates. Every added runtime module must be included. Preserve caches, secrets and private assets. Publish the intended code branch only; do not publish environments/sites automatically.

## Future episodes

Use the approved engine, not V1. Do not copy episode-specific geometry into a new permanent environment. Start with an approved script, a stable layout/prop registry, shot/beat mapping and continuity plan. Copy the existing composition/module pattern into a new episode directory and output folder, register the composition, and adapt production scripts deliberately. The current polish commands are episode-specific, NOT a universal new-episode CLI.

For every episode: script approval -> narration approval/cache -> actual timing -> actual storyboard -> critical motion/contact samples -> full preview -> visual/audio QA -> approval -> native delivery. Maximum shot length four seconds unless the user changes that constraint. Actual renders are mandatory for picture approval; AI-generated images are not animation output.

## Transfer to a normal chat without connector access

Run `powershell -ExecutionPolicy Bypass -File .\Export-ChatGPT-Context.ps1` from C:\V2. Upload `studio/out/handoff/WhatIfCatsV2_ChatGPT_Source.zip` plus the latest review MP4 to the new chat, then paste `CHATGPT_CONTINUATION_PROMPT.md`. The source ZIP follows the explicit source manifest and excludes runtime output/media, .env and private caches. Keep those runtime files locally. For another episode, fill `EPISODE_BRIEF_TEMPLATE.md` before production. The export script targets Windows PowerShell 5.1; actual Windows execution must be verified on the user PC.
