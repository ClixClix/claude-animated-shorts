# Episode 1 story narration: completed audio handoff

The user approved three one-time patch requests up to 646 credits. All three succeeded once. Provider history confirms **258 credits total** (opening 78, chase 75, kitten reveal 105). No retries and no full-recording regeneration occurred. **This paid approval is consumed.** `studio/src/v2/episodes/door-at-1111-story-polish/generation-receipt.json` is authoritative; the generator refuses another run. Restore missing files instead of regenerating.

The revised composite is `studio/out/v2-episodes/door-at-1111-story-polish/Narration_Story_Polish.mp3`: **122.208 seconds**, encoded true peak **-3.01 dBTP**, full script aligned, last word complete. Original and processed patches are cached separately under `studio/out/v2-narration/story-polish/`. Approved Adam and straight 1.35x varispeed remain unchanged. Existing narration, captions, movies, Daniel and artwork are untouched.

## Verified audio work

All three patches decode and measure below -1 dBTP. Assembly uses the existing recording for unaffected passages. The float WAV was decoded again and matched the concatenated source samples exactly; no extra speed change, gain change or inserted narrative pauses were applied. The final MP3 was measured after encoding. Splice sample steps are below 0.0005. These checks establish identity/coverage/peak safety; **human listening approval for prosody, timbre and pronunciation is still pending**.

Actual provider-aligned timings for all 19 written patch shots are in `timed-storyboard.json`; longest affected shot is 2.262s. Those timings are ready for staging, but are not actual rendered storyboard images.

## Private transfer to Windows

The source update contains `studio/assets/story-polish-audio.payload`, encrypted with AES-256-GCM and a separately supplied chat unlock code. It includes 27 private audio/metadata files. No API key, music, private photos or reference footage is included. The unlock code is not stored in Git.

After updating from `v2-local-render`, run from C:\V2:

```powershell
node .\studio\scripts\restore-story-audio.mjs --unlock "THE_TRANSFER_CODE_FROM_CHAT"
Start-Process ".\studio\out\v2-episodes\door-at-1111-story-polish\Narration_Story_Polish.mp3"
```

Restoration verifies hashes and rejects a conflicting existing file. It never contacts ElevenLabs. Fresh restoration, repeat verification, wrong-code rejection and conflict preservation passed on Linux Node 24. Actual PowerShell/Windows execution has not been tested here.

Offline rebuilding (after restoring patches) is `node .\studio\scripts\door-story-polish-audio.mjs`. It does not generate speech. The WAV is intentionally omitted from transfer; rebuilding recovers it using the existing original episode recording.

## Remaining visual work: explicit handoff

**The current polish movie still uses the old narration. Do not claim the story revision is integrated or render-ready.** No new video was rendered in the cloud. Lamp placement, occlusion camera adjustments and the restored window-to-door pan are already in source; the three revised passages still require visual integration, targeted LOCAL motion previews, then the complete LOCAL review.

Use `EPISODE1_STORY_POLISH_PLAN.md` for the precise source map and constraints. The next implementation should:

1. Remap retained scenes using actual audio `mapping` in `Narration_Story_Polish-timestamps.json` / `timed-storyboard.json`; keep the previous composition and finished outputs intact.
2. Stage cafe/time by three seconds, then Latte at the house opposite; keep Mocha concealed. No sunset at 11:11 or filler avoidance shots.
3. Show notice -> mouse leads into the DARK existing side alley -> stop/turn -> actual streetlamp. Preserve supported steps and geography.
4. Keep the door partly open from the night's opening through the reveal. Replace old shot 47/closed-door/handle tests. Place the wet kitten beneath the existing cafe window, give her an actual small tap/contact, then a clear but gentle nose-to-shoulder encouragement by Latte. Keep the later entrance monotonic. Do not leave the old door-side position and merely change the spoken words.
5. Retain the scary projected Mocha/blanket shadow, restore the window-to-door pan, reveal Mocha at the right point, and preserve the exact emotional ending.
6. Rebuild one-word captions and SFX from actual timings; 11:11 should be one readable time token. The transferred word-cue data is a timing aid, not the final subtitle layout.
7. Re-run applicable regressions/geometry/character-alpha checks, then inspect real targeted LOCAL motion and audio before a full LOCAL render. Do not overwrite old movies or bypass stale-source cache validation.

Do not spend more credits, redesign characters/environments or begin another episode. If a continuation chat lacks runtime files, upload the revised MP3/metadata or restore the encrypted cache on the local PC; never reissue the paid calls.
