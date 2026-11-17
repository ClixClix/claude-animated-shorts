# Episode 02 — Part 1, second real-render review (REJECTED)

**Evidence:** User uploaded the full 183-frame / 6.1-second `Part1_01-04_PREVIEW(1).mp4`, `PART1_RENDER_STATUS(1).json`, plus 12 real PNGs, 20%/50%/80% per shot. Reviewed stills and additional frames extracted from the actual MP4 across cut boundaries. Previous render's technical report confirms 4 visual warnings, including two box-flap face obstructions; no browser errors.

**Decision: Visual reject. Do not approve shots 01–04 or proceed to 05–60.**

## Actual observed defects

- **Every shot:** The original Episode 01 streetlight pole at **x=0, z≈6.05** cuts directly through the middle of the box/guests in front of the café window. The prior blocker-only ray test missed it because Episode 01 streetlamps were created as decorative/non-solid geometry, not included in `world.blockers`.
- **01 (frames 0–26):** The guest is beside the box, but never visibly jumps in. Its movement is nearly static and the vertical lamp divides subject and prop. This is a story-action failure, not only a crop warning.
- **02 (27–62):** Detailed cat facial artwork improves over the first draft, but cardboard front flap and lamp weaken the composition; sleeping body/head pose remains mostly static.
- **03 (63–107):** Face/ears progressively sink behind front flap; human viewer still sees disappearance, not a readable animal-to-cardboard change. `BOX_HIDES_CAT_FACE` confirmed on frames 71 and 85. The folding action cannot be approved.
- **04 (108–182):** Only two foreground witnesses read well; third behind box is almost completely hidden, and a blue horizontal probe arm stretches implausibly over/into the box. Lamppost occupies the center; extreme wide camera makes cats tiny and road dominant.

## Fixes COMMITTED after the review — not yet rendered/validated
1. **Retain Episode 01 town unchanged, move the demo box and acting to x=-2.5 sidewalk, between streetlamps x=-6 and x=0**, update all four camera setups and portrait 9:16 composition.
2. In demo box mode, opening amount 1 now rotates flaps close to 180° to rest outward, instead of standing over the face. Do not change Latte, Essie or shared-box flap defaults.
3. Replace the no-op side step in shot 01 with an approach **outside** the cardboard wall, then explicit lifted leap over the rim, lowering into the same physical box before the shot 02 cut. Higher leap prevents simple slide through solid cardboard.
4. Add sleeping head relaxation/blink cues in 02; keep face visible during cat-to-cardboard facets in 03; delay flap closure until after face starts turning to cardboard.
5. Reposition all three town witnesses on different depth planes around the box, including one at near-right foreground. Remove the exaggerated animated arm; rely on body movement, reactions, head tilts and glances.
6. Add actual mesh raycast-based **STREETLIGHT_BLOCKS_SHOT** QA using Episode 01 streetlight groups; failure must cause visual warning, not a false clean pass.

**This does not prove the problem is fixed.** Run a fresh local 183-frame pilot only after syncing the new files. Then evaluate actual motion, not just source or bounding boxes.

## Permanent quality lesson for future one-prompt pipeline
Subject-frustum fitting and the `world.blockers` list are insufficient. Composition QA must also inspect **non-solid set dressing** (e.g., lampposts), **hero-prop occlusion**, character-limb contact, identity clarity, physical motion path, and continuity at shot cuts. Automated passes are necessary but not artistic approval.
