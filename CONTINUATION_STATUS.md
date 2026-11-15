# Current What If Cats V2 status

Delivery branch: `v2-local-render`. Worktree branch may differ. Inspect Git status/log before edits. Preserve uncommitted files and prior movies.

## Latest review and requested small fix

The user uploaded `Polish_Review_68c31d7f_540p.mp4` (111.633s / 3,349 frames) and says the visuals are very close. Keep changes small. Latest explicit request: **kittens must not remain dark once inside the cafe**.

This lighting fix is implemented in source: supporting cats now use the existing illustrated-character `cardShade`, with a smooth position-based transition to warm cafe light. The main kitten uses the same doorway-position tint. Dark alley guests stay dark while outside the side wall. No character artwork, cafe geometry, lamps, routes, narration or music changed in this pass.

Frame samples across all 80 cuts of that exact uploaded source hash were inspected. Updated source has not been rendered in the cloud. TypeScript/story/rig checks and all 3,349 CPU character-alpha states passed. New assertions check readable warm indoor guest materials, zero emissive intensity and no cafe light leaking onto alley cats. Actual updated local playback remains required.

On Windows: update source, then `Preview-Polish.cmd`. This renders the existing edit with the latest visual corrections and the ORIGINAL narration. No API credit use or narration generation is involved. The user renders locally at C:\V2; no cloud scene/video rendering is authorized.

## Approved story-narration revision: audio complete, visual integration pending

Read `EPISODE1_AUDIO_DELIVERY.md`. Three authorized narration patches succeeded once for **258 actual credits**, below the 646-credit cap. Authorization is consumed. `generation-receipt.json` records completion and blocks another generation. Never regenerate missing local audio; restore the encrypted cache instead.

The revised composite is 122.208 seconds, true peak -3.01 dBTP, with unaffected source speech retained. Files and actual provider-aligned timings are cached. `timed-storyboard.json` has 19 written affected-shot directions/timings, NOT actual rendered frames. Original/processed caches and an encrypted local transfer are preserved. The unlock code is in the previous chat; never commit it or an API key.

The new opening, dark-alley mouse chase, open-door kitten discovery and Latte helping still need their focused visual implementation/synchronization. The current preview does NOT include those revised spoken passages. `EPISODE1_STORY_POLISH_PLAN.md` maps source changes; `EPISODE1_STORY_POLISH_COMPARISON.md` contains exact before/after lines. Their old pending-approval text is historical and superseded by the completed generation receipt.

Preserve the emotional ending, approved character designs, cafe fixtures/style, original BridgeShort and previous compositions. No full episode rewrite or next episode. Maximum shot length four seconds; one subtitle word at a time; no added narration gaps.

## Continuation and local workflow

Read `HANDOFF_FOR_CHATGPT.md`, `CREATIVE_AND_QA_GUIDE.md`, `REFERENCE_QUALITY_NOTES.md` and `CHATGPT_CONTINUATION_PROMPT.md`. For a chat without repo access, use `Export-ChatGPT-Context.ps1` and upload the source ZIP plus the latest actual review movie. Upload the revised MP3/metadata separately if needed; a new chat cannot infer private cache contents or inherit previous attachments/tools.

Original cached Adam at straight 1.35x varispeed remains selected; Daniel and Sawyer fallback are unchanged. No new paid narration is authorized. Keep private music/reference media/credentials outside public Git. Source updates must remain in `LOCAL_UPDATE_FILES.json`; installed Windows updater rejects `references/...`.

Do not claim reference-level visual quality from compilation or CPU geometry/material tests. Verify the exact updated LOCAL movie and encoded audio. Source-export/private-restoration scripts target Windows, but actual Windows execution is not verified in this Linux session.
