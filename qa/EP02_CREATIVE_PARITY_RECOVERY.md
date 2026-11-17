# Episode 02 — Creative Parity Recovery (NOT RELEASE APPROVED)

Updated: November 17, 2026, ~1:20 PM America/New_York
Project: `In This Town / The Cat Who Became a Box`
Source: `v2-local-render`
Reference quality: Episode 01 **The Door at 11:11**, approved original MP4 SHA-256 `78f621b454e84214f1d0b3e244e7cb9e44ae49b5c9f571c649560eb680179374`.

## Creative judgment

**REJECT CURRENT EPISODE 02 ARTISTICALLY.** Passing style locks, frame count, TypeScript, and camera-bound tests does not establish production parity. User repeatedly confirms the footage is not at Episode 01 standard. Do not mark as 90–99% done or visual-approved until the whole latest encoded movie is inspected against the actual approved reference.

The newest **fully reviewed old-source** 540p footage (run [44121079074](https://github.com/ClixClix/claude-animated-shorts/actions/runs/44121079074), source `3e1fbee`) is a valid **technical** full 60-shot file but shows major creative gaps. Later source is still in cloud rendering and must not be declared fixed.

## Evidence-based underlying issues (not just cropping bugs)

1. **Too much inert pantomime.** Multiple action beats use stationary front-facing illustrated cards, passive heads and stationary boxes. In the 129.2-second `3e1fbee` MP4, 4-fps 108×192 grayscale analysis found ~39% of consecutive 250-ms frame differences below 1/255 mean luminance. This is *not* proof 39% of the film is unacceptable; it is a flag for watching actual motion and noticing long static holds. Cuts heavily increase the mean, so assess *within* shots.
2. **Narration-specific actions are not visibly staged:** 05 disdainful sidestep; 07 invitation/refusal; 09 scanning for Latte; 12 opening/contact; 17 pleading; 20 protective rescue; 24 closing business; 32 Essie dragging the SAME box; 35 sleeping curl; 37–39 transforming; 41 tapping; 42 embracing; 49–50 rescue; 53 entrance; 54–55 Latte rescue; 58–59 final entry.
3. **Cats-in-boxes lack dimensional coherence** because approved lead art is a billboard (original plane height 1.52m). Tilting the billboards helps the perspective but does not create a real curled body, box contact, believable feet, or physical weight. In shots 02,06,07,19,35,37–39,49–50,58–60 require physically credible acting seen from three-quarter views. Do **not** solve by shrinking the cats / enlarging boxes / hiding faces.
4. **Shot grammar/pacing** is repetitive: similar alley views, repeated medium Mocha frontal framing, long empty-box view, little story-driven action. Distinct lens angle only counts when the intended subject and the action are visually legible. Avoid stationary reaction shots back-to-back; give a visible look, change, movement, consequence or designed suspense hold.
5. **Town life** must include active daytime commerce, moving shop patrons, street traffic and business at café while safeguarding lead silhouettes, physical sidewalk/road lanes and nighttime loneliness. Source additions exist but newest complete film is not yet inspected.
6. **Set/actor collisions and blocked cameras** persist in bus stop, street poles, doorway, plants, cardboard flaps, café extras, alley geometry. Inspect real frames in ALL 60 shots, not just mathematical bounds.
7. **Sound and narrative finishing:** Current silent scratch has no timed approved narration, music, SFX or mixed audio. Episode 01 quality baseline explicitly requires these. Do not invent audio or spend paid API credits. Even visually improved scratch cannot be declared finished or on parity with a mixed Episode 01 release.

## Required recovery milestones (all full 60-shot render reviews)

- [ ] **Stage + acting pass**: Visible story action for shots 03,05,07,09,12,17,20,24,32,35,37–39,41–42,49–50,54–55,59. Check actual 0.25–1s consecutive motion, not just midpoint image. Prioritize 2–3 highest-leverage sequence rewrites each source cycle rather than dozens of token microadjustments.
- [ ] **Cat/box physicality pass**: Correct relative scale and true box-resting readability from realistic three-quarter views; clear rim contact and landing arcs. No billboard standing upright in a box pretending to curl.
- [ ] **Town and framing pass**: Believable cars/shoppers/café business with no sidewalk collisions, blocking foreground extras or repeated stock views. Night alley isolated by design.
- [ ] **Full visual review**: Actual 60-shot, 3,876-frame cloud-rendered MP4; verify source SHA, decode, review frame samples from EVERY shot plus consecutive moving footage around interactions, transformations, reveals and transitions. Log numbered defects with severity and evidence. Actual uninterrupted normal-speed review is still required.
- [ ] **Episode 01 parity review**: Obtain the exact approved Episode 01 MP4 matching baseline SHA. If unavailable, explicitly say comparison cannot be verified; source/shot-list similarity is NOT parity proof.
- [ ] **Native 1080×1920 30fps proof + sound and rights**: Only after visual staging passes, check whole native movie. Later add authorized approved narration, SFX and licensed audio; run release gate and human review. No publish without explicit permission.

## Source interventions so far

- `a78adcd`: authored deliberate emotion/eye and position beats in scenes 05,07,09,11,14,17,21,23,24–25,35,37–39,43,56 using original Episode 01 performer rig; not yet verified on moving footage.
- `f2179d0`: developed visible cardboard folding/dissolve and Essie closing eyes; preserves original Episode 01 asset instances; **must check actual transparent shading, flaps and visual legibility** in new full render.
- Recent prior source work included alley coverage, town cars and guest motion, door and obstruction corrections, and jump-arc adjustments; no creative approval inferred.

## Explicit STOP conditions

No 99% claims, no `completed` or `release ready` without actually reviewing the newest fully assembled MP4 at speed, inspecting visual and continuity changes in moving footage, exact reference parity when available, and signed rights/sound gates. Green CI means only its defined tests passed. Document whether the current source differs from the reviewed video.
