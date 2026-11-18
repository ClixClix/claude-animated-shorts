> **ONE-PROMPT POLICY:** The user supplies a story, not a technical shot list. The production agent fills this template, derives each visual action and camera from the words, and implements/verifies the CGI. Do not ask the user to manually enumerate shots or repeat Episode 01 styles already locked in [AGENTS.md](AGENTS.md). Only seek permission for genuinely new paid services, content rights, or publication. For Episode 02, its [production director lock](studio/src/v2/episodes/in-this-town-02/PRODUCTION_DIRECTOR_LOCK.json) already contains the full user direction.

# New episode brief (complete before production)

- Series/title:
- Approval to start this episode:
- Audience hook and town rule:
- Exception/mystery:
- Main characters and emotional change:
- Setup -> escalating clues -> reveal -> payoff:
- Exact script approved by the user:
- Narrator/config preset (read config.ts; do not assume):
- Existing usable narration cache, or paid credit estimate awaiting approval:
- Target format/duration and maximum shot duration:
- Existing permanent locations reused:
- New environment/props needing design approval:

## Shot plan

For each shot record: stable shot ID; spoken words/timing; information revealed; main subject/action; starting/ending character/prop positions; camera start/end; gaze and reaction; contact/support surfaces; match with previous/next shot; required visibility; planned sound.

Do not place images merely because a word is spoken. The image must make the story understandable without narration, and add information or emotional meaning to it. Keep secrets hidden until the reveal.

## In This Town style source (mandatory before new production)

- One-prompt input inherits `studio/src/v2/series/IN_THIS_TOWN_STYLE_LOCK.json` and the `ONE_PROMPT_PRODUCTION_CONTRACT.json` production stages automatically. See `ONE_PROMPT_IN_THIS_TOWN.md`.
- Render with the locked `episode1Style.ts` values and **the exact original Episode 01** Mocha, Essie, Latte, kitten, town/café, walking legs and shading. Avoid ad-hoc replacement character art.
- Source check: `npm run episode2:style-check` (or the matching style-lock check for a future episode). Source lock success means *asset identity only*.
- Preview review: `EP2_STYLE_REVIEW.html` and `EP2_STYLE_REVIEW_PACKET.json` contain per-shot actual-frame decisions. **No automatic creative pass** from matching source SHA values.
- All new *In This Town* mystery episodes should match the quiet suspense, reveal rhythm, coherent location geography and emotional payoff of Episode 01. Do not copy the faster What If Cats comedy pacing.
- Never use/copy the exact reference video or its music as a new episode asset, or declare music rights from a passed source hash.

## Invariant feline movement rules (all future one-prompt episodes)

- A cat **sniffs and noses** flaps, furniture and other cats; holds or gently pulls light objects with its **mouth/teeth**, not invented human hands. A paw can walk, balance, step, knead, or make a brief anatomically plausible tap; it is not a prehensile arm. Avoid pointing, grabbing handles, long stretched forelimbs, and human carrying poses.
- Use the **actual approved Episode 01** Mocha/Essie/Latte silhouettes, full drawing and walking-leg rig. Do not create a primitive oval torso, floating head or detached cylindrical stick legs.
- Scale every prop against the established cat design and furniture, not by arbitrary camera-filling dimensions. All boxes must show the appropriate cat face and ears when the story requires them.
- Each physical interaction needs a verifiable world-space relationship between muzzle/paw, prop and support surface. Box-entry actions require a readable whole-body path, no clipping/teleporting. A magical transformation requires a readable cat-to-cardboard change, not merely hiding a sprite.
- Keep only story-relevant boxes visible in any shot. For the Episode 02 ending, show **one** shared box and all three recognizable faces, not Latte's old box superimposed.
- The animation source passing TypeScript and automated checks does NOT constitute visual approval; inspect actual generated frames and movement against Episode 01 before expanding to subsequent shots.

## Production gates

1. Script and new design/layout approval.
2. Narration cache/approval and actual timing.
3. Actual rendered storyboard, checked against geography and spoken beats.
4. Consecutive actual frames for stepping, turning, object contact, entry and reveals.
5. Full narrated local preview and reference-quality review.
6. Native local render, independent music mix, encoded audio/video QA, user approval.
7. **Mandatory final-MP4 release gate:** run `studio/scripts/release_quality_gate.py` with the approved edit's `--expected-frames` and the correct series. Require 1080×1920/30 H.264, AAC stereo/48 kHz, −16 ±2 LUFS, ≤−1 dBTP encoded true peak, full decode and an exact-file human review/rights signoff. See `QUALITY_BASELINE.md`. Never call an unreviewed or unlicensed render publish-ready.

Record actual evidence paths and unresolved issues at each gate. Passing code checks is not picture approval. No automatic new paid audio or publication.
