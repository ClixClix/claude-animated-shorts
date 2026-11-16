# Episode 02 — Final Assembly Handoff

**Project:** What If Cats / In This Town — *The Cat Who Became a Box*
**User instruction:** Finish all source/animation/edit/audio stages first; run **all checks together only after the whole film is assembled.**
**Current repo status:** Production source and local build scripts authored; **not yet executed** on the user's Windows machine. No compile tests, native frames, audio analyses or human review have been performed on this new episode. No paid voice generated.

## Exact approved creative assets

- Story: `DRAFT_BOX_NARRATION.txt` (403-word user-approved script). **Do not generate a replacement story.**
- Picture plan: `DRAFT_BOX_SHOT_LIST.md`, 60 specific shots with camera, continuity and SFX directions.
- Structural data: `EDITORIAL_SCRATCH_PLAN.json` (~129.2s / 3876 frames only before actual narrator timing).
- Animation composition: `Episode.tsx`, `timeline.ts` and `boxProps.ts`.
- Three prop identities: `LATTE_BOX` (striped), `ESSIE_BOX` (plain), `SHARED_BOX` (large). Magic is proposed as another cat climbing into the transformed box, which rescues them.
- Original production reference remains Episode 01's finished *Door at 11:11* film and `QUALITY_BASELINE.md`, **not** the shadow pitch and **not** the old music file.

## Production stages implemented

| Stage | Source | Outcome |
| --- | --- | --- |
| Prep | `scripts/episode02-prepare.mjs` | Voice gate; 60-shot timed manifest scaled to supplied voice; one-word captions; metadata; 48k narration stem |
| 3D scene | `src/v2/episodes/in-this-town-02/Episode.tsx` | New independently registered Remotion composition, reusing Episode 01 world and café; animated cats, box transforms, camera plan and captions |
| Original soundtrack | `scripts/episode02-audio.py` | 60-shot original procedural music/SFX stems; no unlicensed music reused |
| Render | `scripts/episode02-render.mjs` | 60 resumable H.264 shot segments, native 1080p or explicitly 540p preview |
| Assembly | `scripts/episode02-assemble.mjs` | Concatenated full silent picture |
| Finish | `scripts/episode02-finish.mjs` | Separate music/no-music AAC-stereo masters with speech-priority music ducking and peak/loudness processing |
| Later batch checks | `scripts/produce-box.mjs check` + `scripts/episode02-boards.py` | Source typecheck, box collision checks, 60 actual-frame storyboard, MP4 release metrics, creative/rights checklist **only when user initiates check** |

## One-build command, WITHOUT running any checks

From `C:\V2\studio`, after syncing `v2-local-render`:

```powershell
node scripts/produce-box.mjs build
```

The default requires an **approved Episode 02 narration file**, located at:

```text
C:\V2\studio\out\v2-episodes\in-this-town-02\Approved_Narration.wav
```

The script uses the separate word-timing JSON (if available) from:

```text
C:\V2\studio\out\v2-episodes\in-this-town-02\Approved_Word_Timings.json
```

This narration must already be the final **1.35× varispeed Adam** take. The source `episode02-generate-voice.mjs` supports the original ElevenLabs / verified-timestamp pipeline if user **separately, explicitly authorizes costs**; it is NEVER called by build or QA. Do not assume chat production approval is consent for paid API requests.

**If narration is not yet available**, a scratch-only full build can be run by explicit choice:

```powershell
node scripts/produce-box.mjs build --allow-scratch
```

It uses exactly 129.2 seconds of silence instead of the narrator and writes files beginning with **EP02_SCRATCH**. It must never be published. This is an option, not a substitute for approved narration.

Optional user-provided licensed music (must be explicitly cleared for these platforms):

```powershell
node scripts/produce-box.mjs build --licensed-music "C:\path\to\licensed-music.wav" --music-rights-confirmed
```

If no music override is supplied, the authored **original procedural soundtrack** is used. Its aesthetics still require human listening approval; ownership alone does not guarantee quality.

## Once the WHOLE film exists: one batch of checks

```powershell
node scripts/produce-box.mjs check
```

This is deliberately **separate from** `build`. It runs the offline geometry checks, TypeScript compilation, collects actual frame screenshots, verifies encoded video/audio with the shared release gate, and creates a list of critical frames for human review. It does **not** create narration or rerender 60 shots.

After the batch, inspect all generated reports under `out/v2-episodes/in-this-town-02`, watch the **actual finished file**, verify subtitle sync, box morph geometry, cat acting, music/Foley, floor/sidewalk joins, and platform-specific rights, then finish the SHA-bound review before publishing.

## Why no claim of final quality yet

Until the owner actually runs the local build and we see the resulting movie, we **cannot** honestly claim that these new 60 shots match Episode 01's visual quality. Their code is authored but not native-rendered/verified. Do not use an Episode 01 QA report as evidence for Episode 02. No further requested creative approval is needed for the story, but production tests and exact-file review remain deliberately deferred.

## Specific risks intentionally reserved for the single review

1. Box-to-cat transformations (shots 03, 38–39, 50–51, 55) and Mocha entering boxes (49, 54).
2. Pixel/silhouette visibility around Essie's alley and café threshold.
3. Cat/box support contact, individual character expressions, and the final three-cat shared-box pose.
4. Word-to-frame sync if real word timestamps were not supplied. **Estimated captions are NOT certified**.
5. Soundtrack mix. The original procedural music might need aesthetic refinements even after technical mastering.
6. Existing Episode 01 world reuse includes decorative props; ensure they do not intrude into the new scenes.

**Next required input:** the final approved Adam narration and word-level timestamps (or separate approval for the cost-gated generation script). Then the one-build command can produce the whole film for the single review.
