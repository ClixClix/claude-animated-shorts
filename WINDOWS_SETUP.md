# Windows setup

Target PC: Ryzen 9 5950X, RTX 4070 Ti, 32 GB RAM, Windows 10/11. Use an SSD and a short writable project path such as `D:\V2`. Keep at least 15 GB free for dependencies, temporary bundles, caches and output.

## Required tools

| Tool | Version / requirement |
| --- | --- |
| Node.js | 24.x LTS; validated in Linux with 24.22.1 |
| npm | 11.x; validation used 11.9.0 |
| Python | 3.12.x; validation used 3.12.14 |
| FFmpeg / ffprobe | FFmpeg 7.1 or newer, full build with libx264/libmp3lame and normal audio filters; Linux validation used 7.1.5 |
| Chrome / Edge | Current 64-bit Chrome recommended; installed Chrome/Edge is detected, or Remotion uses its managed Chrome |
| Git | Optional for normal production; required to restore repository history |

Install Node 24 from nodejs.org (or a version manager). Do not install a different major just because an installer says “latest.” Typical remaining Windows installations:

```powershell
winget install Python.Python.3.12
winget install Gyan.FFmpeg
winget install Google.Chrome
winget install Git.Git
```

Reopen PowerShell afterward. Confirm `node --version`, `python --version`, `ffmpeg -version`, and `ffprobe -version` work. If FFmpeg is not on PATH, add its `bin` folder through Windows Environment Variables and reopen the terminal.

Run `powershell -ExecutionPolicy Bypass -File .\Setup-V2.ps1` from the project folder. It uses **npm ci with the included lockfile**, creates an isolated `.venv`, installs exactly pinned NumPy/SciPy/Pillow, and checks resume status. It does not render or generate audio. `studio\node_modules` is intentionally excluded from the ZIP: Windows must install its own platform binaries.

## Private assets and environment variables

Music defaults to `%USERPROFILE%\WhatIfCatsPrivate\audio\temporex-numbers-intro.mp3`. To use another location, copy `studio\.env.example` to `studio\.env.local` and set `V2_PRIVATE_ASSETS` or `V2_MUSIC_FILE` using an absolute quoted path. Native Windows paths and spaces are supported. The local file is ignored by Git and must not be shared.

No ElevenLabs key is required to resume this episode. For future separately approved generation, set `ELEVENLABS_API_KEY` in your local process environment or ignored `.env.local`. Never put it in source, a command argument, reports, or the handoff ZIP. Existing generation commands retain their explicit paid-generation and rotated-key checks; the full episode production command has no paid step.

Optional variables:

| Variable | Purpose |
| --- | --- |
| `CHROME` | Absolute path to your Chrome/Edge executable |
| `V2_GL` | `angle` by default on Windows; `swangle` is an explicit slower software fallback |
| `V2_RENDER_CONCURRENCY` | 1–4, default 2 |
| `V2_PYTHON` | Override the root `.venv\Scripts\python.exe` |
| `V2_PRIVATE_ASSETS` | Private root containing `audio\` and optional `references\` |
| `V2_MUSIC_FILE` | Override the exact private soundtrack file |

## Resource control

Start with concurrency **2**. Try 4 only after a successful local shot and comfortable RAM/VRAM readings in Task Manager. Lower to 1 after memory or driver failures; rerunning resumes complete shots. Avoid running multiple render jobs simultaneously. The RTX can accelerate Three.js through ANGLE, but actual driver/GPU use and performance require a local test; they are not verified by this cloud handoff. H.264 encoding remains the existing pipeline rather than an untested NVENC conversion.

If hardware ANGLE fails, update your NVIDIA driver/Chrome and try the six-frame local smoke first. As a fallback, set `V2_GL=swangle` in `.env.local`. Keep the original 1080×1920, 30 fps settings; do not lower resolution to troubleshoot a final export.
