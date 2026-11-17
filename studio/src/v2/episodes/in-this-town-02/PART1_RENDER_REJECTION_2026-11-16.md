# Part 1 visual rejection — user-uploaded rendered evidence

Review date: 2026-11-16. Evidence: `Part1_01-04_PREVIEW.mp4` and twelve real renderer PNGs (`01_20` through `04_80`). Original source hash `8087fbbe288c7fa6e8012bd931ab1b628f789cf4fd5c118bca7286a1ff3e986f`. These are **real Episode 2 engine frames**, not generative storyboard images.

**VERDICT: REJECTED.** All four shots fail story clarity, visual staging, and Episode 1 quality as a whole, even though the rendering pipeline executed and emitted no browser error. Do not equate “4/4 rendered” or partial automated projection success with visual success.

| Shot | Observation from actual frames | Rebuild |
| --- | --- | --- |
| 01 | Giant brown box fills most of frame and is cut off on left/right; only two dark triangular ears show above back lip. The viewer cannot see a cat approaching or entering. The supposed sidewalk is dark asphalt **in the road**, with oversized café door behind. | Relocate to café sidewalk by front window. Reframe to include full box and standing detailed cat alongside it; forepaw moves to real rim. |
| 02 | Plain round smiling toy-like head and two detached-looking paws float inside box. The composition implies hiding, not curling up; no visual time passage. | Draw a distinct curled torso and detailed Episode 1-style face/body in the same card art system, move sun direction; verify face above near rim. |
| 03 | Cat’s face shrinks/disappears behind front wall, box flaps close, beige sticker-like shape appears on front. This does **not** look like a progressive cat-to-cardboard transformation. | Transition fur/color/face into cardboard facets on the actual curled sprite before collapse, do not render fake paper sticker outside box. One persistent 3D box only. |
| 04 | Two simplified tiny toy cats stare straight at camera on road, third cat hidden behind box and awkward elongated arm protrudes toward right-hand cat; no baffled reaction. | Use three distinct detailed illustration variants around the one box, make facial reaction and physically short paw tap visible, open camera for complete subjects. |

**Brand assessment:** Real Episode 01 uses polished, outlined, layered 2.5D cat art and dimensional 3D town geometry. This pilot reused the town meshes but promoted inexpensive Episode 01 *background extra* art to hero-shot scale; that was an incorrect asset choice. Reuse the **detailed `drawCat` rig** with custom guest palettes instead.

**Technical audit misses:** previous JSON flagged shot 01 and 04 boundary crops but reported shot 02/03 clean. That only meant projected extents and center-to-target ray passed: **the box prop itself covered the hero actor**. Revised audit must raycast from camera to cat-face screen target through box walls/flaps and count 12 unique sample frames (3/shot), deduplicating overlapping still/video logs.

## Revised source currently committed, but NOT visually verified

- `PART1_SHOT_BLUEPRINT.json`: fixed sidewalk staging at x=0,z=5.35 by café window, four camera designs.
- `ruleCats.ts`: detailed Episode 1 `drawCat` illustration line work and separate non-lead guest palettes. New curled sprite with integrated head/body/paws.
- `Episode02Part1.tsx`: guest approaches from beside box rather than being hidden in it from frame 0; papery facial facets; three witnesses with reactions; shorter physical rim contacts.
- `drawCat.ts`: backward-compatible optional palette override; Mocha, Essie, and Latte designs unchanged.
- `episode02-part1.mjs`: source hash includes new rig; camera audit checks physical box self-occlusion and 12 unique frames.

This is an **implementation attempt**, not an automatic artistic approval or a claim that every action looks good. On Windows rerun the same pilot after syncing, upload the new MP4 and report. Do not start later episode sections or a full render until every shot has been watched and approved visually.
