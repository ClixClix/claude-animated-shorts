# Permanent narrator selection

Updated November 14, 2026. In This Town selects Adam with the approved straight offline 1.35× speed-up;
Sawyer remains the explicit archival fallback. What If Cats keeps the exact
original V1 Daniel voice, recovered from source and actual generation metadata rather
than selected by display name.

| Series | Active voice ID | Model | Stability | Similarity | Speed | Audition status |
|---|---|---|---:|---:|---:|---|
| In This Town — Adam | `pNInz6obpgDQGcFmaJgB` | `eleven_multilingual_v2` | .50 | .75 | 1.0 synthesis | Original cached; straight 1.35× audition approved |
| In This Town fallback — Sawyer | `8dEUmyPMdDdK91vboYih` | `eleven_multilingual_v2` | .60 | .75 | 1.0 | Sawyer_Test.mp3 remains approved and unchanged |
| What If Cats — original Daniel | `onwK4e9ZLuTAKqWW03F9` | `eleven_multilingual_v2` | .72 | .70 | 1.0 | Original identity/settings recovered; no new audition generated |

## Original Daniel evidence

Repository: `ClixClix/stickman-pipeline`, inspected read-only at commit
`3dd6cd0dbe749462e42f83365d50660ada9376d2`. No V1 source, geometry or engine was imported.

- [Locked narrator configuration](https://github.com/ClixClix/stickman-pipeline/blob/3dd6cd0dbe749462e42f83365d50660ada9376d2/what-if-cats/config/narrator_voice.json)
- [Configuration guard](https://github.com/ClixClix/stickman-pipeline/blob/3dd6cd0dbe749462e42f83365d50660ada9376d2/what-if-cats/scripts/audio/narrator-config.mjs)
- [Episode 5 Daniel generation metadata](https://github.com/ClixClix/stickman-pipeline/blob/3dd6cd0dbe749462e42f83365d50660ada9376d2/assets/audio/ep05_daniel/narration.json)
- [Episode 11 generation metadata](https://github.com/ClixClix/stickman-pipeline/blob/3dd6cd0dbe749462e42f83365d50660ada9376d2/assets/audio/ep11_secret_critic/narration.json)
- [Season 2 generation metadata](https://github.com/ClixClix/stickman-pipeline/blob/3dd6cd0dbe749462e42f83365d50660ada9376d2/assets/audio/season2_ep01_edit05/narration.json)

All four JSON sources agree on the exact ID/model and explicit settings:
`stability: 0.72`, `similarityBoost: 0.70`, `speed: 1.0`.
V2 uses the corresponding API wire name `similarity_boost`.

V1 did **not** explicitly send style or speaker boost. V2's existing settings structure
keeps these explicit as `style: 0`, `use_speaker_boost: true`, matching the provider's
current default-settings endpoint and Daniel's current settings endpoint. These two
values are verified current defaults, not additional settings recovered from V1 metadata.
Sawyer's existing style .15 and boost true remain unchanged.

V1 requested raw PCM 48 kHz. The V2 MP3 generation/mastering pipeline remains unchanged;
only narrator identity and voice controls are restored. Series creative direction remains
playful and conversational. Daniel retains natural tempo and zero pitch shift. Adam's offline creative preset is separate from the generation settings.

Live read-only `GET /v1/voices/onwK4e9ZLuTAKqWW03F9` returned HTTP 200, exact ID match,
with the current display name **Daniel - Steady Broadcaster**. Display name alone was
not used to infer the historical identity. No fallback or paid synthesis was performed.

## Preserved recordings

Generated audio stays private and ignored under `studio/out/v2-narration/`:

- `Sawyer_Test.mp3`: approved; SHA256
  `0d38bf2aabbde18b77485a7cbaa0314e14a58f8fc0793779d58d83185b5babf5`.
- `Darian_Test.mp3`: retained for reference, inactive; SHA256
  `2c88ec1938708b15eec6bafae2514a9bf5a8afcb3d41017720a4a58df1a838fa`.

Their original metadata and cache entries remain intact. A new Daniel request naturally
has a different cache identity; no Darian entry is deleted, relabeled or reused as Daniel.
The default What If Cats output basename is now `what-if-cats-daniel`; explicit episode
names still work as before. Historical audition plans/results remain records of the original
Sawyer/Darian requests and must not be interpreted as active narrator configuration.

## Selected Adam processing provenance

The user approved Adam ID `pNInz6obpgDQGcFmaJgB` with straight 1.35× sample-rate speed-up
and no independent pitch shift. Tempo and pitch rise together (about +5.20 semitones).
This supersedes the earlier independent 1.30×/+5 trial, whose output/cache is retained.
The natural original `Adam_Source_Test.mp3` has SHA256
`d4a5bea7840702f7f1d20846dad8806dd471a794c6b9a4c566b7c492834dc028`.
Its existing multilingual-v2 synthesis settings are stability .50, similarity .75, style0,
boost true, speed1. These settings are preserved in the active Adam generation profile.
The approved audition uses `asetrate=59535,aresample=48000` on the 44.1 kHz original,
never a previous processed comparison. The engine preserves the same processing and
source loudness target, followed by its existing peak-safe constant-gain mastering. No API request or paid generation is part of
this preset update. Sawyer's full configuration is exported as `SAWYER_FALLBACK`.
The previous three Adam comparisons, Sawyer/Darian recordings, Daniel settings, and all
approved rendered visuals are retained. User steering limits this delivery to MP3 only.
