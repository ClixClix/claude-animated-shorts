# Episode 02 — isolated articulated shot-01 performance proof

Status: **SOURCE IMPLEMENTED, NOT RENDERED OR ARTISTICALLY APPROVED**, November 17, 2026.

The user explicitly rejected the third 6.1-second pilot. It had the cat jumping through/behind the bus shelter at x≈-4.4, a flat head above an oval body in shots 02/03, and witnesses blocked by scenery. None of the prior four shots is approved. See `THIRD_RENDER_REJECTION_AND_RESTART.md`.

## What was actually rebuilt

- New `articulatedGuest.ts`: reusable **separate** Episode 01 `drawCat` painted head, torso, four fore/hind paws, and independent tail. Every segment has its own mesh/texture/pivot and a pure random-access absolute-frame pose evaluator. This replaces the single-card transform used in the rejected pilot for the **isolated shot-01 proof only**. Reuses the consistent town guest palette through `getRuleGuestDesign('hazel')`. Mocha, Essie and Latte assets were not modified.
- New `SHOT01_PERFORMANCE_BLUEPRINT.json`: 78 frames (2.6s), 30fps, 1080×1920, four explicit phases: grounded walk, four-paw anticipation/crouch, lifted jump with **horizontal movement delayed until feet clear the cardboard rim**, landing and settling. Stage at [1.8,.04,5.35] outside the Episode 01 café by the entrance; not the bus shelter or central lamp. Camera [1.48,1.67,9.85] aimed at [1.42,.81,5.35]. All coordinates are **hypotheses awaiting real render**.
- New `Shot01Performance.tsx`: independent Remotion composition `InThisTownEpisode02Shot01Performance` in Root, same Episode 01 world and shader/grade. Only one original-sized physical demo box, left open during the jump. No narration, dialogue, music or other paid services. The previous `Episode02Part1` is intentionally unchanged and rejected.
- New `episode02-shot01-performance.mjs` and Windows `Build-Episode02-Shot01.cmd`: TypeScript preflight, ten actual rendered frames, static occupancy checks, sight-line raycasts, explicit physical rim-crossing check, image boundary check. **If any of those issues appear, do not encode a video**; save PNGs and QA report for targeted correction instead. If all checks pass, encode one 78-frame MP4. The QA still cannot determine artistic quality on its own.

## How to run on the user's Windows machine

From PowerShell:

```powershell
cd C:\V2
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Update-Local-Code.ps1
cd C:\V2\studio
node scripts/episode02-shot01-performance.mjs
```

Or double-click `C:\V2\Build-Episode02-Shot01.cmd` after sync.

Outputs:
`C:\V2\studio\out\v2-episodes\in-this-town-02\shot01-performance\`

- `frames\shot01_000.png` through `frames\shot01_077.png` (10 selected real frames, not every frame);
- `SHOT01_PERFORMANCE_QA.json` has per-frame skeletal pose, contacts, and scene-obstruction findings;
- `SHOT01_PERFORMANCE_PREVIEW.mp4` appears **only if** automatic static blocker and framing checks pass; if absent, inspect the JSON and stills first.

Run `--native` only after the lower-resolution motion proof is visually accepted. Runs never spend money or publish.

## Hard quality limits and next iteration

This is the FIRST actual architectural improvement, **not a guarantee of Episode 01 quality**. It replaces the single-card actor with seven independent illustrated sections and measured jump stages, but the feet and torso still use an approximate 2.5D articulated puppet. A creative human has not viewed the output yet. No physical game-engine collision solver or semantic video-understanding autopilot has been installed.

The final single-prompt system still needs reusable actions beyond walk/crouch/jump/land (especially a visible cat→cardboard surface morph and rescue interactions), automated set placement and camera planning from story specifications, an execution agent to render and watch its own MP4, iterative correction, approved speech/music, audio mastering, copyright review, and a final publishing permission gate.

**Required next milestone:** inspect the actual shot-01 MP4 and QA frames. If it fails, correct the rig or staging; do not repeat four-shot attempts. Once it passes, extend the rig to shot02 (curl) and shot03 (true transformation) and the separate witness group performance for shot04. The user wants the quality bar defined by Episode01, not a technically runnable prototype.
