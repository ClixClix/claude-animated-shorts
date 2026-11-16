# What If Cats V2: creative and acceptance rules

## Story

In This Town uses an intriguing town rule, an exception, escalating uncertainty, a vulnerable character, a reveal that changes the meaning of earlier clues, and an emotional payoff. Each image adds information to the narration. Never reveal the benign opener or hidden kitten before the intended reveal. Avoid filler, repeated unexplained angles and editorial silence. Keep the approved narration natural and complete; fit pictures to actual speech timing.

What If Cats main series uses conversational setup, character-driven complications and a clear comedic payoff. Do not assume the narration delivery or story grammar is identical to In This Town.

## Picture and staging

The supplied Roblox/What If reference shorts establish clarity, motion, subject hierarchy and polish; they do not authorize tracing characters or replacing the approved illustrated cats. Use actual private references when available and the repo's measured reports as supporting context. `references/reports/motion.md` supersedes the old camera-motion claims in STYLE_BIBLE.md.

- One immediately legible subject/action per shot; mobile readability first.
- Establish the location, then use motivated pans, pushes and reaction shots. Ease camera moves; match their endpoints across continuous-action cuts. No camera inside a wall, prop or character.
- Keep floors continuous, silhouettes clear, and important faces/props unobstructed. A visible center marker alone does not establish a good composition.
- World geometry must form usable streets, sidewalks, lots and alleys. No overlapping road skins, floating objects, inaccessible switches, isolated props or buildings placed in roads.
- Lighting must explain the story. Show the actual last lamp switching off; show other houses dark for a street blackout; keep the cafe exception readable. Night darkness must retain important details.
- Use a shared layout across shots, stable IDs and positions. Never move furniture to rescue a camera.
- World life is motivated: people/cats and traffic before curfew; suspense streets empty afterwards except deliberately hidden story characters.
- Warm practical highlights, cooler shadows, restrained bloom, painted materials and cinematic depth. Avoid glowing rectangular slabs or blur hiding errors.
- Cats are cats: natural supported poses, coherent eyelines, planted paws, mouth/nose interactions where appropriate, and stable proportions/markings. No rubber limbs or constant repeated scared mouth.
- Props touch their support surfaces. Contact, push, release and settling must be readable. A kitten entering must progress forward without resetting backwards across a cut.
- Only ONE subtitle word at a time, with readable outlined typography and no overlaps.

## Required review

1. Inspect actual frames across the whole movie, then consecutive frames around turns, steps, doors, interactions, reveals and cut boundaries.
2. Check source/props identity so the reviewed movie is the latest version.
3. Check TypeScript and applicable existing tests; initialize the scene and verify geometry, texture presence, camera/body clearance, actor routes and protected assets.
4. Check actual character alpha occlusion. Geometry-only checks previously missed Latte hiding the kitten and a supporting cat crossing Latte's face.
5. Check complete audio, correct voice/cache, natural pacing, synchronization, no truncation/distortion and encoded true peak <= -1 dBTP. Music mixing remains separate from rendering.
6. Review the actual final encoded movie, not just stills or a passing log. Track each user-requested correction with its shot/time, intended behavior, source change, technical verification and visual approval status.

Compilation, geometric tests, offscreen Canvas tests and contact sheets cannot prove the movie looks good. Label unrendered changes unverified. Do not promise there can be no remaining fixes. Do not call old QA reports evidence for a new source hash.

## Useful commands (from studio)

- `npm run typecheck`
- `node scripts/v2-tests.mjs` (existing regressions; no provider calls)
- `node scripts/door-polish-prepare.mjs` (cached audio/editorial preparation)
- `node scripts/door-polish-tests.mjs`
- `node scripts/door-polish-story-tests.mjs`
- `node scripts/door-polish-quality-tests.mjs`
- `node scripts/door-polish-card-tests.mjs` (CPU Canvas/frame-order/alpha checks; not a scene render)
- `node scripts/door-polish-camera-preflight.mjs` (all-frame geometry; not a scene render)

Browser-dependent scripts require an available Chrome/Edge selected by runtime.mjs (or CHROME). Windows tests/rendering must be reported honestly when only Linux checks were possible.

## Current all-series release baseline (supersedes older delivery defaults)

`QUALITY_BASELINE.md` is the release reference for **every future What If Cats and In This Town episode**. It is grounded in the completed *The Door at 11:11* final encoded MP4. The old Bridge skill's 2K export, no-caption and fixed music/SFX gain suggestions are **not** universal V2 release requirements. The two series keep distinct story rhythms; neither must copy the reference's runtime, narration style or SFX count.

After the final encoded MP4 exists, run `scripts/release_quality_gate.py FINAL.mp4 --series what_if_cats --expected-frames N --init-review` (or `in_this_town`). The checker measures actual encoded video/audio, checks the complete decode, flags black/frozen/silent intervals for human review, and writes a SHA-bound review checklist. For a publish-ready decision, run it with `--require-approval`; no human/rights approval means **not ready** even if the technical gate passes. Music licensing remains a separate explicit requirement.
