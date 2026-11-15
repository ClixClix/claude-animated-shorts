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
