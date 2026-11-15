# Current source candidate: request-by-request record

Latest reviewed movie: `Polish_Review_d73d13af_540p.mp4`. The delivery branch was fetched before work; it matched commit `015fdd1`. Existing code was retained and corrected rather than importing a different engine.

| Request | Implemented source behavior |
| --- | --- |
| Sun high in sky | Large 3D sun above the skyline, continuous dusk-to-night fade |
| Glitching street | One partitioned road union with continuous UVs, disjoint sidewalks, and grounded building footings |
| City layout | Connected street junctions/sidewalks and a properly bounded cafe service passage |
| Confusion and avoidance | Door context, confused reaction/shrug, then a hesitant cat taking a separate paved lane |
| Realistic lights | Nine stable sidewalk lamps with useful spacing; cameras target the actual lamp coordinates |
| Mouse chase | Shared deterministic chase path along pavement into the alley, visible mouse leading the cat and retreating to a service hole |
| Bus-stop glass | Side and rear glazing with an open road-facing boarding side |
| Last streetlight | Failure occurs inside its own close-up, before the dark-street view |
| Whole-street blackout | Camera faces unlit residential buildings opposite the cafe; cafe is behind the camera |
| Door/blanket/shake | Directly visible cloth hidden before the later shadow beat; brief door-impact kick |
| Third tap/window | All three home angles retain the same permanent window behind Latte |
| House | Framed art, curtains, bookcase/books, rug, bed/cushion, cat tower, reading lamp and wall finish, placed around clear routes |
| Alley movement | An unidentified moving shadow on the alley wall, without revealing the hidden kitten |
| Narrow urban alley | Brick neighbor, a roughly 2.4-metre passage, back boundary, wall-mounted fire-escape structures, grounded storage and utilities |
| Window-to-window view | Continuous view through the home window, zooming/tilting toward the cafe shadow and ears |
| Nose tap | Wider aligned side view, stop before contact, small head nudge and button movement |
| Cafe paintings | Two framed procedural landscape paintings on the existing cafe wall |

## Verification scope

TypeScript, the existing cafe/animation/narration/original-episode regressions, source timing/story/rig tests, full-world initialization and source bundling were exercised. The geometry pass evaluates all 3,349 frames. The CPU character-alpha pass also evaluates all 3,349 frames and includes the mouse and important story subjects; it does not render a WebGL scene or video. See the generated local `CAMERA_GEOMETRY_PREFLIGHT.json`, `CARD_ALPHA_QA.json`, `STRUCTURAL_QA.json` and `RIG_AND_CITY_QA.json` for machine-readable evidence after running the commands.

The narration remains the approved cached recording: 3,349 frames / 111.63 seconds, 80 cuts, maximum 105 frames per shot, 364 single-word caption cues. No paid voice request or new episode was made.

**The updated movie has not been rendered or visually approved in the cloud.** Actual motion, taste, pixel artifacts, Windows behavior and encoded delivery still require the new local movie. A passing marker/alpha/geometry check cannot certify reference-level visual polish.

Environment changes invalidate the previous preview's visual cache. A full refreshed local preview is required; original movies remain preserved, and valid clips from this new revision can resume if interrupted.

### Completed technical results for this candidate

- Existing regressions: 104 cafe layout checks, 2,167 original animation checks, 25 narration tests and 66,028 original-episode checks passed.
- Current polish: 48,418 timing/contact/asset checks; 30,006 story/caption/route checks; 11,866 rig/city checks passed.
- All-frame geometry: 3,349 states, no recorded camera collision, required-subject obstruction, missing asset or tested contact failure.
- All-frame CPU character alpha: 3,349 states, 3,802 checks, no recorded required-subject occlusion. This includes the mouse, window views and ending actors.
- TypeScript, full Remotion source bundling and the 177-file Windows update manifest passed validation.
- Actual Windows execution of the new source-export script and the revised movie remain pending on the user's PC. No cloud scene/video render or paid generation was performed.
