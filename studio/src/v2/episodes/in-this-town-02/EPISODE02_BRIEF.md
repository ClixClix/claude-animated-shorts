# In This Town — Episode 02: The Shadow That Grew (DRAFT)

> **Status:** Preproduction pitch + draft script only. Not user-approved. No voice credits authorized, no voice generated, no final camera/render/shot frame lock. Channel remains **What If Cats**. Story format is the new **In This Town** narrative series.

## One-sentence hook
**In this town, every time a cat lies, their shadow grows.** Essie's little lie about Mocha's broken mug becomes a giant silhouette looming over town; a worried Mocha helps her tell the truth, then tells an even more outrageous lie himself.

## Why this follows Episode 01
- Episode 01 (*The Door at 11:11*) uses a frightening mystery that resolves in kindness. Keep that promise of a meaningful ending but **do not repeat the café-door/stray-kitten rescue plot**.
- Shift protagonist to **Essie** and give Mocha and Latte character moments. Tone: playful supernatural suspense with warmth rather than pure horror.
- First 0–3 seconds: exact rule *plus giant-shadow/rooftop visual* (tease consequence, not resolution). One clear instantly understandable premise, a new visual escalation every 5–8 seconds, one honest emotional reversal, an earned final comedic stinger.
- The audience's 'Ep 1 did well' feedback is positive, but we do **not** have platform retention/traffic metrics. Do not infer which specific beat caused the result.

## Core premise and guardrails
- Magic rule: **Every lie grows the liar's own shadow**; the scale of the lie matters and repeated lies compound growth. Telling the truth about the lie restores the normal shadow. No actual giant physical creature; every huge shape is a light/silhouette effect.
- Essie accidentally knocks off Mocha's favorite blue mug and lightly scratches her paw. She hides the pieces, denies knowledge, then falsely blames Latte. The shadow becomes frighteningly huge.
- Mocha's concern is for her scratched paw, not the mug. Essie tells the truth, returns the shadow to normal.
- Final button: Mocha claims he's *never eaten a pastry in his life*, contradicting evidence; his shadow expands dramatically. End on the visual gag with no explanation.
- Keep child/family-friendly cartoon injury: tiny scratch, a bandage, no graphic blood.
- No reuse of unlicensed original-tempo TEMPOREX music. Music must be original/properly licensed. Do not publish based only on a Content ID check.

## Draft narration
File: `studio/src/v2/episodes/in-this-town-02/DRAFT_NARRATION.txt`
Approximate words: 342. Duration not locked; estimate ~105 seconds at Episode 01's observed final narration pace, **not** an audio timing measurement. Don't create exact shot frames or spend provider credits until script and voice are approved.
Narrator preset: `in_this_town` uses **Adam** with source generated at natural speed and offline **1.35x varispeed**, as currently defined in `studio/src/v2/narration/config.ts`. Do not silently substitute the V1 Daniel preset.

## Working visual and sound beat plan (NOT timing-locked)
| Beat | Intended visuals / camera / action | Audio and storytelling |
| --- | --- | --- |
| 01. Pattern interrupt | Giant cat-shaped shadow crosses bright rooftops. Cut to tiny Essie, looking frightened. Use existing street/city layout; shadow is a visual projection, not a giant model. | State weird town rule in first 3 seconds; dramatic low boom. |
| 02. Setup | Sunny café counter with Mocha's favorite blue mug; Essie dusts the counter; her tail catches the mug. | Tail swish -> 3 synced mug impacts/crackles. |
| 03. Hidden mistake | Piece scratches Essie's paw. She sweeps mug fragments behind register; Mocha enters. | Small startled yelp, sweeping Foley, shop bell. |
| 04. First lie | Mocha notices empty shelf; Essie hides paw and says 'No.' The shadow lengthens across the floor. | Sharp low magical elastic stretch; readable look/reaction. |
| 05. Second lie | Essie blames Latte. Wide wall shot: shadow creeps taller, ears reaching upper wall. | New shadow rise synced to the **end** of the lie; avoid repetitive camera drift. |
| 06. Failed escape | She pulls blinds, kills light, turns; silhouette remains visible from daylight. | 2–3 rapidly escalating sight gags, distinct Foley each. |
| 07. Huge reveal | Exterior daylight: projected 2D shadow runs across café wall/neighboring façades and rooftops; it doesn't clip geometry or require actual cast shadows. | Musical rise, window rattle, fleeing-cat meows. |
| 08. Witness | Latte drops sandwich; crowd scatters, Essie bolts into alley. | Plate/snack drop exactly on movement; group reactions. |
| 09. Emotional turn | Essie in alley, close-up scratched paw; Mocha at entrance with bandage and intact mug handle. | Pull music away; warm room/quiet wind, clear eyelines. |
| 10. Truth / restoration | Essie confesses, silhouette collapses *down wall and onto ground* to normal size. | One satisfying timed reverse-whoosh; calm returns. |
| 11. Care | Mocha wraps paw; Essie hugs him. | Cloth Foley; warm harmonic swell; don't rush. |
| 12. Last joke | Latte asks about pastry, Mocha tells an exaggerated lie. Giant **Mocha-eared** shadow rises. Smash cut to end. | Deliberate beat of silence before absurd spring/boom sting. |

## Shot-by-shot staging requirements
- Next phase expands 12 story beats into a sequential camera/shot manifest, keeping **each shot under 120 frames at 30fps**. The current table is beats, not claim of 12 long shots.
- Main 3D scene geography stays consistent: shared café interior with existing **two counter rows**, register/pastry display, exterior street, alley. Reuse known camera-safe pathways.
- New approved prop designs required: recognizable blue ceramic mug (original design, fragmented meshes), non-graphic scratched paw/bandage, optional sandwich and fish pastry; **no clock tower required**.
- Shadow growth is a dedicated **deterministic, camera- and surface-aware silhouette layer**, separate from the problematic overlapping physical floor/sidewalk meshes. It must be grounded to the actor's paw contact and project consistently across cut boundaries; no 'wall slicing' or popping. This is a plan, not an implemented mechanism.
- Fixed character identities and appearance: Essie (black/white), Mocha (gray/white), Latte (chocolate-point). **Never use generic unrelated character art**.
- One-word subtitles only when configured for this series. Mobile-safe text, no floating off-character captions.

## Quality/release acceptance
- Follow `QUALITY_BASELINE.md` and `studio/scripts/release_quality_gate.py`. Exact approved frame count, full video/audio decode, native 1080x1920 / 30fps, H.264 + stereo AAC 48kHz, encoded −16 ±2 LUFS and ≤−1dBTP, no missing impacts/untimed SFX/camera collisions/occlusion.
- Separate script approval -> narration timing/credits -> storyboard -> real native motion review -> final encode -> QA -> rights/creative review. **No full production or paid generation yet**.
- Packaging working title: **In This Town, Every Lie Makes Your Shadow Grow…**. End-frame pinned-comment idea: 'How tall would YOUR shadow be? 👀'
