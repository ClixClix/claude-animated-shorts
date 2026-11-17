# Episode 02 — visual QA error ledger

Last updated: 2026-11-17 05:01 ET (10:01 UTC)
Branch: `v2-local-render`
Baseline full-run: [GitHub Actions 44054485541](https://github.com/ClixClix/claude-animated-shorts/actions/runs/44054485541), commit `2a3cabe`.
Coverage at this checkpoint: actual 540×960, 30 fps rendered footage of shots **46–60** (15/60 shots), using the downloaded `episode02-shard-3` ZIP (artifact `14318205088`). Three representative samples per shot plus eight additional temporal samples for shots 49, 50, 58 and 59. This is NOT a full-film artistic approval. Shots 1–45 and the stitched full movie remain unreviewed pending other shards and assembly.

## Open defects

| ID | Severity | Status | Shots / exact timeline | Reproducible visual evidence | Verified cause vs hypothesis | Required action |
| --- | --- | --- | --- | --- | --- | --- |
| E02-001 | HIGH | UNRESOLVED | Shot 58, frames 3645–3719, **121.50–124.00s**; also shot 59, frames 3720–3800, **124.00–126.70s** | Large green plant occupies lower-left ~1/3 of frame; Mocha's intended hesitant approach is **not visible at all in shot 58**. It still intrudes through ~shot59 1.9s. | **Verified:** real frames show obstruction; `Episode.tsx` tries `foregroundPlant.visible=false` for 58–60. **Likely technical cause (not yet rerender-verified):** Episode 01 `batchCafe` merges opaque plant meshes into static render geometry before the fixture is hidden, so changing the original fixture's visibility cannot hide the baked copy. | Preserve Episode 01 source geometry; exclude the plant from Episode 02's static batch or use a camera with no occlusion. Require fresh 58–60 footage and then a complete 60-shot rerender. |
| E02-002 | HIGH | UNRESOLVED | Shot 59, frames 3720–3800, **124.00–126.70s**, especially +1.18s to +1.52s | Mocha appears perched on or immediately above the left box flap before joining Essie and Latte; movement is visually abrupt in sampled actual frames. | **Verified:** conspicuous perch in sampled rendered images. **Hypothesis:** `timeline.ts` jump Y arc / horizontal clearance and very wide `cameraDirector.ts` lens are not synchronized with the actual box rim and paw contact. | Verify continuous jump trajectory and paw/rim contact, correct staging while keeping Mocha last, and rerender. |
| E02-003 | MEDIUM | UNRESOLVED / EDITORIAL REVIEW | Shots 46–48, frames 2817–3029, **93.90–101.00s** | Three successive 2.5s / 2.3s / 2.3s views show nearly the same alley box, tall blue wall and partially hidden Mocha; little visible performance change in sampled footage. | **Verified:** near-identical sampled compositions. **Unknown:** whether deliberate suspense pacing succeeds in full continuous movie. | Review as moving sequence with surrounding shots; shorten or vary staging if story beat is not readable. |
| E02-004 | MEDIUM | UNRESOLVED | Shots 49–52, frames 3030–3290, **101.00–109.70s** | Mocha's grey face is partly cut off at the right edge of the box/wall in multiple frames; shot 49 moves from peeking behind wall to a head-only box view, making body/paw action difficult to read. | **Verified:** actual frames show partial head occlusion. **Hypothesis:** narrow alley camera axis, tall wall, and shrinking actor pose obscure intended feline interaction. | Check moving footage and preserve legible paws, head and box contact with an appropriate 3/4 angle. |
| E02-005 | MEDIUM | UNRESOLVED | Shots 56–57, frames 3483–3644, **116.10–121.50s** | Cats are tiny relative to the tall 9:16 frame and exterior; the instructional sign is not comfortably legible in the contact sheet. | **Verified:** small on-screen character/sign presentation in 540p frames. **Unknown:** exact readability at native 1080p. | Review at phone-size presentation; adjust portrait framing/sign typography if needed, without inventing new story text. |

## Technical and coverage status

- Full-run **44054485541**: at this checkpoint shard 3 **success**, shards 0–2 **in progress**, assembly **not started**. Shard 3 passed `npm run episode2:code-audit`, dependency install, FFmpeg, and actual 15-shot Remotion render. No technical failure seen in this shard.
- Prior short-run **44052420185**: **success**, but the finale footage remains artistically rejected. The present shard independently confirms the obstruction.
- Previous full-run **44054320141**: **failure** before the corrected FFmpeg setup; fixed in workflow at commit `2a3cabe`, but the full new run must complete to verify end-to-end.
- The complete **3876-frame / 129.2s** MP4, 180 sampled frames, and 60-shot board are **not yet available**. Do not claim full-film pass.
- Approved Episode 01 final MP4 has not been confirmed available for side-by-side cloud comparison. Source asset reuse is not a substitute for visual parity.
- This is an authorized **silent** scratch render. No original narration, SFX or music was provided/approved for this pass; audio quality cannot be judged and silence is not classified as a render defect.
- Current open visual findings: **5**; visually verified fixes: **0**. A future full-episode review may add defects.

## Next cycle

1. Check run 44054485541 jobs/artifacts. Download and review shards 0–2 and the assembled complete movie when available.
2. Compare all 60 shots, movement and scene continuity; update this ledger with precise frames.
3. Apply minimal source fixes only after the complete visual review, then trigger a fresh **entire 60-shot** rerender and verify it, not only isolated clips.
4. Prepare native 1080×1920 complete render only after 540p visual review and fixes.
