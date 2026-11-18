# Episode 02 — Episode 01 production pipeline parity

**Required:** New story, exact Episode01 production system. Adam ElevenLabs narration, 1.35× original varispeed, verified word timings, narration-led edit, original Episode01 cat/world/shader assets, narrated 540p preview, targeted story and camera review, native 1080×1920/30fps H.264 render, original/licensed sound, encoded-film release gate. No publishing.

## Current implementation (branch `v2-local-render`)

- **VOICE:** Original Episode01 `src/v2/narration/config.ts` already locks **Adam / pNInz6obpgDQGcFmaJgB / eleven_multilingual_v2**. `episode02-generate-voice.mjs` uses the same server library, cache, processed timing and 1.35× varispeed. **One charge-bearing provider request only after explicit cost authorization; never automatically.** `EP02_VOICE_PROVENANCE.json` verifies identity.
- **EDITORIAL:** `studio/scripts/lib/episode02-adam-edit.mjs` matches every recorded word to the exact 60-beat script; no uniform-duration scaling; contiguous, no missing dialogue; subdivides beats exceeding 120 frames into A/B inserts, and retains their original source-performance frame ranges. `episode02-prepare.mjs` strictly requires real Adam word timings for a narrated build. It saves `EP02_ADAM_NARRATED_EDIT.json` and a source-mapped shot manifest.
- **ANIMATION:** `timeline.ts` uses source performance frames for exact Episode01-style continuity, while shot start/end frames are driven by the new narrator edit. Approved city-crane source frame range 0–104 is preserved. Original Episode01 cast/world/style modules remain locked by style preflight.
- **PREVIEW:** `npm.cmd run episode2:preview-adam` now performs TypeScript, original source, geometry/camera and source motion checks before a **full narrated 540×960** preview with real original SFX/music stems. All physical shots (including any inserts) are rendered and assembled.
- **NATIVE:** `npm.cmd run episode2:build` uses the same cached per-shot rendering and finishing pathway at native 1080×1920/30fps. `npm.cmd run episode2:check` runs full batch technical and encoded-movie checks. Actual human creative/rights signoff is independent.
- **TIMED SOUND:** Foley and musical accents are keyed by narrative sequence, not numeric position in the expanded shot array; A/B inserts don't duplicate sound effects. Motion/critical-shot board looks up narrative sequence, not an unsafe array index.
- **OFFLINE REGRESSION:** `npm.cmd run episode2:adam-edit-test` exercises full 60-beat word coverage, exact frame continuity, split insert source frames, accepted narrator and required error paths, with no provider call or render.

## One-video-per-day reusable process

1. **Script locked:** story, approved visual beats, cat continuity, shot geography. Do not render a full picture from estimated narration.
2. **Voice approval:** `npm.cmd run episode2:voice-count` prints exact characters and a **potentially billed** voice command. Require a valid local rotated API key, explicit paid permission and exact character-count approval before any call. Never paste API keys into chat.
3. **Adam take:** voice tool produces `Approved_Narration.wav`, `Approved_Word_Timings.json`, `EP02_VOICE_PROVENANCE.json`. Do not make repeated paid requests if the first fails; inspect cache/receipt.
4. **Narrated preview:** `npm.cmd run episode2:adam-edit-test`, then `npm.cmd run episode2:preview-adam`. Watch complete movie and critical transformation/cat-box/camera contact sequences; compare with approved Episode01 MP4. Reject visually unsound source; do not equate green tests with artistic success.
5. **Targeted edits:** fix specific script-to-visual defects at source with clear shot/time evidence; rerender only affected source/prop hashes, but always assemble a complete coherent preview.
6. **Final and QA:** `npm.cmd run episode2:build`; then `npm.cmd run episode2:check`; inspect the actual final native encoded MP4 with headphones and on a phone, verify licensed sound, complete human review. No automated publication.

## Remaining blockers (do not invent success)

- **No newly generated real ElevenLabs Adam narration is available to this GitHub session.** The user must run authorized synthesis using their own ElevenLabs key or supply the real completed audio and word timing/provenance.
- **Real narrated source edit has not yet been generated or visually tested.** The new offline tests and local production commands must run on the user's machine.
- **Cat/box interactions and janky cameras remain artistically rejected** until actual newly rendered moving footage passes review. A new timing pipeline cannot cure 2.5D anatomy or opaque flap clipping by itself.
- **Episode01 original final MP4 needs to be supplied or made available for genuine frame-based visual parity inspection**, though immutable Episode01 source style can be checked without it.
- No paid provider generation, new cloud render, publication, completed quality gate, or user creative signoff is claimed by this document.
