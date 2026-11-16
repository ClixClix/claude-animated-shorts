# V2 release-quality baseline — all future episodes

**Reference:** the actual final encoded *In This Town — The Door at 11:11* MP4 reviewed November 2026. Its SHA-256 is `78f621b454e84214f1d0b3e244e7cb9e44ae49b5c9f571c649560eb680179374`. The reference is a **visual/technical bar**, **not** proof of music rights. Never use the reference MP4 or its music as an asset in new episodes.

## Non-negotiable delivery standards

- Native **1080 × 1920, 30 FPS**, H.264 MP4; AAC stereo 48 kHz. Render real native frames, not a scaled 540p preview.
- Fully decodable video **and audio**; actual frame count must equal the approved edit, with no truncated start/end or missing shots. Supply the edit's expected frame count to release QA.
- Integrated loudness target **−16 LUFS ±2**; encoded true peak **≤ −1 dBTP**. Verify the *encoded MP4*, not only the pre-encode WAV. Reference measured −16.46 LUFS / −1.80 dBTP.
- Narration/voice intelligible, timed to real dialogue; purposeful music with speech ducking; **frame-synchronized, audible comedic/story SFX**, not an empty ambience track. No unintended dead air, clipping, music gaps or missing impacts.
- Subtitles, when used, remain readable, correctly timed and attached to the intended screen location. Avoid drifting or floating text. Maintain mobile-safe composition and text.
- Consistent character models/markings/scale, usable scene geography, grounded feet/props, no intersecting floor/sidewalk surfaces, no clipping, teleporting, frozen action or camera passing through objects.
- Motivated camera movement, purposeful reactions and staging. Preserve cinematic depth and lighting while ensuring essential subjects are readable even in dark scenes. Background activity is appropriate to story and location.
- Final film must be reviewed **from the actual encoded file**, on a phone and headphones. Contact sheets, source checks and automated reports alone do not certify acting, humor or visual quality.
- Only distribute music, narration, SFX, models and artwork with documented appropriate rights. **A Content ID pass is not a license.** If the music is not cleared, use the licensed/no-music master.

## Series-specific creative requirements

**What If Cats** (café comedy): hook in the first 0–3 seconds; clear Essie/Mocha/Latte characterization; escalating visual jokes; lively café background with stable two-counter geography, pastries/register/coffee equipment where appropriate; motivated push-ins, reaction cuts, impact shakes, meows and Tom-and-Jerry-like *original* SFX tightly hitting action. Do not turn a 35–45 second comedy into a 111-second narrated mystery just to match the reference. No inert shots or generic looping camera movement. Match episode-specific story continuity.

**In This Town** (narrated mystery): immediate intriguing rule/exception, escalating clues, deliberate conceal/reveal, coherent night lighting and geography, a readable emotional payoff, and an accurate narration-driven shot plan. Do not apply the café comedy's gag rate to atmospheric suspense.

**Both:** Quality is **clarity + intentional acting + finished sound + reliable delivery**, not simply higher bitrate, more shakes, more SFX, or longer runtime.

## Production checkpoints for every new episode

1. **Preproduction:** lock script, characters, geography, continuity, shot IDs, target frame count, caption treatment and rights plan. Never auto-spend voice credits.
2. **Staging:** verify shared world/floor meshes, contact surfaces, readable acting and camera paths; run TypeScript and relevant episode/rig regressions.
3. **Proof:** inspect native storyboard and consecutive frames around every contact, reveal, turn, cut and important SFX hit; compare actual film to this baseline, not to source code.
4. **Sound:** mix narration/dialogue, original/licensed SFX and licensed music in independent stems; check sync, ducking, pacing and master true peak.
5. **Final export:** render and assemble native MP4; run the reusable release gate on the **actual final MP4**, with the approved frame count.
6. **Creative/rights signoff:** watch the whole finished video, check on mobile, complete the exact-file review JSON and clear rights. **No release-ready claim** without both automated technical pass and signed human review.

## Run the reusable gate (Windows, from `C:\V2\studio`)

```powershell
& "C:\V2\.venv\Scripts\python.exe" scripts\release_quality_gate.py "C:\path\to\FINAL.mp4" --series what_if_cats --expected-frames 1200 --init-review
```

Replace `1200` with the **actual approved frame count** (not an assumed duration), and change `--series` to `in_this_town` as appropriate. This creates `FINAL.release-qa.json` and `FINAL.release-qa.md`, plus a **default-false** `FINAL.review.json`. The review file is never auto-approved or overwritten. Edit it only after personally checking the exact MP4 and rights; the SHA-256 prevents approving an older render by mistake.

For the **final publish gate**, run the same command with `--require-approval` instead of `--init-review`. It exits nonzero on technical failure or missing human/rights approval. A technical-only run returns success for technical passing while clearly reporting `NEEDS_CREATIVE_AND_RIGHTS_REVIEW`.

Test the gate itself offline:

```powershell
& "C:\V2\.venv\Scripts\python.exe" scripts\release_quality_gate_test.py
```

No paid generation, no new render, no publishing action. The checker only reads the MP4 and writes reports.