# In This Town — A Little Light

Eight-second silent animation test: 1080 × 1920, 30 FPS, 240 frames.

Approved café and adult character checkpoint: `08b67e6`. Development branch:
`v2-a-little-light-animation`. Those files remain locked. Root only gains one composition.

## Source

- `timeline.ts`: pure frame-to-state evaluation; shots 0–44, 45–104, 105–164 and 165–239.
  Eased anticipation, action, contact, release and holds are deterministic in random-access renders.
- `kitten.ts`: original story visitor, separate from the three locked adult drawings. Same plum
  ink / Canvas / Three card idiom. Eyes, ears and mouth interpolate continuously. The initial
  step uses world-space foot targets projected onto the upright card for planted-toe IK.
- `acting.ts`: animation-only adapters around the existing Essie drawing, plus an articulated
  two-bone reaching foreleg. Registered expressions blend without changing identity/markings.
- `ALittleLight.tsx`: uses the approved CafeEnvironment factory, original practical lights,
  materials and the same ink/lens/bloom/tone-map/grade settings. No café reconstruction.
- `timeline.test.mjs`: determinism, cut continuity, cup support/footprint, exact contact, no
  idle drifting, safe aisle route around tables/chairs, and a locked-source regression check.
- `evidence.py`: boards from real rendered PNGs or frames decoded from the final video.

## Intentional story motion

The existing mug, saucer and drink surface are staged at the back edge of the existing serving
counter. They slide 0.355 m; their base remains at y=1.12 m. During movement, the paw remains
tangent to the cup body, then holds contact briefly before withdrawing. There is no cup rotation,
scaling, teleporting or post-release drift.

The existing entrance leaf opens and closes through an animation-only hinge; source geometry,
jambs and façade remain unchanged. The kitten takes a hesitant step, enters around the two
customer tables/chairs, and hops onto the serving counter late in shot 2. Its approach is a brisk
shelter-seeking trot compressed into this short test. Cuts do not reset world positions.

Essie deliberately advances 0.32 m along her existing barista riser during reach anticipation.
This is a support-bound action, not idle drift. Both kitten and cup stay anchored during the
payoff. Mocha and Latte keep their original placements and subdued idles. No new background
objects, narration, music or SFX are introduced. Steam is a transient effect above the warm cup.

## Production gates (run from studio)

```sh
npm run typecheck
node src/v2/animation/timeline.test.mjs
node scripts/v2-animation-render.mjs storyboard
/workspace/.venvs/animated-shorts/bin/python src/v2/animation/evidence.py gate-a
# Inspect actual keyframes, then record a source-hash-bound technical Gate A review.
node scripts/v2-animation-render.mjs motion
/workspace/.venvs/animated-shorts/bin/python src/v2/animation/evidence.py gate-b
# Inspect consecutive motion frames, then record a source-hash-bound Gate B review.
node scripts/v2-animation-render.mjs full
/workspace/.venvs/animated-shorts/bin/python src/v2/animation/evidence.py final
```

Review JSONs are agent technical reviews, not user creative approval. The full renderer refuses
missing/stale reviews. Gate B clips use 540 × 960 / 30 FPS; the final is native 1080 × 1920 / 30 FPS.
Chromium defaults to `/usr/bin/chromium`, overridden via `CHROME`. Original/private photos are
not used as textures. No AI images or V1 code are used. Stop at the silent test for visual approval.
