> **HISTORICAL ROADMAP (16 Nov), NOT CURRENT PRODUCTION TRUTH.** Read [PRODUCTION_DIRECTOR_LOCK.json](PRODUCTION_DIRECTOR_LOCK.json), [AGENTS.md](../../../../../AGENTS.md), and the actual live renderer/timeline. Its old pilot scope and storyboard cannot override the user's new 60-beat direction.

# Episode 02 — Part 1 source implementation and one-prompt roadmap

## Status (2026-11-16)
**Implemented in source, not locally executed or visually approved.**
The former 60-shot Episode 02 prototype is rejected (see REJECTED_RENDER_AUDIT.md). The new isolated composition **InThisTownEpisode02Part1** exists only for the first approved four shots (frames 0–182, 6.1 sec, 30 fps). It uses Episode 01's EpisodeWorld, TownPopulation supporting-cat illustration, ink/grade/shader parameters, contact shadow and paw rig. It does not replace lead cats, reset furniture or touch the Episode 01 composition.

The original 60-shot story/script remain locked; approved cure order is **Essie first, then Latte**. The new pilot does not alter the plot.

## Actual four-shot blueprint
The source of truth is PART1_SHOT_BLUEPRINT.json. Change shot blocking/camera data there, rather than adding arbitrary per-shot camera patches to the rejected timeline. Its changes invalidate the preview renderer's source cache.

| Shot | Frames | Visible beat | Non-negotiable |
| --- | --- | --- | --- |
| 01 | 0–26 | Anonymous Episode 01 supporting cat's two paws reach over rim of SMALL cardboard box on café-front sidewalk | Box and paws in one readable frame, no hero-cat stand-in |
| 02 | 27–62 | High three-quarter curl into same hollow box and passage of time | Cat face visible; 2.5D card is NOT observed straight overhead |
| 03 | 63–107 | Cardboard folding/transition over cat silhouette into SAME physical small box | No duplicate box, protagonist does not merely teleport behind giant cardboard |
| 04 | 108–182 | Distinct town supporting cats examine box; no cure is shown | Café/town geography recognizable, one guest reaches a flap |

Pilot deliberately has no story narration or fabricated word captions. It is a silent **visual proof**, not publishable content.

## One-command local test (Windows)
1. With the previous render closed, double-click C:\V2\Sync-and-Open.cmd to receive the v2-local-render branch, or use the normal local sync procedure.
2. Double-click C:\V2\Build-Episode02-Part1.cmd **or** run:

   cd C:\V2\studio
   node scripts/episode02-part1.mjs

3. Find results under:
   C:\V2\studio\out\v2-episodes\in-this-town-02\part1-pilot\

   - Part1_01-04_PREVIEW.mp4 — 540×960, six-second actual animation.
   - frames\01_20.png through frames\04_80.png — 12 actual rendered scene images.
   - PART1_RENDER_STATUS.json — camera visibility and actual-world blocker samples. A nonzero exit with saved output can mean the system detected a visual warning.

Use --native to generate 1080×1920 once preliminary staging passes; --stills-only to skip expensive video; --video-only to skip stills; --force to re-encode without cache.

**Upload the MP4 and four 50% frame stills** for the first visual approval pass. This chat cannot see inside the user's local renderer without those uploads. Do not run a full Episode 02 build based on this pilot until all four rendered shots pass.

## Actual pass/fail criteria
1. Same Episode 01 illustrated dark-plum ink, soft character shading, fixed town geometry and lighting.
2. Demo cat looks like a supporting town cat, NOT Mocha/Essie/Latte. No new principal character design.
3. Box measures **1.05 × 0.91 × 0.47 world units**; it must remain SMALL relative to the standing guest and not fill the screen.
4. Feet and paws contact box rim/floor. No floating limbs, no box wall intersection.
5. Cat, face, and box visible throughout the magical change; one physical box, no duplicated cat.
6. Camera in front of actors, not inside storefronts; no major subjects cropped by 9:16 framing.
7. Shot 04 has enough visual information to tell that the town is confused, without presenting the cure.
8. Check **actual rendered frames**, not generated conceptual images. Fix any failed shot before proceeding to 05–10.
9. This pilot has no final voice, timing changes, or audio mastering. Film-scale QA remains deferred to the assembled movie.

## Final goal: one natural-language production prompt

The production system should eventually accept a high-level request such as:
> Make the next In This Town episode from this approved story. Use the Episode 01 locked character/café art and the current production contract. Produce all 9:16 shots with visual and motion QC, original cleared Foley/music, approved narration, and deliver the final MP4 and QA report. Never publish or pay for outside services without authorization.

To make that possible, we need **repeatable components** rather than 60 custom hand-coded shots:
- **Story compiler**: takes a structured script and storyboard, produces a shot blueprint like PART1_SHOT_BLUEPRINT.json, with bounded camera, support-surface and continuity requirements.
- **Character/prop choreography library**: named actions (walk, curl, lift flap, paw contact, transform, rescue, hug), not arbitrary mesh movement. Reuses Episode 01 rig and designs.
- **Set-based cinematographer**: known safe camera slots and real rendered-frame occlusion detection (including wall/furniture/box flap visibility), not only theoretical 3D bounding boxes.
- **Local production runner**: runs the preview/render automatically on a machine with installed Node, Remotion, Chrome/Edge, ffmpeg, permissions and available compute. Saves shot video, actual contact sheets and automated quality reports.
- **Correction loop**: an agent capable of looking at those saved frames, proposing source edits and re-rendering failed shots before final assembly. **This loop is not autonomous in this current chat**; the user still needs to sync/run locally and share footage. Codex or another local execution environment can later bridge that gap.
- **Final audio/publish gate**: only after visual shots pass; requires licensed music and explicit separate paid narrator authorization, and checks actual encoded audio/visual output.

This source implementation makes the first step **data-driven** (shots, cameras and constraints in JSON) and adds a one-command runner. It **does not yet constitute a one-prompt autonomous full-film maker**. Do not claim an automated full-film quality pass until the local rendering and image-inspection loop is truly connected and tested.

## Reference
- Source: Episode01 DoorAt1111 world, population, character rig, grade.
- Quality standard: repository QUALITY_BASELINE.md.
- Story truth: DRAFT_BOX_SHOT_LIST.md and DRAFT_BOX_NARRATION.txt.
- Old failure audit: REJECTED_RENDER_AUDIT.md.
