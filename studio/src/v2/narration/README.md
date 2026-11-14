# Two permanent narrators

This module adds narration to V2 without editing the approved cats, café, BridgeShort or
`InThisTownV2ALittleLight` silent composition. `InThisTownV2Narrated` is a separate, opt-in
composition. No music is selected or generated. No extra package dependencies are added.

## Current status and production gates

The active narrators are **Sawyer for In This Town** and the **exact original V1 Daniel for
What If Cats**. Both IDs are account-accessible. Sawyer's cached audition is approved;
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
| in_this_town | Sawyer — Midnight Storyteller | 8dEUmyPMdDdK91vboYih | eleven_multilingual_v2 | .60 | .75 | .15 | true | 1.0 |
| what_if_cats | Daniel — Original What If Cats narrator | onwK4e9ZLuTAKqWW03F9 | eleven_multilingual_v2 | .72 | .70 | 0 | true | 1.0 |

V1 explicitly set Daniel's stability, similarity and speed. It omitted style and boost;
the explicit V2 values above match the API's verified current defaults. Sawyer's settings
remain unchanged. Default output stems are `in-this-town-sawyer` and `what-if-cats-daniel`.

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

## Narration-driven timing and the separate preview

```sh
node scripts/v2-narration.mjs plan --metadata out/v2-narration/in-this-town-timestamps.json
# Review the real measured duration/shot lengths; approve both samples and the pacing plan first:
node scripts/v2-narration.mjs prepare-preview \
  --metadata out/v2-narration/in-this-town-timestamps.json \
  --audio out/v2-narration/in-this-town-sawyer.mp3 --samples-approved --pacing-approved
node scripts/v2-narration-render.mjs
```

The In This Town map uses its five sentences across the four existing story beats. It never squeezes
speech into eight seconds. `planFromBeats` supports other episode sentence maps. Word/sentence
seconds, frame conversion, named markers, pauses and shot ranges are exported. `visualFrameAt`
remaps existing poses/actions into each narration window and then holds the action endpoint;
long expansions are flagged for pacing review. It is a preview adapter, not automatic proof that
slow actions or long holds are artistically appropriate. Real preview duration remains unknown
until Sawyer's actual audio is measured. No silent composition or permanent visual asset is edited.

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
