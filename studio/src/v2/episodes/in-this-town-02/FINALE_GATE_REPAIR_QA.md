# Finale gate repair — exact Windows diagnostics

Source QA PASS; VISUAL_REVIEW_PENDING. No full scene/video rendered remotely.

The uploaded audit and timeline match the inspected working copy. The four failures comprise one true rim-clearance defect, one real painted-silhouette/shop overlap, and two faulty test assumptions.

- Keep every lead at the approved 1.0 scale. The old relative-size predicate required shrinking the approved cats; the corrected predicate explicitly requires all three native scales and retains the maximum box/character ratio.
- Raise only Mocha's finale arc from .70m to .76m: this clears the real .59m rim before lateral overlap. Landing coordinates and timing are retained.
- Move Essie .15m left inside the alley box and through the connected tumble/landing. Mocha and the physical box do not move. Their center spacing becomes .63m; the scene continuity check retains grounded contact and separate face clearance rather than the previous overly wide .70m minimum.
- Source-only Canvas alpha measurement of original drawCat/bridgeActor over every live alley frame gives maximum painted right extents .53615m (Mocha) and .48088m (Essie). Use outward-rounded .55m/.50m bounds with source hashes, instead of treating the entire transparent texture as opaque .67m. Re-measure if any contracted art or pose source changes. No AI art or substitute assets. Canvas measurement dependency was isolated outside the project; no new runtime dependency.
- Evaluate the actual 62-segment, 3737-frame narration edit, combine suffixed segments for each beat, and sample every jump frame. The previous three time samples missed staggered peaks. Keep all 60 beat IDs required.

Validation: TypeScript PASS; strict motion audit29/29; director60 beats/zero issues; Episode01 source style25/25 (reference movie NOT_SUPPLIED); exact uploaded corrected box test1470 assertions; finale27/27; scene spatial regression PASS; locked-edit tests10/10. Negative controls reject reintroduced facade overlap, low jump and miniature actor. Installer dry-run, exact-upload backup/apply, idempotent rerun and rejection of subsequent local source edits PASS.

The scene-local installer explicitly updates the existing scripts/episode02-finale-audit.mjs after backing up the exact uploaded original. This is a test compatibility repair, not a replacement renderer or removed quality gate. It also changes timeline.ts and scene continuity test, and creates the measured-bounds contract. It preserves audio, word timings, cached renders, shared source, artwork, café geometry, box geometry and camera source.

Next: install guarded patch locally; run original production checks; render and directly inspect start/middle/end PNGs for50,51,52,60, then moving interactions before full-film production. User Windows execution and new visual quality are not certified by these CPU tests. Prior QA notes about these four blockers are superseded by this repair, not by visual approval.
