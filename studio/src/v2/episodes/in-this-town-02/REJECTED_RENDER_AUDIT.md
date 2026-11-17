# Episode 02 — REJECTED first native prototype: actual footage review
**Evidence date:** 2026-11-16 (11 user-uploaded local preview MP4s, 540×960 @ 30 fps).  
**Decision:** **VISUAL REJECT / DO NOT PUBLISH / DO NOT RUN THE FULL 60-SHOT RENDER** until the composition is replaced and real frames demonstrate improvement.

## What was actually inspected
The user uploaded independently rendered previews for shots 03, 07, 09, 20, 32, 39, 50, 51, 54, 59 and 60. Each clip was opened and multiple frames were examined at 20%, 50% and 80% of its local duration, including comparison with supplied Episode 01 master movie. This is **rendered evidence**, not an inference from code.

| Shot | Observed footage | Severity and required action |
| --- | --- | --- |
| **03** | The brown cardboard box fills almost the entire vertical frame; no clear cat-to-box transformation is readable. | **BLOCKER.** Replace camera and staging; explicitly render cat→box shape sequence before any finishing effects. |
| **07** | Large open box dominates centre, gray cat is clipped on right edge, and Essie's inviting action is not visible. | **BLOCKER.** Reblock both characters and the *smaller* prop at medium view. |
| **09** | Café composition shows a box, table and tiny partly obscured cat. Neither absence nor discovery reads. | **BLOCKER.** Stage a visible character reaction with correct sightline to box. |
| **20** | Cats and the box alternate awkwardly in front/behind furniture; partly occluded figures; no plausible scoop interaction. | **BLOCKER.** Animate contact/paw/feet and use a closer controlled shot with an uncluttered set. |
| **32** | Very large box swallows almost all frame; Essie is seen only in disjointed partial glimpses, so dragging isn't legible. | **BLOCKER.** Rework box-to-cat scale and actual dragging pose/path. |
| **39** | Essie's flat gray sprite appears outside/in front of a large open box while the flap moves; there is no recognizable morph. | **BLOCKER.** Build true character-to-cardboard transition rather than scaling/shrinking the 2D upright sprite. |
| **50** | Nearly static oversized cardboard box hides the supposed rescue; toward end a cropped cat appears to its right. | **BLOCKER.** Model Mocha's entry and Essie's release so both are readable, continuous and physically coherent. |
| **51** | The box still dominates foreground and a gray smiling cat appears to the side; visible action does not match the release promised in narration. | **BLOCKER.** Full reunion staging with Mocha and Essie in a clear two-character view. |
| **54** | Nearly the entire movie is a dark green interior wall/pillar, with a thin slice of set on right; Latte rescue unseen. | **BLOCKER.** Camera is occluded; use a scene-raycast/line-of-sight solution rather than bounding-box fitting. |
| **59** | Almost entirely close-up beige/green vertical wall/architecture; shared box/three cats cannot be seen. | **BLOCKER.** Abandon view and restage shared-box ending in a visibly clear area. |
| **60** | A huge close cardboard face and flaps; only fragments of cat faces visible. It cannot communicate three cats cozy together. | **BLOCKER.** New wide/medium closing composition with three faces visible simultaneously. |

### Cross-cutting mistakes verified
1. **Perspective/scale:** all boxes read far too large against upright 2D cat cards. Neither global scale change nor auto-fit alone solves the on-screen composition.
2. **Occlusion:** cameras sit behind architecture or furniture. The current `cameraDirector.ts` checks frustum projection of assumed subject bounds but **never raycasts against real world meshes**, so its “safe” result is misleading.
3. **Animation:** `createCatCard` sprites are mostly frontal 2D billboards. The current transform is a squash/opacity change behind a real 3D box, not an intelligible gradual cat→box action.
4. **Continuity and character blocking:** eye-lines, paw contact, body support, and identity/state transitions are not maintained at shot boundaries. The rescued cat is sometimes not where the event demands.
5. **Narration/captions:** scratch voice is silent, while the script estimates timings by spreading words across runtime. On the uploaded clips the word captions visibly mismatch events (for example shot 39 includes “whispered/name/close” despite its planned morph climax); scratch captions should be hidden entirely until real narration alignment exists.
6. **Reference mismatch:** compared with Episode 01, which uses clear establishing/composed frames and more grounded visible cats, this draft has unreadable story staging. **Not remotely release-ready.**

## Rebuild specification (not an optional polish pass)
- **Replace the Episode 02 camera director + shot staging**, not merely change its FOV. Each shot needs an explicit camera intent, usable subject rectangle, real mesh occlusion check, and stable screen-space subject placement in portrait.
- **Keep Episode 01 world, café fixtures, costume/art identity and established lighting**, but route box-centric action to a dedicated *unobstructed* corner or controlled partial-set with only necessary geometry visible.
- **Rebuild the box↔cat action:** hero boxes must remain consistently recognizable but small enough to share medium shots with adult cats. Use more physical poses and occlusion strategy so a transformed box isn't automatically larger than the entire scene. Two-dimensional cut-out rigs can match Episode 01 style, but they must be posed and masked inside/around the box; no snapping upright billboard beside it.
- **Establish a contact choreography** for 20, 32, 39, 49–51, 54–55, 59–60. Demonstrate all primary story beats in visual-only format.
- **Replace word-spread scratch captions** with no captions in silent preview; require real source word timestamps for production captions, separate from provisional editorial timing.
- **Stop automatic full-episode rendering while this is rejected.** Begin with *real frames* of shots 03, 07, 39, 50–51, 54, 59–60. Approve the blocking and transformation as a set before spending compute on the rest.
- **Only then run the full production with a single final QA batch** as user originally requested; the user need not review every interim shot, but we must make internal QA decisions from real renders before claiming done.

## What has not been accomplished
This document records a rejection and required replacement. **It is not a claim that the episode has been rebuilt, that the existing camera director is correct, or that any corrected footage has been generated.** The original full render remains unfit for release. The previously committed “framing fix” did not resolve the demonstrated defects.

**Priority for next continuation:** implement physically plausible subject-first reconstruction, generate an actual visual proof of the essential story beats, and compare directly with Episode 01 before asking for any full render.
