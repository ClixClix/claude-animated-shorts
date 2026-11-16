# Latest requested nitpicks — 2% usage wrap-up

The supplied screenshot identifies the pale raised patch immediately outside the cafe door. The latest source replaces that patch with a subdued sloped threshold, inset into the sidewalk partition and flush with its levels. Paw support follows the same ramp.

Implemented in this pass:

- “Nobody knew why”: outlined question marks above the confused street cats; the shrug is removed.
- “Latte was afraid”: deterministic shivering and a clearer frightened pose. “Felt safe”: a visible happy/smiling expression.
- The chase/avoidance/moving-shadow alley is now a dark passage farther west down the block, separated from the cafe by a shop. It has bins, a mouse hole and connected paving. The cafe service passage still exists as permanent background geography.
- Three nearby infill buildings frame the cafe/opposite street. New facades and every distant 3D backdrop block have windows on all sides; narrow-building window spacing stays inside its actual walls. Existing 2D horizon layers remain.
- Latte's sign reaction uses the sign's actual direction in camera space, with matching head turn and pupils.
- The shelter kitten's route goes around the backup lantern and settles clear of it, instead of overlapping the lamp.
- Rain now has a near and distant field across the city, with a precomputed roof mask for the cafe, house, shelter and buildings. It is deterministic and avoids indoor rain. No new music/SFX/narration generation.

Technical verification: TypeScript/timing/story/rig checks passed. All 3,349 geometry/camera/contact states and 12,810 CPU Canvas-alpha checks passed with the new chase staging; no remaining recorded obstruction. Updated LOCAL video review is still required; no cloud scene/video frames were rendered. Do not claim visual approval from these checks.

No additional ElevenLabs calls are authorized. The separate 122.208s revised narration remains cached and NOT integrated into this existing edit. Paid approval for those three segments is consumed. Preserve the original movies and all audio caches. Read CONTINUATION_STATUS.md and EPISODE1_AUDIO_DELIVERY.md before continuing in a new chat.

---

# Latest wrap-up: pacing, entrance floor, skyline, switch and planter

The user clarified that the remaining floor glitch is **right before the cafe door**, and requested wrapping up at 3% usage. Keep this a small correction pass.

- “If they were all glowing” now cuts from a lit-lamp insert to Latte relaxing, on the existing narration word boundary. Speech and episode duration are unchanged; the edit now has 81 cuts.
- The cafe entrance has one solid stationary threshold joining the indoor floor and sidewalk; the old overlapping bottom rail is removed by the episode adapter. Shared support heights carry paws and shadows over it. Blanket/bowl support and fabric filtering were also stabilized.
- Two illustrated 2D skyline layers on all four sides sit behind the existing 3D city, with transparent roof silhouettes, no rectangular ink borders and real depth separation. They close distant road views without adding foreground clutter.
- The switch press remains in one steady close view through the spoken “Click”, then cuts to the reaction. The mechanical SFX cue uses that cached word timestamp. Existing nose interactions and lighting are preserved.
- The existing flowerpot has a solid rim, soil, stem and saucer. Its camera move settles before the cut, with matching framing on the detail shot.

TypeScript, current timing/contact/rig and revision-plan tests were run. Camera/geometry/alpha checks cover all 3,349 frames. No new audio generation or cloud scene rendering. Actual updated LOCAL visual review remains required; do not call a written/source change visually approved.

Run the same Windows source update and `Preview-Polish.cmd`. Keep old movies and cached audio intact. The separate 122.208s revised narration remains generated but NOT visually integrated; that is a distinct remaining task, and its paid approval is consumed. Read EPISODE1_AUDIO_DELIVERY.md before continuing.

---

# Final minor visual corrections — current source pass

Baseline supplied by the user: `Polish_Review_68c31d7f_540p.mp4`. The user says the episode is very close and requests minor fixes; do not rewrite or redesign. Checkpoint before this pass: `checkpoint/before-final-minor-fixes-20261115` (0a2fb31).

| Requested correction | Source change |
| --- | --- |
| Pole blocking “Whatever was out there” | Street and alley camera positions changed; the alley view runs down the gap, clear of the near lamp. No shot-specific pole hiding. |
| Sidewalk floor glitches | Removed the extra overlapping apron/sidewalk/lane boxes; those areas now share the partitioned city pavement mesh. |
| Jump on “nobody knew why” | Reaction and shrug use the same camera position rule and lens; no sudden zoom between 05B and 05C. |
| Most cats avoided the street: show alley/trash | Cat approaches the existing cafe service alley, pauses, turns away; the shot includes that alley with two grounded lidded bins. Supporting street routes clear the chase. |
| City ends in nothing | Added 526 fixed distant building/roof instances surrounding the district, within the existing ground extent. Atmospheric fade matches sky color; extended camera range includes the horizon. Existing nearby buildings/cafe remain in place. |
| Slip around puddle | Visible sideways skid with matching foot anchors, startled head/tail reaction and recovery at the existing slip cue. Lower, wider framing includes the puddle. |
| Last light/city background | Existing last-lamp insert retained; extended city backdrop fills the distance. |
| Whole street went dark | Wider oblique views show a street and several unlit houses with deeper city blocks, rather than a flat single-building view. |
| Messy sign sequence | Flowerpot detail -> Latte notices -> one stable front-facing sign push. No rapid wide camera swivels while the invitation is read. All sign edges are included in render QA. |
| Mocha opens cafe with nose | Small head nudge into a mounted door push plate, then fast opening/coasting; reaching paw hidden for this interaction. Plate/nose gap checked during contact. |
| Nowhere to go: show cat jumping before cut | Dumpster jump starts inside 58D, completes its 28-frame arc before that shot ends, and camera follows the same cat. Its continuous entrance route is preserved. |
| Light on with nose | Mocha faces the existing wall switch, makes a small head nudge and the button/lights respond. Reaching paw hidden; nose/button gap checked. |

## Verification

- TypeScript passed.
- 48,396 timing/contact checks, 30,072 story/caption/route checks and 12,087 rig/city checks passed.
- All 3,349 frame states passed geometry, camera, tested nose/cloth contact and asset checks.
- All 3,349 CPU Canvas/character-alpha states passed (12,796 checks); no recorded required-character occlusion. Indoor-kitten lighting correction remains included.
- New assertions cover skyline extent, shrug-camera continuity, actual skid, full bin-jump arc before the cut and all four sign edges.
- No cloud scene/video rendering, new voice generation or credit spending occurred. Source/CPU checks cannot establish finished visual appearance; updated LOCAL playback remains required.

## Run on Windows

Close Studio and video players, then run each line separately:

```powershell
cd C:\V2
powershell -ExecutionPolicy Bypass -File .\Update-Local-Code.ps1
.\Preview-Polish.cmd
```

A refreshed preview is needed because shared visual source changed. Original movies/audio remain preserved. Verified clips from this new source can resume after interruption. Do not bypass source/props validation to reuse older pictures.

This fixes the CURRENT EDIT with its existing narration. The separate 122.208s revised narration is already cached (258 credits, approval consumed), but its three new story passages still need visual synchronization. Do not pretend this pass integrates that recording. See `EPISODE1_AUDIO_DELIVERY.md` and `EPISODE1_STORY_POLISH_PLAN.md` for that separate remaining task. No further paid narration is authorized.
