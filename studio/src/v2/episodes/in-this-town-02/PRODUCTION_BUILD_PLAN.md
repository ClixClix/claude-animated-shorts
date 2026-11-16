# Episode 02 — The Cat Who Became a Box | Production Build Brief

**Channel:** What If Cats | **Series format:** In This Town | **Story approved:** 2026-11-16
**This document:** Implementation handoff and build order. It does not certify that scenes have been animated or rendered.

## Approved inputs and immutable baselines

- **Exact story source:** `DRAFT_BOX_NARRATION.txt` (403 words, user approved). Do not revise voice lines without consent.
- **Exact shot source:** `DRAFT_BOX_SHOT_LIST.md` (60 numbered shots, 02:09.2 **provisional** editorial ranges). The first transformation is visual by ~3.6 seconds; narration may continue across cuts. Every shot should remain under 120 frames after alignment.
- **Output standard:** `QUALITY_BASELINE.md`: native 1080×1920, 30fps, H.264, 48kHz stereo AAC, encoded −16 ±2 LUFS, true peak ≤−1 dBTP, full-frame/full-audio decode, human watch-through and rights approval.
- **Original visual baseline:** *The Door at 11:11* final encoded film. Its exact scene geometry, shot framing, music and timings are NOT to be copied blindly. Never alter the Episode 01 master or its scripts while building Episode 02.
- **Existing source references:** `studio/src/v2/cafe/config.ts` and `environment.ts` are the sole permanent café layout; original cat designs are in `src/v2/cats/designs.ts` and `Cat.tsx`. Reuse the previously established city, bus stop, market and alley styling with no accidental duplicate floors. New animated episode props live only in Episode 02 source.
- **Narration preset:** `in_this_town` / Adam from `src/v2/narration/config.ts`: generate source at natural pace then offline 1.35× varispeed. **No paid provider call is included or authorized here.**

## Executive build order (actual implementation priorities)

| Gate | Build set | Shots | What must exist before proceeding | Proof / failure conditions |
| --- | --- | --- | --- | --- |
| **P0 — continuity contracts** | Box identities, placement, single café instance, transformation rules and frame-state contract | Affects 01–60 | Stable `LATTE_BOX`, `ESSIE_BOX`, `SHARED_BOX`; explicit occupancy states; actor/box position anchors; map of café → bus stop → market → alley → café | Fail if boxes change markings/size, intersect existing café furniture or are silently teleported |
| **P1 — hero transformation prototype** | Rule reveal and Essie-changing moment, plus return transformation | **01–04, 35–39, 49–51** | Progressive cat→box→cat shape transitions at real contiguous frames; box/actor support contact; camera cut safe | Consecutive frames before/during/after morph; no flicker, model pop, floor clipping, duplicate cardboard |
| **P2 — emotional spine** | Latte discovery, Mocha's failed attempts, Essie's disappearance and reunion | **08–17, 24–26, 40–52** | Legible eyes/eyelines and hand/paw-to-box contacts; revealing familiar Latte meow; strong pause only when action needs it | Watch silent storyboard: viewers can identify where Latte and Essie are without narration |
| **P3 — movement / geography** | Café monitoring, Essie dragging box, Mocha searching, both racing back | **18–23, 27–34, 53–55** | Mapped continuous paths, fixed street/sidewalk mesh, doorway crossing, physically grounded pulls/lifts; no camera through façade | Mobile-width video of turns, paw plants, drag/carry, alley axis, return trip and physical landing |
| **P4 — contextual storytelling** | Character contrast, town cure demonstration, warm group ending | **05–07, 56–60** | Dedicated three-cat shared box with real capacity and visibility; supporting town cats; legible 3-step cure explanation | Same cat identities, no crowd occlusion or final-box size illusion |
| **P5 — audio and edit lock** | Timed narration, captions, Foley, music, transitions and mix | **01–60** | User-approved voice asset with actual timestamps, then exact frame lengths; cue IDs all follow visible action | No voice truncation, no missing major SFX, music licensed, no drifting captions; check final AAC stream |
| **P6 — local release validation** | Render and actual-file quality gate | **01–60** | Native local render, full decode, audio measurements, contact sheets AND reviewed full movie | `scripts/release_quality_gate.py` must pass; rights and creative approvals separate |

### Why this order

Do **not** animate all 60 shots in sequence and discover that the transforming cardboard is physically impossible. First create the primary magical movement at **shot 39**, the Mocha-in-box contact at **shot 49**, and the restoration at **shot 51**. The opening hook **shot 03** reuses that transition language. Once these pass native-motion visual tests, the rest can be blocked.

## Character-and-prop contracts

| Object | Visual and dimensional contract | Default / move path | Hard rules |
| --- | --- | --- | --- |
| `LATTE_BOX` | Smaller warm-brown cardboard with **two distinct diagonal striped tape bands**, square-ish silhouette, openable four flaps; only this box produces Latte's recognizable muffled meow | Fixed, beside front café window until rescue; temporary hidden/replaced only after rescue | Same stripe pattern before/during/after transformation; no other cat temporarily visible after change |
| `ESSIE_BOX` | Larger **plain** brown cardboard, softer folded edges, four flaps, deep enough to hide Essie curled | Starts in separate safe café sleeping corner; Essie physically pulls it along mapped street to sheltered alley; stays in alley through rescue | No stripes; never swaps with Latte's prop; no unexplained position changes |
| `SHARED_BOX` | Fresh **extra-wide** cardboard with distinguishable lighter edge color and no stripes; dimensions must fit visible heads and supported paws of all three | Introduced only after Mocha shares cure; sits by café window with no intersection with existing window table or chair | Must look like a third separate box, not a scaled-up Latte box or untracked magically-replaced prop |
| `CAT_MOCHA` | Preserve gray/white palette, white ruff/socks, greenish eyes from `designs.ts` | Initially actively avoids cartons; later hesitates, steps in voluntarily and hugs both friends | No cat-to-box transformation for Mocha because his contact is brief |
| `CAT_ESSIE` | Preserve black longhair, white chin and whiskers | Leaves a space for Mocha; drags personal box; folds into it; restored when Mocha enters | Positive screen evidence: whiskers, paws, ears flatten in stages before disappearance |
| `CAT_LATTE` | Preserve chocolate-point markings, distinct meow | Curled in striped box; transformed offscreen by morning; restored when Mocha enters | No mystery second Latte mesh while box is supposedly Latte |

**Provisional design dimensions (metres; NOT approved collision coordinates):** latte 1.18×1.06 footprint, wall 0.78; Essie 1.42×1.20, wall 0.92; shared 2.80×1.55, wall 0.95. Check against original character card widths, camera angles and blocking. Do not stretch the final box without checking the front window, side aisle, plant and customer tables.

### State and continuity (single source of truth)

- `NORMAL`: cat is rendered, its ordinary box may be present, contact/eye-lines are valid.
- `RESTING`: cat begins settling into designated box; track duration in story time, not camera-shot time.
- `MORPHING`: gradual deterministic blend; canonical box stays at the same position. Actor artwork progressively becomes cardboard; do **not** spawn a second box.
- `BOXED`: cat body fully hidden, box is the only represented body; faint meow can identify the cat. Mocha may lift/tap without a state change.
- `RESCUING`: another cat enters the *same* transformed box, physically intersects only the empty interior space and is kept below the unknown long-duration threshold.
- `RESTORED`: trapped cat emerges through a coherent reversed morph and lands supported on ground or another cat; rescuer clears the interior first.

Essie's full transformation starts after she has been inside for **a meaningful implied period** (shot 37) while Mocha approaches. The rule is *staying inside too long*, not *touching a box*. Do not set a specific minute threshold in narration. A fleeting magical preview in shot 03 is illustrative of the rule, not a contradictory instantaneous curse.

## Camera/motion and set continuity

- Reuse `CafeEnvironment`, **one** café instance. Original reference: `ROOM` is 8×8.4m, front is +Z at 4.2; front-window-left near X=−1.45 and entrance near X=2.25. Counters and customer tables are protected set fixtures. Validate any box positions against the real fixture occupancy list before implementing.
- Two stable box positions inside café and one in alley. **No shot-specific world recreation or moving permanent fixtures for shot framing.** The final shared box can take the foreground after all three are restored but must be shown placed in the story.
- Route map / shot order: inside café → outside street → bus shelter → market shopfronts → an established alley with one streetlamp → direct return to café. Exact path positions are **TBD until actual street collision/route preflight**; do not invent geometry by copying a screen-space trajectory.
- Critical acting contacts: 06 curl; 07 inviting paw; 12 flap lift; 16 food/rock; 19–20 protective scoop; 32 Essie's box pull; 35–39 transform; 41 taps; 42 hug; 49 climb; 50–51 recovery; 54 hold flaps; 55 spring; 59 nest. Explicitly review each at consecutive native frames.
- **A/B camera proof:** For 03/39/50/51, try one clear medium or close perspective without hard cut during the key shape change; keep nearby cutaways only for reaction beats. Keep a readable front-facing view at 1080×1920 with all essential actors in the central mobile-safe portion.
- Night scenes must preserve silhouettes; face and box flaps visibly lit by a motivated streetlamp, not black crushed cards. Preserve café warm interiors and cooler streets established in Ep1.

## Sound/mix and pacing acceptance

- The 403-word script is approved but **02:09.2 remains an estimate** and the rough shot durations will not match precise words. Never claim timestamps are locked until actual authorized Adam voice is available.
- Work without paid voice by staging silent key poses and storyboard; when authorized, use actual word alignment, then regenerate frame intervals and subtitle cues. Narration still drives transition timing. Do not shift existing Ep1 narrator caches.
- Important Foley: paper crease and fold (01–03/37–39), one familiar muffled Latte meow (13), two flap touches (12), food/rock failure (16), distressed call (33), separate knocks (41), cold alley wind (44), rescuer's planted paw contact (49), escalating reverse-fold (50), joyful pop/reunion (51/55), final trio purr (60). Use new *original* procedural effects where possible.
- Music can share an approved **style**, not an unlicensed Ep1 file. Layer suspense → tenderness → relief with voice-priority ducking. No music or Foley can obscure words; check all critical impacts within ±1–2 frames of visible contact after timing lock.

## Local verification milestones

**Checkpoint A / no render:** file existence, TypeScript compile (when actual source modules exist), data integrity, no duplicate stable IDs, props never overlap protected fixtures, script SHA recorded; safe to sync. No paid calls.

**Checkpoint B / very small local proof:** render **shot 39** and **shot 50–51** as *short native frame sequences* or a clearly labeled technical motion preview, not full final episode. Record actual preview filenames, frame ranges, source commit and blocked issues. Check transformation frames individually.

**Checkpoint C / rough assembly:** all 60 shots blocked in original world, separate camera plans, continuous provisional audio guide. Show complete 540×960 review movie first. Needs user review before polished 1080×1920 local render. Local review is not a final encode and must not be described as such.

**Checkpoint D / final:** voice aligned and paid only after explicit cost permission; exact frame count locked; native 1080×1920 full render and independent audio mastering; complete encoded-MP4 gate and mobile/headphone review; documented asset/music rights.

## Highest-risk shots and required visual proof

| Risk | Shots | Failure mode | Concrete test |
| --- | --- | --- | --- |
| **P0** | 39, 50–51 | Cat instantly disappears, duplicates, or restored body intersects box/Mocha | Sample every native frame spanning transition; compare silhouette continuity and show body physically leaving the box |
| **P0** | 03 | Opening does not convey rule instantly | View first 4 seconds **without sound** on phone; can audience recognize 'cat becomes box'? |
| **P0** | 49, 54 | Mocha appears to clip through a wall rather than climb in | Side-view stepping and flap placement at paws/box rim; test body clearance |
| **P1** | 32, 35, 37 | Essie instantly transforms, or drags a different box | Show same brown box seam/tape orientation, supported box drag, clear elapsed time |
| **P1** | 08–15 | Latte box not visually tied to Latte / appears to move by itself inconsistently | Verify unique stripes and persistent window coordinates in establishing shot and reveal |
| **P1** | 28–34, 53 | Search geography changes direction / camera crosses through walls | Camera-blocker and route sweeps at every frame, shot-to-shot entrance/exit continuity |
| **P1** | 57–60 | Town cure is confusing, and final box cannot fit 3 distinct cats | Visual-only three-step demonstration and actual three-cat bounding boxes in box |
| **P2** | 18–23 | Overprotective montage repeats without adding emotion | Each shot changes Mocha's/Essie's behavior; tight pace test using scratch reel |

## Deliverables and status

- [x] Approved story and 60-shot editorial list
- [x] Source-specific build brief and first-pass prop contracts
- [x] Initial distinct 3D cardboard box meshes and articulated flaps authored in `boxProps.ts` (no visual approval yet)
- [x] 60-shot machine-readable *scratch* manifest generated and programmatically checked for gapless frames, unique sequence, and <120-frame shots; not locked to narrator timing
- [x] Offline asset/fixture test script authored: `node scripts/episode02-box-tests.mjs` (not executed in user's local studio yet)
- [ ] Box assets pass actual local test and native visual review
- [ ] Working scene/world composition for Episode 02
- [ ] Rendered transformations and visual review
- [ ] Paid narrator track (separate permission required)
- [ ] 60-shot rough preview and review
- [ ] Local final render and release QA

**Current status:** EPISODE02_SOURCE_SCAFFOLD_READY_FOR_LOCAL_TEST. The articulated box meshes and preliminary 60-shot editorial data are real source files in this branch. **They are not registered in a new Remotion composition, not native-rendered and not visually approved.** The next real step is local offline tests and a dedicated transformation/key-contact prototype. Do not create a shortcut that accidentally rerenders or overwrites the Episode 01 movie.
