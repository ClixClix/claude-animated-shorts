# Private asset transfer

The project ZIP and Git bundle exclude the third-party soundtrack and original character reference photographs. A **separate private asset ZIP** is supplied for your personal handoff. Keep it private; do not upload it into the public Git repository.

Extract the private ZIP into your Windows user folder. The result should be:

```text
%USERPROFILE%\WhatIfCatsPrivate\
  audio\temporex-numbers-intro.mp3
  references\PRIVATE_CHARACTER_DESIGN_BRIEF.md
  references\private_sources\... (12 original extracted photographs)
```

Only the soundtrack is needed at render time. The original character photographs are optional reference archives; the approved reusable cat artwork is already source code in the project. No reference photographs were modified.

For another drive/location, set `V2_PRIVATE_ASSETS` or `V2_MUSIC_FILE` in ignored `studio\.env.local`. Do not place the music in `studio\public` or commit either private asset folder. Transfer the ZIP directly over your own trusted storage/connection. These ZIP files are not encrypted; use encrypted storage or an encrypted archive if sharing through another service. No password or API key is included.

The original supplied TEMPOREX file has SHA-256:

```text
c3f87ff4a8c1c4c1de789389ebe4c6e9132ac8a34a85f7f181be508d12815b8a
```

The same authoritative hash is recorded in `PRIVATE_ASSET_MANIFEST.json`. The soundtrack remains a private review asset until publishing rights are confirmed. The finishing pipeline uses only the selected opening phrase and loops it; the source MP3 stays unmodified.

Cached ElevenLabs originals, processed voice recordings, approved earlier preview videos, and completed native shots are included in ignored `studio\out` for local reuse. They contain no API credentials. Local secrets are configured separately; this episode needs none.

The private manifest records exact archive paths, sizes, SHA-256 hashes and whether each item is required. Style-study third-party video uploads are not required by the engine and are not redistributed in the project ZIP.
