# Latest supplied screenshot and nitpicks

The newest source pass is documented at the top of LAST_MINOR_FIXES.md. Preserve the 2% wrap-up and review the updated LOCAL movie next. Original previews/audio remain intact. No new paid narration or cloud scene render.

---

# Current five-fix wrap-up

See the top of LAST_MINOR_FIXES.md for the latest source candidate and user clarification about the cafe threshold. The preceding twelve-fix pass remains preserved. Current movie timing/audio is unchanged; visual approval requires the new local render. No paid requests were made.

---

# Newest correction list

`LAST_MINOR_FIXES.md` supersedes earlier request lists for the latest source candidate. All twelve requested fixes are implemented and technical frame checks passed; updated local motion/visual approval remains pending. The separate new-narration visual integration is still pending.

---

# Latest: indoor kitten lighting

Baseline visually sampled: `Polish_Review_68c31d7f_540p.mp4`, all 80 shot midpoints. Supporting kittens were visibly much darker than the leads inside the cafe. The cause was plain Lambert shading combined with a scene-time/route-progress dark multiplier.

The correction reuses the existing illustrated `cardShade` and uses actual ROOM boundaries for a smooth warm doorway transition. Indoor guests now retain readable faces/coats; outside alley cats stay dim. The main kitten shares the same position-based tint. No new lights, artwork changes, layout changes, paid audio or cloud scene renders.

TypeScript, 29,982 story/caption/route and 12,082 rig/city checks passed. All 3,349 CPU alpha/material frame states pass, including readable indoor guest materials, no emissive glow and no interior tint through the alley wall. This is technical evidence; updated local visual approval remains pending.

The three new narrated story passages remain a separate pending visual-integration task; their audio generation is complete for 258 actual credits. See CONTINUATION_STATUS.md and EPISODE1_AUDIO_DELIVERY.md.

---

# Latest update: narration approved and generated

Read `EPISODE1_AUDIO_DELIVERY.md` first. The three approved patch calls are COMPLETE: 258 actual credits, no retries. Their 122.208s composite and original/processed caches are preserved and available via encrypted local transfer. The approval is consumed; do not request the same authorization again or regenerate missing audio. `generation-receipt.json` records the result and blocks repeat calls.

Visual synchronization of those three passages is STILL PENDING. Existing lamp/pan source fixes are delivered, but the active movie/edit retains old narration. Actual timing and the 19 written shot directions are ready in `timed-storyboard.json`. Finish the remaining focused staging locally using the exact source-change map, preserve the working old composition, and do not claim completion based on audio QA. The user has low usage and wants only small changes.

Earlier pending-approval text below describes the frozen pre-generation proposal and is superseded by this update.

---

# Latest small correction pass and pending story proposal

The user considers the episode very close and wants small changes. Current source adds orderly curb-row lamps, cameras derived from actual lamp positions, adjusted chase/cafe framing for pole obstructions, and the restored window-to-door pan. Actual updated local playback remains pending.

The separate story proposal changes only three narration passages; it is not integrated or generated. Read `EPISODE1_STORY_POLISH_PLAN.md` and `EPISODE1_STORY_POLISH_COMPARISON.md`. The exact 646-character patch request still requires explicit paid approval. Dark-alley chase motivation and new open-door kitten/help sequence must be timed after those actual recordings exist.

## Current pass: completed technical evidence

- TypeScript and existing 104 cafe / 2,167 animation / 25 narration / 66,028 original-episode regressions passed.
- Current edit: 48,418 timing/contact checks, 29,982 story/caption/route checks and 12,082 rig/city/curb-placement checks passed.
- All 3,349 frame states passed geometry/camera/contact checks and 3,802 CPU character-alpha checks. Lamp occlusions found in the chase/cafe approach were corrected by camera staging. No scene/video frames were rendered in the cloud.
- Five new offline plan test groups passed, including stale cache/script rejection, word-safe splice boundaries, missing help action, premature reveal, shot length and paid-authorization guards.
- Source update manifest: 185 present, unique source files. Existing narration, captions and shot edit remain unchanged; the proposed three-patch recording has not been generated or integrated.
- Local Windows execution and actual revised movie appearance are not certified by these checks.

---

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
