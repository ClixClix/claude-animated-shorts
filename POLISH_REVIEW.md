# The Door at 11:11 — narration-led polish

The separate **InThisTownTheDoorAt1111Polish** composition preserves the original episode, approved lead artwork, permanent café fixtures, original narration cache and finished movies. Only the polish version changes.

The revised edit is **3,349 frames / 111.63 seconds / 83 cuts**. The continuous approved Adam recording sets the timing. There are **no inserted pauses between voice-over lines**, no additional speed-up, and less than 50 ms of final padding after decoded MP3 samples. Redundant unvoiced inserts are removed; the remaining pictures cover their actions during speech. All 364 spoken words have individual, non-overlapping subtitle cues.

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
2. Run **Preview-Polish.cmd**. This prepares the edit offline and renders all shots at half resolution locally and assembles a complete narrated review MP4 with subtitles. `studio/out/v2-episodes/door-at-1111-polish/Polish_Narration_Flow.mp3` is the exact cached recording for listening review.
3. In Studio select **InThisTownTheDoorAt1111Polish**. Review the narrated movie and scrub each action, especially the hidden early taps, door opening, mouth-to-cloth contact, ear silhouettes and cats crossing the threshold.
4. After visual approval, run **Render-Polish.cmd** for native rendering and separate music/Foley finishing. Outputs stay in `studio/out/v2-episodes/door-at-1111-polish/`; original episode outputs and caches remain intact.

Windows execution and actual changed pixels have not been reviewed in this Linux session. No scene/video frames are rendered in the cloud. Existing preview caches are validated against source, props and frame ranges before reuse.

## Reference quality gate

Use the repo's private reference shorts for final local picture/motion comparison. This checkout contains `references/STYLE_BIBLE.md` and the measured reports, but not `references/vids/` or the private contact sheets. A fresh side-by-side review cannot be claimed here.

`references/reports/motion.md` explicitly corrects the older camera-motion summary: prioritize smooth camera acceleration/deceleration, planted feet and acting that lands near the spoken word. `references/reports/CONTEXT.md` documents the bold, outlined single-word caption treatment. These are quality targets, not proof that this revision matches the references.

During actual local playback, verify that each spoken noun/action has an immediately understandable picture; faces, paws, ears, handles and cloth are readable at mobile size; the narration flows without editorial holds; the street has coherent life; and the final hesitant cat is recognizably the same cat when it enters. Passing structural tests cannot approve those qualities. Record findings in `studio/out/v2-episodes/door-at-1111-polish/VISUAL_INSPECTION_NOTES.md` before final approval.

## Technical evidence

TypeScript and existing café/animation/narration/original-episode regressions pass. New offline story tests enforce narration continuity, one-word captions, eye-opening and sign-shot order, continuous shelter routes and avoidance of fixed furniture. The all-frame geometry preflight checks camera collisions, critical marker visibility, missing assets, mouth-to-cloth contact, vehicle separation and the blanket appearing before its line without drawing new frames. Native pixel, motion and encoded audio QA still run locally after rendering. No narration regeneration, paid requests or permanent narrator changes are involved.

## Latest directing revision

The narration remains continuous at 111.63 seconds. The edit now has **83 cuts**, with the city → rush-home hook fitted into the existing first sentence. One light flickers once; background cats and traffic clear before the curfew. Night stars, passing cars with contact shadows, a sheltered bus boarding area and a front-view bus pictogram are episode extensions, not new café furniture.

The kitten, its shadow and its reaching paw remain invisible until shot 46. Early taps only shake the camera briefly. The long shape is shown through the fogged window. Latte has his blanket before the blanket line, plus a bed, food, water and an open hiding box. His pause, searching looks, scared crossing and doorway search precede the reveal.

The door swings rapidly from fully closed. The handle tilt follows the kitten's attempted reach; the eyes-shut shot uses a restrained dolly zoom. Mocha's blanket corner follows the actual mouth landmark from the approved Canvas head transforms, including walking, head tilt and turning. The cloth's fan direction stays fixed in world space; he lets it settle before the kitten's hesitant entry. Essie carries the water bowl by its rim and lowers the existing head drawing with it until the bowl rests on the floor. The original character drawing files remain unchanged.

The ending shows flowerpot → Latte → sign → dark alley kitten → invitation/entry, then the 11:11 clock and a wide aerial bus departure. A second, distinct alley cat is shown hiding and later emerging, so nobody teleports back outside. Mocha gets the slow smile push. The last sequence is friendly approach → dark street at eye level → safe cats, with the others settled.

**Preview-Polish.cmd now renders all revised shots at 540×960 and assembles `Polish_Narrated_Review_540p.mp4` with the continuous cached narration.** It resumes only validated matching shot clips, checks the encoded audio peak and full decode, and saves `PREVIEW_QA.json`. The preview includes one-word captions; music/Foley and native rendering remain the separate `Render-Polish.cmd` stage. No new preview movie has been rendered in the cloud. Review the complete local movie against the reference shorts before approving a native render.

The new full-preview assembly path passed syntax checks and correctly rejected incomplete/stale caches. Its end-to-end render/assembly and the revised pixels await execution on the Windows PC; no new preview movie exists in this cloud workspace.

## Clock/door/house continuity revision

Latest edit: **83 cuts**, still 3,349 frames / 111.63 seconds of continuous cached narration. Clock is a centered digital display only; its time does not reset between the home and café shots. The home-window clock shot uses the actual exterior clock. Stars now span a hemisphere, with distant town silhouettes and pedestrian routes on both road edges before curfew.

The unknown opener and their paw/contact shadow are hidden until the reveal. Each early opening now closes again before the kitten's failed attempts. The kitten retreats off camera when Latte approaches, emerges for the reveal, and makes a short jump toward the closed-door handle rather than stretching a paw. The ground shadow stays on the ground; landing gives a small camera kick. Wet-coat streaks remain visible.

The porch view is wider; the home sequence now covers entry, switch and scared reaction. Added cat tower and framed wall decorations supplement the existing bed, bowls and hiding box. Blanket close-up leads into empty-street suspense views; all three taps receive their own view, with increasing tension. The head-shake/box view pans within the home; Latte jumps at the next meow, then exits and searches while crossing. The shadow sequence stays on the window instead of cutting back to Latte mid-reveal.

The sign remains visible throughout its spoken invitation. The final bus shot is closer. Mocha has an accessible wall light control and activates a warm interior-light boost; other buildings remain dark in the street views. Original art files, café fixture layout, original composition, cached voices and music processing remain preserved.

All revised pixels and the new narrated preview assembly still require local visual review. Structural success does not establish that the acting, home staging, sky, or suspense reads well in motion. No scene/video render has been performed in the cloud.

## City clock tower and readable light count

The shared clock is now a city clock tower behind the café, with a single centered digital face. The home-window view targets that same tower over the café roof. Fourteen more mid-distance building façades fill out the existing skyline; the tower body, roof and spire share one stable location. Its display is treated as a battery-backed civic timepiece during the blackout, while building windows stay dark. There is no second café clock.

Each of the nine light inserts lasts exactly 12 frames (0.4 seconds). The sequence borrows 13 picture frames from the following reaction, retains every narration sample and adds no silence. The full edit remains 111.63 seconds, with 83 cuts. Revised framing and city readability still require actual local preview approval.
