# The Door at 11:11 — narration-led polish

The separate **InThisTownTheDoorAt1111Polish** composition preserves the original episode, approved lead artwork, permanent café fixtures, original narration cache and finished movies. Only the polish version changes.

The revised edit is **3,349 frames / 111.63 seconds / 64 cuts**. The continuous approved Adam recording sets the timing. There are **no inserted pauses between voice-over lines**, no additional speed-up, and less than 50 ms of final padding after decoded MP3 samples. Redundant unvoiced inserts are removed; the remaining pictures cover their actions during speech. All 364 spoken words have individual, non-overlapping subtitle cues.

Changes prepared for local visual approval:

- Wider reaction and interaction views, portrait-frustum fitting, a full-street blackout view and a push toward the glowing café.
- A round clock face without a square opaque backing. Solid house-door piers from floor to header. A larger visible café-door opening, staged from closed to open.
- A close view of the low tapping contact, both shadow ears with the head in frame, and more floor around the dragging cloth.
- Shadow push-in, Latte retreating, kitten-to-handle-to-kitten tilt, and Latte's eyes reopening before the Mocha reveal.
- Latte looks off-camera before the sign insert. Mocha smiles during the ending.
- Street walkers continue across shots; seated patrons remain in their existing chairs. Two more frightened cats enter through the existing doorway. A third hesitant cat waits outside in shadow, then follows the same continuous route into shelter.
- A longer bus with driver windshield, passenger door, destination board, bumpers, mirrors and lights; its departure is shown on the spoken bus line. Two fixed parked cars occupy the street edges, clear of the bus route.

## Local review

1. Close Remotion Studio and run **Sync-and-Open.cmd** to fetch source-only updates.
2. Run **Preview-Polish.cmd**. This prepares the edit offline and renders complete selected half-resolution clips locally. The clips include subtitles but no mixed audio. `studio/out/v2-episodes/door-at-1111-polish/Polish_Narration_Flow.mp3` is the exact cached recording for listening review.
3. In Studio select **InThisTownTheDoorAt1111Polish**. Scrub each action, especially paw-to-glass contact, door opening, ear silhouettes and supporting cats crossing the threshold.
4. After visual approval, run **Render-Polish.cmd** for native rendering and separate music/Foley finishing. Outputs stay in `studio/out/v2-episodes/door-at-1111-polish/`; original episode outputs and caches remain intact.

Windows execution and actual changed pixels have not been reviewed in this Linux session. No scene/video frames are rendered in the cloud. Existing preview caches are validated against source, props and frame ranges before reuse.

## Reference quality gate

Use the repo's private reference shorts for final local picture/motion comparison. This checkout contains `references/STYLE_BIBLE.md` and the measured reports, but not `references/vids/` or the private contact sheets. A fresh side-by-side review cannot be claimed here.

`references/reports/motion.md` explicitly corrects the older camera-motion summary: prioritize smooth camera acceleration/deceleration, planted feet and acting that lands near the spoken word. `references/reports/CONTEXT.md` documents the bold, outlined single-word caption treatment. These are quality targets, not proof that this revision matches the references.

During actual local playback, verify that each spoken noun/action has an immediately understandable picture; faces, paws, ears, handles and cloth are readable at mobile size; the narration flows without editorial holds; the street has coherent life; and the final hesitant cat is recognizably the same cat when it enters. Passing structural tests cannot approve those qualities. Record findings in `studio/out/v2-episodes/door-at-1111-polish/VISUAL_INSPECTION_NOTES.md` before final approval.

## Technical evidence

TypeScript and existing café/animation/narration/original-episode regressions pass. New offline story tests enforce narration continuity, one-word captions, eye-opening and sign-shot order, continuous shelter routes and avoidance of fixed furniture. The all-frame geometry preflight checks camera collisions, critical marker visibility and missing assets without drawing new frames. Native pixel, motion and encoded audio QA still run locally after rendering. No narration regeneration, paid requests or permanent narrator changes are involved.
