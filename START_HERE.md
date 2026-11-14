# What If Cats V2 — local Windows handoff

The cloud render was stopped at your request. This package contains **37 complete native shots / 2,462 frames** from the 70-shot episode. **33 shots remain.** There is no finished full-episode MP4 yet. Existing approved test movies and artwork are retained.

1. Extract the project ZIP to a short writable path, for example `D:\V2`. Do not run inside the ZIP.
2. Extract the separate **private asset ZIP** into your Windows user folder. It should create `%USERPROFILE%\WhatIfCatsPrivate\audio\temporex-numbers-intro.mp3`. See [PRIVATE_ASSET_TRANSFER.md](PRIVATE_ASSET_TRANSFER.md).
3. Install Node.js **24.x**, Python **3.12**, and FFmpeg with `ffprobe`. Open a new PowerShell window in the project folder.
4. Run setup:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Setup-V2.ps1
   ```

5. Optional local GPU/native-resolution check (six frames, separate from the full-shot cache):

   ```powershell
   .\Render-Episode.ps1 -Stage Smoke -Concurrency 1
   ```

6. Resume and finish the complete episode with one command:

   ```powershell
   .\Render-Episode.ps1 -Concurrency 2
   ```

The command reuses valid complete shots, renders the remaining shots, assembles the movie, mixes cached Adam narration and SFX with/without the supplied music, and produces automated QA and review sheets. **It never generates narration or calls ElevenLabs.** No API key is needed for this episode.

Final output folder: `studio\out\v2-episodes\door-at-1111\`.

- `The_Door_At_1111_Final_With_Music.mp4` — private review, supplied soundtrack.
- `The_Door_At_1111_Final_No_Music.mp4` — Adam narration and SFX, without background music.

Review the resulting movies yourself before approval. This handoff has been checked on Linux; Windows execution and RTX performance have **not** been tested here. No new render was run after your instruction to stop cloud rendering.

Details: [Windows setup](WINDOWS_SETUP.md), [production commands](LOCAL_RENDERING.md), [resume/recovery](RESUME_AND_RECOVERY.md), [portability QA](PORTABILITY_QA.md), [Git history](GIT_HISTORY.md).
