# Episode 02 — Windows local-first rendering (November 19, 2026)

**Primary working source:** the user's latest installed Episode 02 V9 scene on Windows. The v2-local-render GitHub branch currently contains older scene files; old cloud renders do not approve the latest V9. Never overwrite newer local code with the older remote version.

**Cloud preview policy:** GitHub Actions episode video workflows are manual-only. The non-video source/unit CI remains enabled.

## Safely obtain local tools

Before any sync, run git status --short at repository root. Preserve all modified or untracked files. Never use git reset --hard, git checkout -- ., or an indiscriminate git pull to obtain tools: remote Episode.tsx, timeline.ts, cameraDirector.ts, boxProps.ts and episode1Cast.ts may be older than your V9 scene.

The new helper is located at studio/src/v2/episodes/in-this-town-02/tools/Local-Episode02-Review.ps1. Obtain only that helper and any missing scene-local QA utilities from GitHub after inspecting local differences; do not automatically replace scene sources. The Phase 4 rescue patch is opt-in, backups are mandatory, and its hash guard deliberately stops on different/newer local V9 sources.

## From the existing Windows studio folder

Check exact source hashes, approved narration manifest, and local render readiness without changing anything:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\src\v2\episodes\in-this-town-02\tools\Local-Episode02-Review.ps1 -Stage Status

After the guarded V9 rescue source repair has been reviewed and applied, run source and type checks:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\src\v2\episodes\in-this-town-02\tools\Local-Episode02-Review.ps1 -Stage Validate

Render three real low-resolution start/middle/end PNGs for each live narration segment within Shots 06, 07 and 49–52:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\src\v2\episodes\in-this-town-02\tools\Local-Episode02-Review.ps1 -Stage Stills -Shots 06,07,49,50,51,52

Open every PNG in:

    out\v2-episodes\in-this-town-02\three-frame-review

Check visually: correct Mocha/Latte/Essie art; no floating disconnected ears; no scale changes; actual jumps and cardboard rim contact; no hidden faces or clipping; Essie's full four-sided box physically tips; she tumbles onto Mocha; their poses match at the transition into Shot 52.

Only when the frames have been directly reviewed, produce local moving video clips:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\src\v2\episodes\in-this-town-02\tools\Local-Episode02-Review.ps1 -Stage Clips -Shots 06,07,49,50,51,52

Review MP4s here:

    out\v2-episodes\in-this-town-02\preview-segments

If an old cached clip is suspected after inspecting the source changes, rerun Clips with -Force. The existing source and manifest hashes normally invalidate stale caches. Do not run a full episode render until each local moving shot passes.

## Approved Adam narration; no fabricated timings

The stills-first tool requires the real existing out/v2-episodes/in-this-town-02/render-props.json, approved Adam narration status, a valid 60-beat director/narration lock, and the real narrated-edit markers. It intentionally refuses silent scratch manifests. Do not replace approved local output with episode02-prepare.mjs --allow-scratch merely to make a test run.

The local audio and timing files are not present in the old cloud-render branch. If they are missing on the Windows project, stop and reconcile those existing assets; do not regenerate paid narration.

## Acceptance

- Prioritize Shots 49–52 (the intact box tips; Essie falls onto Mocha and they embrace), then Shot 06 (Latte's stable-size striped-box entry), Shot 07 (Essie invites Mocha; no blocked faces).
- Keep Episode 01 visual style, existing actor rigs, global camera and engine unchanged.
- Only scene-local changes, with real stills first and moving clips second.
- Old cloud results are a defect checklist, not a verdict on newer local V9.
- Source checks and encoding success do not certify actual visible acting, clipping, audio, or quality.
