> **Update:** The user approved these exact three patches. They were generated once for 258 actual credits; approval is consumed. See `EPISODE1_AUDIO_DELIVERY.md`. The proposal below is historical. Actual timing is in `timed-storyboard.json`; visual integration remains pending.

# Episode 1: small story polish, prepared for approval

Authoritative delivery branch: `v2-local-render`. Recoverable checkpoint: `checkpoint/episode1-before-story-polish-20261115` at `5b8892f5619e093659f0cde695a5b07b10353e44`. The previous visual candidate and all cached audio/movies remain preserved. This proposal is not active narration and is not a rendered movie.

## Scope and current implementation

Keep the approved cats, cafe, home, city, soundtrack, rendering style and mystery. Three focused narration replacements are proposed. Retain every other spoken line, including the exact emotional ending. Do not generate the full episode again.

The user's additional small visual corrections are independent of paid narration and implemented in the existing polish source: nine lamps in two regular curb rows at six-metre spacing, lamp cameras referencing those actual positions, and a restored window-to-door pan on “It moved toward the door.” Original cafe source stays unchanged; the episode adapter places its street fixtures. Geometry/character-alpha checks must verify the new framing; actual local motion still requires review.

The mouse chase storyboard now explicitly enters a **dark narrow alley next to the cafe**. Streetlight spill establishes its mouth; deeper shadow conceals the mouse. Do not add lamps deep in the passage. Preserve the connected geography, existing mouse/service hole and the approved artwork.

## Deliverable files

- Full revised script: `studio/src/v2/episodes/door-at-1111-story-polish/narration.txt`.
- Exact replacements and cached-source identities: `revision.json` in that directory.
- Nineteen affected-shot descriptions: `storyboard.json` in that directory. These are written storyboard directions, not rendered images.
- Local preparation command: `node .\studio\scripts\door-story-polish-plan.mjs` from `C:\V2`. It makes no API requests and does not change the active edit, captions, audio or movies.
- Generated before/after comparison, old affected-shot IDs, splice ranges and timing estimate: `studio/out/v2-episodes/door-at-1111-story-polish/STORY_REVISION_PLAN.md` and `.json`. It also writes the full script and three exact patch texts there.

## Narration proposal and timing

Use existing Adam `pNInz6obpgDQGcFmaJgB`, model `eleven_multilingual_v2`, unchanged voice settings and natural provider speed 1.0. Apply the approved straight 1.35x varispeed once to each original replacement recording. Keep original and processed caches separate. Daniel, Sawyer fallback and all archived takes remain unchanged.

| Replacement | Exact raw characters | Conservative estimated credits | Existing processed interval |
| --- | ---: | ---: | --- |
| Opening (including removal of generic street avoidance) | 196 | 196 | 0–11.506667s |
| Mouse chase motivation | 188 | 188 | 17.027778–19.714815s |
| Wet kitten, open door and Latte helping | 262 | 262 | 70.613704–76.143333s |
| Total: three separate one-time requests | 646 | 646 | Retain 91.897891s of existing audio |

The proposed full script is 2,352 characters, compared with 2,068 originally. **Only the 646 replacement characters are proposed for synthesis.** One extra proposed help line is: “Latte was still shaking. But he gave her a gentle nudge toward the light.” His nose-to-shoulder contact is gentle and grounded; the kitten stays at the threshold until the reassuring reveal.

Credit estimates assume one credit per raw input character. The original request's observed discount is historical, not a current account quote, and is not assumed. No new account pricing or credit debit has been checked. No paid call is authorized by this plan.

Estimate from the existing take's measured character rate: about 126.77 seconds centrally, with a provisional 119.79–133.74s range. This is not a duration target. Actual patch prosody, joins and provider alignment determine the edit. Keep all shots at most four seconds, and split a new shot if actual speech needs it. Do not stretch a chase at half-speed merely to fill longer words.

The splices are at word-free sentence boundaries according to cached alignment. Inspect waveform/playback before assuming acoustic silence. Preserve retained spoken samples; make only brief silence-boundary de-click joins without eating consonants or adding narrative pauses. Listen for timbre/prosody differences. A poor seam requires review, not an automatic paid retry or full regeneration.

## Source changes required after paid approval

| Area | Focused change |
| --- | --- |
| `door-polish-prepare.mjs` editorial preparation | Consume a separately cached composite with provider-aligned patches; keep the current recording immutable. Rebuild unit mapping rather than relying on old sentence indices. |
| `timeline.ts` opening camera/acting | Cafe and time in the first three seconds, then house directly opposite and Latte afraid. Drop city/sunset, confusion crowd and avoidance filler for this intro; preserve those assets. No Mocha reveal. |
| Chase timing and `mouseAt` | Add notice, shared lit-to-dark alley route, stop and turn back. Preserve cadence/contact instead of scaling the entire old chase clip. Keep failing lamps at their real positions. |
| `doorAngleAt`, shot 47 and kitten path | Hold the door partly open from the night's swing through discovery. Remove handle jump, closed-door insert and contradictory present-day reopening. Keep any explicit explanatory flashback separate. |
| Kitten tapping and help | Show the wet kitten beneath the window producing a quiet tap with actual sill contact, hesitation, Latte's gentle nose nudge and release. No unsupported paw stretch. Entry remains continuous and follows reassurance. |
| `Episode.tsx` and world adapters | Reuse approved cards/geometry/materials, wet-coat overlay and existing shadow projection; no new art/environment. Keep opener hidden through the giant-shadow sequence. |
| Captions, SFX and storyboard cuts | Derive all new word/cut/sound timing from actual recordings. One subtitle word at a time. Re-align tap/contact sounds, retain music/clean-loop pipeline. |
| Story tests and renderer | Replace the old closed-door/handle assertions with held-open, contact, entry and reveal tests. Existing coverage assumes old shots 5/6; update the required story-beat contract deliberately. |

The original renderer's full source/props hash prevents automatic reuse of stale clips. Preserve existing cache files; do not bypass hash validation or mark old pictures approved under a new edit. Targeted previews come first. Write the revised composition/delivery into the separate story-polish output directory; do not overwrite existing finished videos.

## Targeted preview and acceptance plan

1. Hook: cafe/11:11 readable by three seconds; house clearly opposite, no premature opener or sunset at 11:11.
2. Chase: notice -> mouse leads -> dark alley -> stop/turn -> actual first lamp. No path teleport or poles crossing the action.
3. Suspense: restore continuous pan from the long shape at the window toward the door on the existing line; identity remains concealed.
4. Reveal/help: same open door in all angles; visibly wet kitten taps and hesitates; Latte chooses contact while still afraid; no handle attempt. Check consecutive frames through contact/release.
5. Entry/payoff: no backward reset, early Mocha or conflicting second opening. Retain the emotional ending and Latte beside the kitten while the street stays dark.
6. Narration: complete retained speech, natural patch joins, no new gaps, one-word captions and SFX aligned, encoded true peak at or below -1 dBTP.

Run TypeScript, existing regressions, current story/rig/geometry/alpha checks and new revision-plan tests. Compilation does not establish visual quality. Render the affected local motion samples, inspect them with audio, then request a complete local preview. Native final output follows that review.

## Windows commands and paid boundary

Available now, without generating audio or rendering:

```powershell
cd C:\V2
powershell -ExecutionPolicy Bypass -File .\Update-Local-Code.ps1
node .\studio\scripts\door-story-polish-plan.mjs
node --test .\studio\scripts\door-story-polish-plan.test.mjs
```

To review ONLY the independent lamp/pan corrections against the existing narration, the current renderer supports targeted real motion samples:

```powershell
cd C:\V2\studio
node .\scripts\door-polish-render.mjs motion --shots 11,15,16,17,24,41 --concurrency 2
```

Those samples are in `studio/out/v2-episodes/door-at-1111-polish/motion/`. They are silent picture samples with the original timing, not the proposed revised narrated episode. The existing complete preview command remains `C:\V2\Preview-Polish.cmd`; it still uses the old approved narration until a separately authorized revision is integrated.

**The revised story has no executable render composition yet.** Supplying final-render commands for it before recordings, timestamps and integration would be misleading. Exact targeted narrated-preview and native-delivery commands will be provided with that authorized implementation, using the separate output directory. Do not run a full native render to validate this proposal.

Next paid boundary: request approval for three one-time patch requests, estimated total 646 credits, no automatic retries. After approval recheck non-billable authentication/voice/model access, journal each attempt, retain each original response, process offline, inspect joins, implement the new timing and run local targeted review. Approval for old auditions/the old full take does not cover these calls.
