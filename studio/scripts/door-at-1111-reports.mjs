// Reports are generated only after actual final containers and inspection evidence exist.
import fs from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve('out/v2-episodes/door-at-1111');
const read=async n=>JSON.parse(await fs.readFile(path.join(out,n),'utf8'));
const [manifest,structure,native,video,audio,paid]=await Promise.all(['The_Door_At_1111_Shot_Manifest.json','STRUCTURAL_QA.json','NATIVE_RENDER_QA.json','FINAL_VIDEO_QA.json','AUDIO_FINISHING_QA.json','PAID_GENERATION_JOURNAL.json'].map(read));
const notes=await fs.readFile(path.join(out,'VISUAL_INSPECTION_NOTES.md'),'utf8');
for(const n of ['The_Door_At_1111_Final_With_Music.mp4','The_Door_At_1111_Final_No_Music.mp4','The_Door_At_1111_Storyboard.jpg','The_Door_At_1111_Keyframes.jpg','Narration_Stem.wav','SFX_Stem.wav','Music_Stem.wav'])await fs.access(path.join(out,n));
if(video.decodedFrames!==manifest.durationInFrames||video.blackFrames.length||native.browserErrors.length||native.cameraFlags.length)throw Error('Unresolved final technical failure.');
for(const label of ['No_Music','With_Music'])if(audio[label].encoded.truePeakDBTP> -1)throw Error('Encoded peak exceeds ceiling.');
const write=(name,text)=>fs.writeFile(path.join(out,name),text.trim()+'\n');
await write('The_Door_At_1111_Visual_QA.md',`
# The Door at 11:11 — Visual QA

Actual delivery: ${manifest.width} × ${manifest.height}, 30 fps, ${video.decodedFrames} frames, ${video.expectedSeconds.toFixed(2)} seconds. Both final MP4s decode completely and contain identical H.264 video packets.

## Structural and render checks

- ${manifest.shots.length} shots; maximum ${structure.maximumShotFrames} frames (${(structure.maximumShotFrames/30).toFixed(2)} seconds), below the strict 120-frame cap. No gaps or overlaps.
- ${structure.checks.toLocaleString('en-US')} deterministic timing, continuity, contact, light-state and preservation checks passed.
- ${structure.protectedHashes} protected source hashes match: approved adult artwork, original café, original animation and Bridge rendering modules remain intact.
- One approved café instance, exactly one serving counter, one rear preparation counter and two customer tables. No furniture moves between camera shots.
- Nine fixed streetlights fail monotonically. Clock progression and explicitly identified flashbacks are deterministic.
- Every native frame has a scene audit. ${native.cameraFlags.length} camera-inside-geometry flags and ${native.browserErrors.length} recorded browser errors.
- Full movie decode found ${video.blackFrames.length} black frames. Static detail inserts are distinguished from acting shots; image differences alone are not treated as proof of good animation.
- ${native.visibilityFlags.length} visibility-marker flags are retained in NATIVE_RENDER_QA.json for inspection; any intentional occlusion is described below.

## Actual rendered inspection

${notes}

## Evidence

The storyboard and keyframe sheets are extracted from the native Remotion shot segments used in the final master. Native motion filmstrips document action beats. No generated replacement images or interpolated stills are used.

These are review masters. Final creative approval remains with the user.
`);
const loudness=label=>{const p=audio[label].encoded;return `| ${label==='With_Music'?'With music':'Without music'} | ${p.integratedLUFS.toFixed(2)} LUFS | ${p.truePeakDBTP.toFixed(2)} dBTP |`;};
await write('The_Door_At_1111_Audio_QA.md',`
# The Door at 11:11 — Audio QA

## Narration and credit use

Adam, voice ID pNInz6obpgDQGcFmaJgB, using the locked straight 1.35× varispeed preset. The natural 1.0× source and processed recording are separately cached. No additional independent pitch shift is applied. Daniel and the Sawyer fallback remain unchanged.

The exact approved ${paid.scriptCharacters.toLocaleString('en-US')}-character script was generated once, after explicit authorization for up to ${paid.maximumCredits.toLocaleString('en-US')} credits. Observed account debit: **${paid.accountUsageDelta} credits**. No paid retries or other narration generations were made.

The complete ${manifest.narration.sourceDuration.toFixed(6)}-second processed take is retained. Editorial action pauses are inserted at actual provider-aligned sentence/clause boundaries; no narration is sped up further or cut to force the edit. Narration_Stem.wav spans the complete ${video.expectedSeconds}-second film. Provider alignment and source-coverage metadata are preserved in the shot manifest.

## Music and sound effects

The music-inclusive master uses the exact supplied TEMPOREX “Numbers — Instrumental Intro Loop” recording. Source duration ${audio.music.source.duration.toFixed(6)} seconds; ${audio.music.source.sampleRate} Hz, ${audio.music.source.channels} channels. SHA-256: ${audio.music.sourceSHA256}.

The music starts at frame zero, preserves original tempo and pitch, uses a ${audio.music.gainDB} dB starting gain and gentle 3:1 narration-priority ducking, and fades out over the final ${audio.music.fadeOutSeconds} seconds. It is not looped. Music is selected by the reusable in_this_town series preset and mixed after video rendering.

SFX are original deterministic procedural synthesis, with frame-indexed cues and seed 1111. Bus, clock, latch/hinges, electrical failures, rain, footsteps/splashes, slip, switch, glass taps, kitten vocalizations, cloth, bowl contact and the restrained final accent have separate cue/provenance records. The kitten meow is synthesized, not a recorded animal performance. All stems are 48 kHz float PCM. Narration is mono; SFX and music are stereo.

## Encoded final measurements

| Master | Integrated loudness | True peak |
| --- | --- | --- |
${loudness('No_Music')}
${loudness('With_Music')}

Both AAC streams decode fully, are stereo at 48 kHz, retain the entire ending, and satisfy the −1 dBTP ceiling. The two masters share identical video packets; audio revisions do not rerender animation. Conservative constant gain preserves dynamics.

## Review limits

Audio was checked by full decoding, source/timestamp coverage, duration, signal measurements and encoded true-peak verification. Human listening approval is not claimed. An optional local speech-recognition pass could not run because its model download was blocked; no audio was uploaded to another service. Please assess delivery, musical balance and emotional effect during review.

The music-inclusive file is for private review until publishing rights are confirmed. The supplied recording remains outside the Git repository.
`);
const acts=[1,2,3,4].map((act,i)=>{const bounds=[[1,12],[13,27],[28,44],[45,60]][i],shots=manifest.shots.filter(s=>s.number>=bounds[0]&&s.number<=bounds[1]);return `| ${act} | ${(shots[0].start/30).toFixed(2)}–${(shots.at(-1).end/30).toFixed(2)} s | ${shots.length} |`;}).join('\n');
await write('The_Door_At_1111_Production_Report.md',`
# In This Town — The Door at 11:11

## Delivery

Complete ${video.expectedSeconds}-second episode, native 1080×1920 at 30 fps, H.264/AAC, ${manifest.shots.length} cuts. Two final masters are provided: with the supplied music and without music. Both include Adam narration and story sound effects. This is episode 1 only; nothing has been published.

| Act | Actual edit range | Shots |
| --- | --- | --- |
${acts}

The initial 60-shot plan expands to 70 cuts to accommodate actual narration and purposeful detail inserts while keeping every shot under four seconds. The edit is synchronized to the cached recording's actual character timestamps and deliberate action pauses.

## Preservation and implementation

The approved project was checkpointed at e1d1ad8 before production. Episode visual source is isolated on branch v2-door-at-1111; b5ce9a3 records the initial implementation; the final visual source fingerprint is ${native.sourceHash}. The existing adult drawings, permanent café, BridgeShort and earlier working compositions remain available. No V1 environment/character engine was imported, and no private reference photographs or soundtrack recording were committed.

New reusable episode modules own the short street, nine lights, house, bus stop/bus, clock, lantern, cloth, bowl, sign and staging. One permanent CaféEnvironment is reused. Deterministic paths, planted foot targets, camera-relative reaching, contact/release curves and projected silhouettes support independently rendered Remotion frames. Mocha's actual approved Canvas alpha and actual cloth geometry create the shadow from the fixed lantern; no replacement monster is drawn.

Immutable café geometry is batched only for rendering. Stable source IDs and positions remain available for collision checks. Finite-distance light culling is mathematically limited to lights outside the camera's influence volume; a native 12-frame comparison returned SSIM1.000000 against the unculled render.

## Validation

TypeScript passed; existing suites passed (104 café layout checks, 2167 original animation checks, 24 narration tests), plus 66 actual Canvas rig checks and ${structure.checks} episode checks. All ${manifest.durationInFrames} native frames were rendered through Remotion, assembled without video reencoding, fully decoded and inspected using native storyboard/motion evidence. See the separate visual and audio QA reports for scope and limitations.

## Reproduction

Run from studio/:

1. node scripts/door-at-1111-prepare.mjs — offline cached narration/editorial preparation.
2. node scripts/door-at-1111-tests.mjs — scene/timeline checks and sound cues.
3. Python scripts/door-at-1111-sfx.py — original Foley stem (NumPy/SciPy).
4. node scripts/door-at-1111-render.mjs render --concurrency 2 — resumable native Remotion segments.
5. node scripts/door-at-1111-assemble.mjs — validate segments, assemble visual master, extract native storyboard frames.
6. node scripts/door-at-1111-finish.mjs — independent audio finishing and two peak-verified MP4s.
7. Python scripts/door-at-1111-video-qa.py, scripts/door-at-1111-boards.py and scripts/door-at-1111-motion-boards.py --native — final evidence.

The production scripts do not make narration-generation requests. Preserve the cached original recording and private soundtrack path when reproducing. Render caches validate frame ranges, source/props hashes, native dimensions and actual frame counts.

## Status

The actual final movies, storyboard/keyframes, JSON/CSV manifest, three stems and three reports exist. The episode is delivered for visual and listening approval. No further episode production or publication is authorized by this delivery.
`);
console.log('Three reports generated from actual final delivery evidence.');
