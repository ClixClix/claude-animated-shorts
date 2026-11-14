# Two permanent narrators

This module adds narration to V2 without editing the approved cats, café, BridgeShort or
`InThisTownV2ALittleLight` silent composition. `InThisTownV2Narrated` is a separate, opt-in
composition. No music is selected or generated. No extra package dependencies are added.

## Current status and production gates

The active narrators are **Adam for In This Town** and the **exact original V1 Daniel for
What If Cats**. Adam uses the approved straight offline 1.35× speed-up, with no separate pitch shift.
Sawyer's approved cached audition and exact profile remain an explicit archival fallback;
Darian's audition is preserved as an inactive reference. Daniel's identity and explicit
settings were recovered from the old locked configuration and multiple generation records,
then verified with read-only API requests. See [NARRATOR_PROVENANCE.md](NARRATOR_PROVENANCE.md).
The current environment has a secure key binding and API access; neither credentials nor
generated audio belong in source control. Request/settings schemas are documented in
[API_REFERENCES.md](API_REFERENCES.md). A new paid Daniel audition requires separate approval.

1. Revoke the previously exposed key and create a new ElevenLabs key. Do not reuse the exposed
   value. Give it only the necessary voice/model-read and TTS permissions.
2. In GitHub: personal Settings → Codespaces → Secrets → New secret. Name it
   `ELEVENLABS_API_KEY`, enter the new value privately, and grant access to
   `ClixClix/claude-animated-shorts`. Restart/rebuild the Codespace so the binding is injected.
   Organization-managed Codespaces may use the corresponding repository/organization secret settings.
3. If running in this managed Cloud workspace instead of Codespaces, use this environment's
   secure secret settings; GitHub Codespaces secrets are not automatically injected here.
   The environment's outbound policy must allow `api.elevenlabs.io`.
4. Confirm rotation explicitly before authenticated calls. Never paste the key into chat, CLI
   arguments, source, `.env` files or logs. No key recovery from Git history is used.
5. Run read-only account verification, then obtain explicit user authorization for two paid
   standalone samples. Do not synthesize merely because the key exists.
6. Listen to both samples and approve narrator identity, pronunciation, complete text, pacing
   and warmth/comedic rhythm. The service's alignment alone is not proof of spoken quality.
7. Review the measured In This Town shot plan. Only after sample and pacing approval prepare
   and render the separate narrated preview. The original eight-second test stays available.

These are user-requested gates, not inferred approval requirements. The live generation command
requires both `--rotated-key-confirmed` and `--allow-paid`. Production client requests never retry
paid POSTs automatically, including ambiguous transport failures. Check retained artifacts/provider
history before deliberately retrying an uncertain request.

## Configuration

| Series | Voice | Exact ID | Model candidate | Stability | Similarity | Style | Boost | Speed |
|---|---|---|---|---:|---:|---:|---|---:|
| in_this_town | Adam — In This Town | pNInz6obpgDQGcFmaJgB | eleven_multilingual_v2 | .50 | .75 | 0 | true | 1.0 |
| what_if_cats | Daniel — Original What If Cats narrator | onwK4e9ZLuTAKqWW03F9 | eleven_multilingual_v2 | .72 | .70 | 0 | true | 1.0 |

V1 explicitly set Daniel's stability, similarity and speed. It omitted style and boost;
the explicit V2 values above match the API's verified current defaults. Sawyer's settings
remain unchanged in `SAWYER_FALLBACK`. Default output stems are `in-this-town-adam` and `what-if-cats-daniel`.

Defaults are frozen. `narratorFor(series, overrides)` creates a validated per-episode copy.
Direction descriptions guide script/punctuation and human review; they are not sent as invented
API emotion fields. Unsupported tags/SSML are rejected. Model/style/boost support and current text
limits are checked through `/v1/models`; both exact voices are fetched before any synthesis.
An unavailable voice is an error, not a fallback. Models without an explicit settings adapter fail
closed. Flash/turbo v2.5 adapters can be chosen explicitly, but require compatible runtime flags.

Default generation uses timestamped MP3 44.1 kHz / 128 kbps, text normalization `auto`, no latency
optimization, no fabricated emotion markup, no seed unless explicitly provided, and natural speed.
Every new generation still verifies live account access and model capabilities. Sawyer's
performance is approved; Daniel's explicit controls reproduce the recovered V1 configuration.
No new Daniel recording has been generated as part of this narrator update.

## Commands (from studio/)

```sh
npm run typecheck
node scripts/v2-narration.mjs test
node scripts/v2-narration.mjs status
# Only after securely configuring a newly rotated key and confirming its rotation:
node scripts/v2-narration.mjs verify --rotated-key-confirmed
# ONLY AFTER explicit paid-generation authorization:
node scripts/v2-narration.mjs generate --series in_this_town --rotated-key-confirmed --allow-paid
node scripts/v2-narration.mjs generate --series what_if_cats --rotated-key-confirmed --allow-paid
```

These last two commands use the exact requested test scripts. They write the requested sample
names and timing JSONs into `out/v2-narration/`. The timestamp JSON includes complete script,
verified voice/model provenance, character/word/sentence timing, actual duration, integrity hash,
mastering measurements and any fallback-alignment notice.

For an offline cache hit, omit `--allow-paid`; no credential is then needed. To request a different
performance deliberately, add `--regenerate` with paid authorization. A corrupt/incomplete cache
entry does not trigger regeneration. Do not remove a `.lock` until its process is confirmed stopped.
Paid responses retain raw audio/timing under cache `attempt-*` directories for local recovery even
if later alignment/mastering fails. Scripts, timings and generated audio are private ignored outputs.

Custom episodes require `--name episode-01` when using `--script file.txt` or `--override file.json`
so they cannot overwrite the canonical narrator audition samples. Optional `--parameters file.json`
controls output/normalization/seed; `--pauses file.json` accepts a list such as
`[{"afterSentence":1,"seconds":0.35}]` to add suspense after “Except ours.” Existing punctuation
already guides pauses; listen before adding extra silence. Audio samples are cut/concatenated
without time stretching, and all timings are shifted with inserted silence.

## Independent offline playback and source cache

`PLAYBACK` and `playbackFor(series, overrides)` control speed and pitch independently of
ElevenLabs `settings.speed`, which remains 1.0 for natural source takes. Defaults:

| Series | Offline tempo | Pitch shift |
|---|---:|---:|
| In This Town | 1.35× straight speed-up | 0 additional (pitch rises naturally) |
| What If Cats | 1.0× | 0 semitones |

`server/processing.ts` supports two explicit modes. The approved In This Town preset
uses `mode: "varispeed"`: sample-rate speed-up raises tempo and pitch together, matching
the selected 1.35× audition. There is no separate pitch shift or formant preservation.
For `mode: "independent"` (or omitted mode on series with independent defaults), Rubber Band
first adjusts tempo with pitch=1, then applies the separate pitch pass at tempo=1 with
preserved formants. Intermediate WAVs use float PCM. Constant-gain mastering and final encoded true-peak verification follow.
The API/source cache is unchanged at `out/v2-narration/cache/`; derived files use
`out/v2-narration/processed-cache/`, keyed by original hash/cache identity, playback,
filter order, implementation version and mastering settings. Original metadata/hash
are verified; processed takes are rejected as inputs. Source bytes are never edited.
Identity playback (Daniel) copies the source exactly without a new encode.

```sh
# Cache-only offline processing; never constructs an ElevenLabs client:
node scripts/v2-narration.mjs process \
  --input out/v2-narration/Adam_Source_Test.mp3 \
  --metadata out/v2-narration/Adam_Source_Test-timestamps.json \
  --name InThisTown_Adam_Approved
```

Optional `--playback file.json` accepts `{"speed":1.35,"pitchSemitones":0,"mode":"varispeed"}` for either
`process` or `generate`. Use `mode: "independent"` to configure separate tempo/pitch controls.
`generate` retains `NAME-original.mp3` and original timing
metadata separately before producing `NAME.mp3` and transformed timing metadata.
Provider timings are divided by playback speed and labeled as transformed alignment,
not a newly verified transcription. Processing cannot trigger synthesis.

`SAWYER_FALLBACK` retains voice ID `8dEUmyPMdDdK91vboYih`, model, direction, stability .60,
similarity .75, style .15, boost true, generation speed1 and identity playback1/0.
Use `process --fallback sawyer` with the untouched Sawyer recording and metadata to
select that archival profile explicitly. An unavailable voice never silently falls back.
The user approved `Adam_1.35x_Straight_Speedup.mp3`. Its original and previous Adam
auditions remain unchanged. No new video or paid audio is produced for this selection.

## Narration-driven timing and the separate preview

The archived approved three-sentence Sawyer audition retains its original four-shot preview workflow (these commands reproduce the Sawyer reference):

```sh
node scripts/v2-narrated-test.mjs prepare
node scripts/v2-narrated-test.mjs stills
# Inspect the actual stills before the complete render:
node scripts/v2-narrated-test.mjs render
/workspace/.venvs/animated-shorts/bin/python scripts/v2-narrated-qa.py
```

These commands make no provider requests. They verify the approved recording's hash, stage
an identical public copy and use actual word alignment. The first cut follows “appeared”;
the cup offer and emotional ending play without narration because the approved script only
describes the arrival. The 8.777-second recording stays at 1.0× inside a 14.133-second,
424-frame preview. `townAudition.ts` keeps original action trajectories while sampling source
time continuously. Breathing, blinking, tail and steam retain their own real-time clock.
The original silent component's default behavior is preserved.

The actual native MP4 and storyboard are written to `out/v2-animation-test/`. Full video
decode, every-frame visibility/contact audits, source-to-encoded audio correlation and
encoded true peak are checked. Archived recordings and their original preview are preserved.
The narration test command includes regressions for this timing map and independent offline playback/cache behavior.
The final mux decodes the approved MP3 directly and copies the rendered H.264 video,
avoiding the render engine's AAC priming offset. `node scripts/v2-narrated-test.mjs audio`
can repeat this local audio-only stage without rerendering visuals or calling the provider.

The following generic five-sentence workflow remains available for the earlier full script:

```sh
node scripts/v2-narration.mjs plan --metadata out/v2-narration/in-this-town-adam-timestamps.json
# Review the real measured duration/shot lengths; approve both samples and the pacing plan first:
node scripts/v2-narration.mjs prepare-preview \
  --metadata out/v2-narration/in-this-town-adam-timestamps.json \
  --audio out/v2-narration/in-this-town-adam.mp3 --samples-approved --pacing-approved
node scripts/v2-narration-render.mjs
```

The In This Town map uses its five sentences across the four existing story beats. It never squeezes
speech into eight seconds. `planFromBeats` supports other episode sentence maps. Word/sentence
seconds, frame conversion, named markers, pauses and shot ranges are exported. `visualFrameAt`
remaps existing poses/actions into each narration window and then holds the action endpoint;
long expansions are flagged for pacing review. It is a preview adapter, not automatic proof that
slow actions or long holds are artistically appropriate. Real preview duration remains unknown
until the selected recording is measured. No silent composition or permanent visual asset is edited.

Only mastered public MP3 and timing/approval props are staged into ignored `public/v2-narration/`.
The browser imports no server client or credential handling. The full render initially writes an
intermediate file, then verifies/re-encodes audio with video stream-copy to meet the final-container
true-peak ceiling before writing `in-this-town-narrated-test.mp4` and `video-audio-qa.json`.

## Audio tracks, ducking and mastering

`mixTracks` accepts separate narration, vocalizations, SFX and music paths, per-track gain and
optional ducking. Narration remains the uncompressed sidechain key. Secondary tracks use
configurable threshold/ratio/attack/release; disable ducking per track explicitly. Music is an
input slot only—this assignment creates or selects no music. Intermediate WAVs use float PCM
so mix headroom and decoded MP3 overshoots are retained without integer clipping.

```sh
node scripts/v2-narration.mjs mix --tracks tracks.json --output out/v2-narration/mix.wav
node scripts/v2-narration.mjs master --input out/v2-narration/mix.wav --output out/v2-narration/master.mp3
```

`tracks.json` has `narration` plus optional `vocalizations`, `sfx`, `music` objects containing `file`,
`gainDB`, `duck`. The exported function also accepts ducking controls. Default narration target
is -16 LUFS; conservative constant gain preserves dynamics. Peak headroom takes priority over
hitting the target, so high-crest voices may finish quieter. FFmpeg measures the encoded MP3,
then iteratively attenuates/re-encodes if its measured true peak exceeds **-1 dBTP**. The final AAC
container is measured separately, with video copied unchanged if attenuation is needed. No
limiter setting alone counts as a mastering pass.

## Offline evidence and remaining limits

```sh
node scripts/v2-narration-offline-qa.mjs
```

This makes a labeled synthetic test-tone fixture, real FFmpeg measurements, a tiny engineering
AAC test container, one actual Remotion still and a six-frame audio-bearing smoke clip. Those
are not narrator samples or the approved narrated story. Mocked responses never call ElevenLabs.
The offline QA checks narration-dependent composition duration, intact 240-frame silent variant,
and absence of credential/client code in the browser bundle. Offline fixtures cannot verify voice
identity, pronunciation, emotion, real API credits or production alignment quality. See the generated
`out/v2-narration/NARRATION_QA_REPORT.md` for actual evidence and pending deliverables.
