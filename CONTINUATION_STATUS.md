# LATEST — Episode 02 main source reuses real Episode 01 assets, not puppet redrawing (2026-11-17)

User explicitly asked **"please use the items in ep1 to make ep 2"**. Source edits committed to `v2-local-render`. These are SOURCE-ONLY; **no local TypeScript compile or new visual render has occurred yet**. No publishable episode and no paid voice generated.

Exact reuse in `studio/src/v2/episodes/in-this-town-02/Episode.tsx`:
- Swapped out `makeCharacter()` and generic `createCatCard()` for **`createEpisode1CastCat('mocha'/'essie'/'latte')`**; in `episode1Cast.ts` this calls the literal `createEpisodeCat(id)` from Episode 01 `door-at-1111-polish/actors.ts`, retaining the **original full cat drawings, shaded material, true 4-leg planted walking art, ink and original palettes**. It adapts EP02 timed `ActorPose` to EP01's `Actor` interface and disables unrelated episode1 timed nose/head gestures (EP01 frame/t 0). It does NOT generate a new imitation or replace a lead palette.
- Original `createKitten()` from EP01 `animation/kitten.ts` replaces the recycled/recolored Essie demonstration cat.
- Original `TownPopulation` is reused as background onlookers only; no simplified extras promoted as lead cats.
- Same `EpisodeWorld`, café fixtures and original streetlights, shelter, alley storage/dumpster/service dressing, Episode1 `LensBlur`, ink, grade and shade.
- Distinct Episode2 magical props still new because EP1 never had the required four identity boxes; demo uses correctly small `createEpisodeBox('demo')`, demo home changed to [1.8,0,5.35] and `cameraDirector` uses real demo dimensions.
- Keeps 60-shot story order; rescues Essie then Latte. The black-screen/shrink-to-box morph in draft is NOT yet visually solved. Don't claim professional finished movie.

**New local low-cost test**: sync, then double-click `C:\V2\Build-Episode02-EP1-Assets.cmd` or run `node scripts/episode02-episode1-assets-preview.mjs` from `C:\V2\studio`. Runs static source authenticity contract, TypeScript preflight, then outputs 12 genuine 540×960 still images of 02 storyline (shots 05,06,07,12,19,37,49,50,54,55,59,60) plus JSON report in `out\v2-episodes\in-this-town-02\ep1-asset-reuse-proof\`. No full 60-shot render/audio/spend. Need upload 4 representative stills for review and error log if preflight fails. `LOCAL_UPDATE_FILES.json` includes new adapter, script, doc and launcher. `episode02-render.mjs` hash includes EP1 reused source to prevent stale cached segments.

**Crucial caveat**: Source wiring confirmed by retrieving GitHub files, but full TypeScript build and visuals have NOT been run on user's Windows machine. Do NOT call it Episode1-quality until camera, box contact and morph tests pass real output review. The old independent failed `articulatedGuest.ts` still exists for history but is NOT imported by main Episode2 production.

Reference design documentation: `studio/src/v2/episodes/in-this-town-02/EPISODE1_ASSET_REUSE_CONTRACT.md`.

---

# LATEST — New articulated Episode 2 shot-01 performance proof source committed (2026-11-17)

User responded **"go"** to the reset plan after rejecting the third 4-shot Episode2 pilot. Source work has been committed to branch `v2-local-render`; it is **NOT** visually approved or locally rendered by ChatGPT.

**New isolated proof:** `studio/src/v2/episodes/in-this-town-02/articulatedGuest.ts` implements a separate Episode01 `drawCat` painted head, torso, four grounded paw cards, independently wagging tail, contact shadow, and deterministic pure 78-frame choreography (grounded walk -> crouch -> elevated rim-clear jump -> land -> settle). Old single-card `Episode02Part1.tsx` is not modified or approved. `Shot01Performance.tsx` is an independent Remotion composition `InThisTownEpisode02Shot01Performance` with original Episode01 town and original 3D cardboard box. `SHOT01_PERFORMANCE_BLUEPRINT.json` defines the 2.6-second beat sheet, camera and **provisional** clear space at [1.8,.04,5.35]. No paid narration.

**New render command:** after syncing with `C:\V2\Update-Local-Code.ps1`, double-click `C:\V2\Build-Episode02-Shot01.cmd` or from `C:\V2\studio` run `node scripts/episode02-shot01-performance.mjs`. It typechecks; renders 10 actual 540x960 frames; audits physical bus-stop/streetlight set collisions, four subject sightlines, premature rim crossing, and clipping. If blockers are found, deliberately **skips MP4** and saves stills plus `SHOT01_PERFORMANCE_QA.json`; else encodes only a 2.6-second `SHOT01_PERFORMANCE_PREVIEW.mp4`. All outputs: `out/v2-episodes/in-this-town-02/shot01-performance\`. New source and launchers included in `LOCAL_UPDATE_FILES.json`.

**Verification performed this turn:** fetched all new paths from GitHub, checked composition ID registration, per-part pivots, deterministic jump, set/QA gates, README/launchers/manifest, and calculated the jump curve independently for 78 frames: no early wall crossing at the body halfwidth used by QA. **NOT DONE:** local TypeScript compile, actual Remotion render and visual inspection. DO NOT claim Episode1-quality output or proof success until user sends rendered video and QA.

**Editorial trajectory:** If this one shot looks good, extend reusable performer to shot02 curling, shot03 genuine material/shape change, shot04 coordinated reaction cast. Then build story-driven one-prompt generation and automatic frame review. A single-prompt autonomous full episode pipeline DOES NOT exist yet; current system is a prompt-like JSON beat sheet plus a one-command local render and error gate.

Prior failure and grounds for this pivot: `THIRD_RENDER_REJECTION_AND_RESTART.md`, originals remain rejected.

---

# LATEST — Third real Part 1 preview REJECTED; stop four-shot render churn (2026-11-17)

The user uploaded third Episode 2 opening pilot `Part1_01-04_PREVIEW(2).mp4`, `PART1_RENDER_STATUS(2).json`, and 12 real PNGs; explicitly said **"this isnt it"**. Video shows bus-stop shelter glass+roof+bench directly over the brown demo cat and box (shot01), flat floating illustration head/oval curled body (shot02), face sinking into box rather than magic metamorphosis (shot03), and blue witness obscured behind bus-stop bench+glass with the other two bunched in front (shot04). Report has NINE SUBJECT_CROP warnings and no static world occlusion warnings; check does not yet cover bus shelter. **All four shots rejected, do not claim on-brand.**

Root-cause source inspection: the immutable Episode1 `EpisodeWorld.busStop()` constructs at `(-4.4,0,5.8)` with roof/glass/platform extending toward x≈-2.95. The previous demo `SITE=(-2.5,.04,5.35)` and cat approach x≈-3.6 were literally inside the shelter footprint. A camera tweak cannot fix that. `world.blockers` excludes that non-solid transparent geometry. Detailed audit in `studio/src/v2/episodes/in-this-town-02/THIRD_RENDER_REJECTION_AND_RESTART.md`.

After analysis, GH source changes **only** (UNRENDERED):
- Proposed safer `SITE=(1.8,.04,5.35)` and four cameras in `PART1_SHOT_BLUEPRINT.json`; must actually confirm against scene geometry.
- New `setCollisions` (actual AABB mesh footprint) and `setOcclusions` (five subject sample rays against named bus-stop/streetlight groups) in `Episode02Part1.tsx`; not just solid blocker list. QA flags new `SET_OBJECT_INTERSECTION`, `SET_DRESSING_BLOCKS_ACTION`.
- `node scripts/episode02-part1.mjs --shot01` now isolates **frame 0–26 only (0.9s)** plus six actual PNG frames in `out/v2-episodes/in-this-town-02/shot01-blocking-test/`; writes `SHOT01_BLOCKING.mp4`, `SHOT01_QA.json`. User should **not** re-render all four shots next.
- Source-sync manifest includes all new files.

CRITICAL: Fixing bus shelter will **not** fix the fundamental animation: guest is still a **flat card**, hop is keyframed transform only, and "morph" is global shrink+opacity+paper facet accents. To approach Episode1 artistic standard and future one-prompt pipeline, redesign as reusable articulated 2.5D guest performer with grounded head/body/paws/tail actions and an actual readable paper-to-box transformation, plus a feedback loop that inspects rendered frames. Do not call current output successful nor require endless full previews.

Next step: review a *single* geometrically unobstructed opening shot, not 4-shot pilot, and design proper performance rig. The local code cannot be rendered by this chat's GitHub connector; user still needs to sync/render and upload actual footage if they want quality verification.

---

# LATEST — Second Episode 02 Part 1 real render rejected, code revised again (2026-11-17)

The user uploaded a second true 183-frame MP4 and 12 real PNGs (names `Part1_01-04_PREVIEW(1).mp4` and `01_20(1).png` etc.). Upon viewing, **all four shots are still visually rejected**. Streetlamp pole directly in front of centre of box throughout (not in world.blockers), shot 01 no clear entry, 02 static, 03 cat face obscured behind flap (confirmed by new QA), 04 third guest hidden and cartoonishly long probing arm. See `studio/src/v2/episodes/in-this-town-02/PART1_SECOND_RENDER_AUDIT.md`.

**Code commits made after this video:** re-stage box and cameras at café sidewalk x=-2.5 to leave original lamppost x=0 out of shot; new demo-only fully outward opening flap rotation; explicit guest approach OUTSIDE box then jump over side rim; more evident napping head cues; later flap close while paper facets replace face; third witness now in near-right foreground; deleted stretched probing rig; new lamppost-mesh raycast warning `STREETLIGHT_BLOCKS_SHOT` in audit and renderer. `LOCAL_UPDATE_FILES.json` includes all revised files. Nothing claimed visually fixed yet: **no new revised MP4 has been uploaded**. We cannot run the user's Windows Remotion engine directly from chat. The next user action is to sync and run Part 1 pilot again, upload MP4 + JSON. The renderer automatically typechecks before encoding. Do not start shots 05–60 or claim successful quality.

**User's eventual goal:** a one-prompt, auto-QA series pipeline. Failing test cases reveal that QA must analyze actual occluding non-solid scene dressing and physical story actions, not just lack of TypeScript/browser errors.

---

# LATEST — Part 1 real preview rejected; corrective source implemented, NOT visually checked

The user ran `node scripts/episode02-part1.mjs`, generating `Part1_01-04_PREVIEW.mp4`, 12 real PNGs, and PART1_RENDER_STATUS.json. Inspecting the actual uploaded images showed **Part 1 is NOT visually approved**: giant box blocking cat/oversize, box on road, simplistic toy-like foreground cats, transformation was disappearance behind box, shot 04 witnesses static/cropped with an implausible reaching arm. Old checker found cropped shots 01/04, but missed box-self-occlusion in shots 02/03. Full review in `PART1_RENDER_REJECTION_2026-11-16.md`.

**Implemented after review (GitHub source only):** moved demo staging onto actual café sidewalk near left window at [0,.04,5.35]; reframed four shots; replaced toy `TownPopulation` foreground cards with new `ruleCats.ts` using Episode 01 detailed `drawCat` rig and custom supporting-guest palettes; introduced illustrated curled torso/face, progressive paper facet morph, scene sunlight travel cue, three distinct reacting witnesses, explicit shorter paw contact. Expanded audit to 12 unique sampled frames plus raycasts to detect **the box blocking the guest face**. Added new files to `LOCAL_UPDATE_FILES.json`, with original Mocha/Essie/Latte art unchanged. This source **has not been typechecked locally or rendered**; do not claim it looks good.

**Next user step:** from C:\V2 run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Update-Local-Code.ps1`; then from C:\V2\studio run `node scripts/episode02-part1.mjs`, upload new `part1-pilot\Part1_01-04_PREVIEW.mp4` and JSON. The code should re-render because source hash includes the new rig. Review and fix again if needed. Do NOT start shots 05–60 until the actual four-shot preview is visually approved. No paid narration.

**Long-term user goal:** one-prompt episode production. The JSON shot blueprint and one-command preview are only the foundation, not a finished autonomous quality-correction system.

---

# LATEST — Episode 02 Part 1 isolated visual pilot implemented (2026-11-16)

**Current user instruction:** rebuild Episode 02 **part by part**, while aiming eventually to create an entire episode with a single natural-language prompt. The rejected 60-shot Episode 02 draft must not be rendered or called on-brand/release-ready.

**What was actually committed:** a separate Remotion composition `InThisTownEpisode02Part1` implementing shots 01–04 (0–182 frames, 6.1s); it reuses Episode 01's `EpisodeWorld`, `TownPopulation` supporting-cat artwork (not lead lookalikes), paw rig, line/lighting style, and one smaller physically grounded demo box (1.05×.91×.47). The transformation is a staged paper-fold/cat-silhouette effect inside the *same* cardboard prop, not a second box. The camera positions and timings are now loaded from `PART1_SHOT_BLUEPRINT.json`.

**Local test path:** sync `v2-local-render`; double-click `Build-Episode02-Part1.cmd`, or from `C:\V2\studio` run `node scripts/episode02-part1.mjs`. Outputs in `out/v2-episodes/in-this-town-02/part1-pilot/`: 6.1-second 540×960 MP4, twelve 540×960 actual rendered scene PNGs, and JSON sampled camera-occlusion warnings. The new launcher and all source are in `LOCAL_UPDATE_FILES.json`.

**UNVERIFIED:** This new composition has **not** been run on Windows, typechecked in a full repo, or visually inspected. Source-committed does not prove no clipping, no occlusion, or Episode 01 quality. Request the 6.1s MP4 plus four middle frames for review. Do not continue with 05–10 until the real 01–04 pilot is visually approved.

**One-prompt goal:** read `PART1_AND_ONE_PROMPT_ROADMAP.md`. Data-driven blueprint and one-command pilot are a first step; the actual automated code/shot generator, local rendering runner, image-inspection/correction loop, rights/audio finalizer and publish gate are **not yet unified or autonomous**. Keep this distinction clear. No paid narration or full-episode render requested.

---

# LATEST — Episode 02 rendered prototype rejected after actual MP4 inspection

User uploaded 11 rendered Episode 02 preview clips (shots 03,07,09,20,32,39,50,51,54,59,60), and the assistant inspected their frames plus the Episode 01 full movie. **Every sampled Episode 02 shot shows major unacceptable visual defects. Stop calling this composition production-ready or recommending a full 60-shot render.** The previous portrait camera patch DID NOT solve the fundamental issues.

Observed: giant box fills frame (03,07,32,39,50,51,60), characters hidden/cut off, cafe structural walls completely obscure scenes (54 and 59), no legible box transformation/reunion (39,50,51), captions show unrelated words in silent preview. Technical success of encoding does not mean a usable animated film. User is correct that footage is unusable.

Detailed evidence and a rebuild contract are in `studio/src/v2/episodes/in-this-town-02/REJECTED_RENDER_AUDIT.md`. A real reconstruction is needed: stage actors, boxes and camera together for portrait; use raycast real geometry; animate physical rescue/contact and readable transformations, not squash a 2D billboard; target actual visible primary-cat poses. **Do not perform another blind global camera tweak or claim fixed without seeing new actual frames.** Episode 01 set/art assets and the approved script/shot list remain valuable. The unapproved scratch interpolated word-caption system has been disabled in `episode02-prepare.mjs` when alignment is absent. No paid voice or full render should be attempted.

---

# Latest — Episode 02 box story source assembled (2026-11-16)

The user approved **Episode 02 — The Cat Who Became a Box**, including a 403-word narration and 60-shot list. They then specifically requested **all implementation/source stages first, with all checks done together afterward**. The prior shadow Episode 02 pitch is superseded. The channel remains **What If Cats**, with **In This Town** as its story format.

The production source now lives under `studio/src/v2/episodes/in-this-town-02/` and uses the dedicated Remotion composition `InThisTownEpisode02Box`. It has its own mutable box models, 60-shot deterministic scene/characters/cameras, story props, original procedural audio/score, resumable native renderer, segment assembly, audio finishing, voice gating, and deferred QA launchers. See `FINAL_BUILD_HANDOFF.md` and `PRODUCTION_BUILD_PLAN.md` for the exact build/check commands.

**Critical truth/status:** These files are AUTHORED in GitHub, but no Episode 02 tests, local renders, preview MP4, or full-motion visual/audio checks have yet run. They are not proof of release quality. The new Adam narration requires the actual approved file or explicit separate paid-generation authorization. The code includes a protected one-time narrator generator but it has not been executed. `Build-Episode02.cmd` only builds once voice exists; `Check-Episode02.cmd` is the explicit one-batch post-build gate. Never overwrite Episode 01 or accidentally claim the silent scratch version is publishable.

---

# Current What If Cats V2 status

Delivery branch: `v2-local-render`. Worktree branch may differ. Inspect Git status/log before edits. Preserve uncommitted files and prior movies.

## Latest 2% wrap-up

Read the top of LAST_MINOR_FIXES.md. Current source includes the screenshot's blended ramp/sidewalk correction, question marks replacing shrugging, fear shiver/safe smile, the separate west-block dark alley, nearby infill and windows on all 3D facade directions, sign eyeline correction, lantern-safe kitten route and city-wide roof-masked rain. Only local review is authorized; original narration/current edit are preserved. Do not restart or expand scope. The separate new narration still needs visual integration as described below; no more paid requests.

## Wrap-up at 3% usage

The five newest source corrections are recorded at the top of LAST_MINOR_FIXES.md: quicker visual safe-lights beat, solid door threshold/shared floor support, illustrated 2D city horizon layers, one stable switch-contact shot, and a solid planter with matching camera endpoint. Current edit: 81 cuts / 3,349 frames; original continuous narration unchanged. The user clarified the floor issue is immediately before the cafe door. Stop scope expansion; upload this source and review the actual updated LOCAL preview next. The separate new-narration integration remains pending.

## Latest minor-fix pass

Read `LAST_MINOR_FIXES.md` for the newest request-by-request record. All twelve requested small corrections are implemented against the current edit: pole clearance, one sidewalk surface, stable shrug shot, alley/bins/avoidance action, distant city fill and blackout framing, puddle skid, readable sign, Mocha nose interactions, and the dumpster jump before the cut. Technical all-frame checks passed; actual updated LOCAL visual review remains pending. The user has low usage; preserve this pass and keep changes small.

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
