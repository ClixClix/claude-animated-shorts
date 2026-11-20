# Current Windows scene repair — November 20, 2026

Status: VISUAL_REVIEW_PENDING. Source repair, not a visually approved film.

Based on the uploaded EP02-current-scene.zip, not the older GitHub scene. Targets 06, 07A, 07B, 49, 50, 51, 52 using the supplied live 3737-frame edit.

## Changes

- Preserve the original Episode01 drawing and uniform scale through these seven segments; stop cropped-anatomy rest-texture crossfades and remove unsupported lifting offsets.
- Raise paws above the intact rim before crossing, then settle onto the cardboard bed.
- Preserve every box wall and flap. Stage the invitation flap flat outside; compensate the rescue flap hinges as the complete carton tips, avoiding flaps rotating into the pavement.
- Keep the rescue camera on one axis, widen the walk-by, follow the initial jump, and maintain landing continuity. Separate the two original faces with a supported inward lean.
- Accept the actual V9 EpisodeWorld(false) constructor in the source test; preserve that mutable-world behavior. Keep equivalent constructor wiring readable by the established style audit.

## Validation executed

- TypeScript --noEmit: PASS.
- Locked-edit selection/consistency tests: 10/10 PASS.
- Director static audit: 60 beats, zero reported blockers.
- Episode01 source style check: 25/25 PASS; reference movie NOT_SUPPLIED.
- Scene spatial regression: PASS, 739 assertions; seven actual live segments sampled. Tight-frame warnings remain for 07 and 52 and require local pixel inspection.
- Guarded installer: dry run, apply with original-file backups, idempotent rerun, rejection of subsequent local edits: PASS in an isolated copy of the uploaded source.
- The broad code audit FAILS its existing exact mesh-count expectation: it expects 55 Latte meshes from a different remote geometry revision. The uploaded boxProps.ts is preserved byte-for-byte. This pre-existing audit mismatch is NOT disabled or claimed passed. Shared audit scripts were not edited.

## Local review still required

No cloud scene rendering, paid voice calls, audio edits or full-film rendering was performed. The uploaded 21 original PNGs show the defects; they are not proof of this repair. Render new start/middle/end PNGs locally and inspect all 21, then review actual moving clips before a full-film render. These changes do not certify all remaining Episode02 shots.

## Installation

Run tools/apply-current-scene-fixes.mjs from your actual studio. Without --apply it checks exact uploaded-file hashes and writes nothing. With --apply it backs up the five changed source/tool files beneath this episode output directory, verifies all known before/after hashes, and installs the repair. It refuses newer/unrecognized source. It never overwrites narration, props, artwork, existing renders or box geometry. CURRENT_SCENE_VISUAL_FIXES.patch documents the exact changes against the uploaded baseline.

Use the existing three-frame-gate.mjs --shots 06,07,49,50,51,52, then inspect every PNG. Use the existing review runner Clips stage only after that review. Do not run its legacy Repair stage; that targets the earlier unpatched V9 baseline.

## Follow-up on submitted PNGs

Attachments appear in end/middle/start order; do not infer backwards motion or cure disappearance from that ordering. The confirmed shot51 middle-image flaw is the flap crossing the cats. apply-rescue-clearance-fix.mjs advances their forward clearance before the rear flap rises across the upright artwork. Only timeline.ts changes, with the same final positions and constant scale. Exact-prior-source install and TypeScript/spatial checks pass. New shot51 PNGs and moving review are pending.

## Clipping-only walk-by correction

Move Mocha's shot07B path clear of the complete front flap, including the camera-facing card's lateral depth. Limit its endpoint to keep the existing camera framing. No other shot or camera changes. 101 sampled walk-by states now check full-card clearance; source regression and TypeScript pass. Guarded installer backed up and applied successfully to the preceding exact source in a fixture. Local shot07B start/middle/end PNGs and moving preview remain required.

## Alley side-flap clearance

The outstretched side flaps extend beyond the narrow alley. The scene-local correction keeps both real side-flap hinges upright during alley beats32–52, retaining every panel and the existing box size. Front/back rescue hinge compensation, actor paths, cameras and café shots are unchanged. TypeScript, spatial regression and guarded-install fixture pass. Alley start/middle/end PNGs and moving tip review remain pending. The submitted JSON lists only07B, so it does not document fresh alley renders.

## Native-build action gate

The submitted Windows log stops at strict action evidence: Essie shifts only .10m against a .14m minimum, and the finale .62m arcs can miss the .65m sampled vertical requirement. Increase the supported in-box shift to .16m and only the three finale arcs to .70m, retaining timings and landing coordinates. TypeScript, the connected strict action audit (29 checks) and source spatial regression pass; the Windows log uses an older 25-check audit. Installer fixture passes. Visual review of07A/07B and60 remains pending. This does not resolve the separately documented legacy box-count audit mismatch.

## Production box-test compatibility

The existing build test expects55 Latte meshes and42 stripe meshes from an older box implementation; the approved uploaded box has29 meshes (13 structural and16 printed stripe meshes). The explicit repair-box-test-contract.mjs command backs up only scripts/episode02-box-tests.mjs and adjusts the named geometry expectations to three bands per wall plus four floor bands. It preserves all structural, fixture, finite-vertex and hinge assertions and adds floor-stripe verification. The corrected existing test passes1467 assertions. Guarded install fixture passes. No visual assets change.

Preflight of the following finale audit still reports four blockers in the connected checkout (relative-size predicate, premature rim crossing, sparse jump samples and facade clearance). This box-test repair does not change or bypass that audit. Verify the actual Windows version before claiming native build readiness.

## Uploaded Windows test reconciliation

The actual uploaded episode02-box-tests.mjs differs from the remote test: it expects132 total Latte meshes and119 stripe meshes. The revised guarded repair targets this exact uploaded file, changes those expectations to29 and16 for the unchanged approved box, retains every other assertion and adds per-wall/floor printed-band checks. Corrected test passes1470 assertions; exact-upload backup/apply fixture passes. Finale audit remains a separate unresolved gate; do not claim full native build readiness.
