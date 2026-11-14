# Portability QA — local handoff

## Current episode status

Cloud rendering was **stopped at the user's request**. The full episode is not finished and no final full-episode MP4 is claimed. The package preserves 37 complete native shots, totaling 2,462 of 4,800 frames. There are 33 remaining shots. The interrupted partial shot is omitted from the portable cache. Existing approved earlier test movies and compositions remain available.

All 37 transferred MP4s are byte-identical to their cloud originals and were fully decoded without error. Their full ranges, 1080×1920 dimensions, H.264 codec, 30 fps, source/props fingerprints and per-frame audits validate. SHA-256 integrity fields were added to the transferred sidecars; the video bytes were not changed. Details: `TRANSFERRED_SHOTS_QA.json`.

## Checks actually performed on Linux

- Fresh `npm ci` succeeded from the supplied lockfile, using a writable local npm cache. Dependency versions were preserved; Windows x64 compositor/esbuild packages are present in the lockfile for platform installation.
- A fresh Python 3.12 virtual environment installed the pinned NumPy 2.5.4, SciPy 1.18.1 and Pillow 13.0.0 requirements successfully.
- TypeScript compilation passed.
- 104 café layout checks and duplicate-counter/furniture probes passed.
- 2,167 original animation timing/contact/continuity checks passed.
- All 25 narration tests passed, including voice/config/cache/mastering tests and a real FFmpeg clean-loop test excluding later source material.
- 66,028 episode timing, preservation, planted-foot, contact and light-state checks passed, with 182 synchronized SFX cues.
- The complete 70-shot manifest covers all 4,800 frames, with no gaps/overlaps. Maximum shot length is 113 frames, below the 120-frame cap.
- All 37 complete caches remain valid under portable path/line-ending hashing. Stale source/props, partial ranges and missing per-frame audits are rejected.
- The current full Root/episode source bundles successfully with freshly installed dependencies. No browser render was performed for this portability test.
- 26 original Kenney GLBs, the original colormap, bundled DejaVu font/license, narration originals/processed caches and required episode configuration are accounted for.
- The original full narration and processed Adam take match their approved SHA-256 identities. No API calls or additional credit spending occurred during handoff preparation.
- All 19 Python source files parsed, and all 23 Node scripts passed syntax checks.
- No hardcoded cloud workspace paths remain in active JavaScript/TypeScript/Python runtime code. Historical output metadata and original documentation may retain provenance paths; runtime uses the portable helpers and local configuration.
- Known key/token/private-key patterns were checked in exported text and reachable Git-history blobs. Local environment files, machine Git configuration, credential stores, dependencies and virtual environments are excluded from the ZIP. See `CREDENTIAL_EXPORT_SCAN.json` for scope.

## Preservation

Approved creative TypeScript source is unchanged: café geometry/furniture, adult cat drawings, original animation/Bridge modules and permanent narrator settings retain their existing identities. The native visual hash remains `d59d3b41acad447f57d706df59f776e167848ed8f88c97d61a392b86a936abe8`.

Of the 44 original baseline files, 42 remain byte-identical. Two non-creative utility files change only font path/command documentation or file-URL handling for Windows; exact original/new hashes are audited in `PORTABILITY_ADJUSTMENTS.json`. The old animation test and legacy QA utilities now use source hashes for preservation checks so they also work in an extracted ZIP before history restoration.

Browser detection, ANGLE defaults, bounded configurable concurrency, canonical cache keys, a separate native-sample directory, environment/private-asset paths, font lookup and offline production orchestration are portability changes. Rendering and music finishing remain separate. No permanent scene redesign or V1 import occurred.

## Limits and local validation still needed

**Windows, PowerShell execution and RTX 4070 Ti rendering were not tested in this Linux environment.** PowerShell scripts were reviewed, not executed on Windows. The user explicitly requested no further cloud rendering; therefore the requested packaged-source short render was not performed here. Run the provided local six-frame Smoke stage first. It does not overwrite full-shot caches.

The earlier actual BridgeShort smoke and native episode shots were rendered before the stop instruction. Their creative source remains intact; they are evidence of the existing rendering foundation, not proof of Windows execution.

The remaining 33 shots, final assembly, complete encoded video/audio/continuity QA and full-film visual/listening review must run locally. The provided full command performs the remaining automated production stages. It does not claim manual creative approval or publish anything.

The authorized soundtrack and original photographs are in a separate private archive. The soundtrack uses only the selected opening phrase with crossfaded repeats; later whistle material is excluded from the mix. The original source recording stays unchanged. Music-inclusive exports remain private review masters until publishing rights are confirmed.
