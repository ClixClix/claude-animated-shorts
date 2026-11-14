# Local production

From the extracted project root after setup:

```powershell
.\Render-Episode.ps1 -Concurrency 2
```

This uses the included 160-second / 4,800-frame edit with 70 shots. Maximum shot length is 113 frames, under the 120-frame cap. Cached Adam narration is reused unchanged at the approved straight 1.35× preset. Daniel's settings and Sawyer's fallback remain intact.

Stages stay separate:

```powershell
.\Render-Episode.ps1 -Stage Status
.\Render-Episode.ps1 -Stage Smoke -Concurrency 1
.\Render-Episode.ps1 -Stage Render -Concurrency 2
.\Render-Episode.ps1 -Stage Assemble
.\Render-Episode.ps1 -Stage Audio
.\Render-Episode.ps1 -Stage QA
```

`Render` writes native per-shot H.264 segments. `Assemble` validates hashes/ranges/audits and stream-copies them into the visual master. `Audio` rebuilds the independently mixed audio and stream-copies video into two final H.264/AAC containers. **Change music or gain by rerunning Audio and QA, without rerendering animation.**

The full command also runs TypeScript/regression checks, reuses the verified SFX stem (or rebuilds it if its cues/source change), and creates storyboard, keyframe and native motion evidence. It uses existing cached narration only. No key, new narration request or new credit approval is needed.

The soundtrack uses **only source 0–10.288667 seconds**, a 10.228667-second musical period with a 60 ms tail/head crossfade, repeated as needed. This follows the later instruction to leave out the whistle passage after the opening repeats. Original song tempo and pitch are unchanged. Gentle narration ducking and the four-second ending fade remain. Transfer the separate authorized original music file before running Audio. If music is missing, the narration/SFX master is still exported; the music-inclusive export and its combined QA remain explicitly pending until the file is supplied.

The final filenames are:

- `The_Door_At_1111_Final_With_Music.mp4`
- `The_Door_At_1111_Final_No_Music.mp4`
- `The_Door_At_1111_Storyboard.jpg`
- `The_Door_At_1111_Keyframes.jpg`
- `The_Door_At_1111_Shot_Manifest.json` and `.csv`
- `Narration_Stem.wav`, `SFX_Stem.wav`, `Music_Stem.wav`
- Three generated QA/production Markdown reports.

The QA stage fully decodes final containers, checks 4,800 frames, 1080×1920, 30 fps, identical video across the two mixes, no black frames, and encoded true peak ≤−1 dBTP. Automated reports do not establish emotional quality. Watch the full local movie and action transitions, record your observations in `studio\out\v2-episodes\door-at-1111\VISUAL_INSPECTION_NOTES.md`, then rerun QA to include them. It does not publish or start another episode.

For an existing approved composition, use its original script in `studio\scripts\`. All composition registrations are retained in `studio\src\Root.tsx`, including BridgeShort, character sheets, café shots, the original silent eight-second test, narrated and polished previews, and the current episode.
