"""Validate the completed native video and record measured QA evidence. Run from studio/."""
from pathlib import Path
import subprocess,json,hashlib
from PIL import Image
import numpy as np
OUT=Path('out/v2-animation-test')
video=OUT/'InThisTown_V2_8Second_Test.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
streams=probe['streams'];v=next(s for s in streams if s['codec_type']=='video')
assert (v['width'],v['height'])==(1080,1920)
assert v['avg_frame_rate']=='30/1' and int(v['nb_frames'])==240
assert abs(float(probe['format']['duration'])-8)<0.01
assert not any(s['codec_type']=='audio' for s in streams)
frames=sorted((OUT/'decoded-final').glob('*.png'));assert len(frames)==240
statistics=[];previous=None;hashes=[];max_identical=0;run=0
for i,file in enumerate(frames):
    with Image.open(file) as im:
        assert im.size==(1080,1920)
        raw=im.convert('RGB');hashes.append(hashlib.sha256(raw.tobytes()).hexdigest())
        a=np.asarray(raw.resize((108,192)),dtype=float)
    diff=None if previous is None else float(np.mean(np.abs(a-previous)))
    std=float(a.std());assert std>12,f'Blank/unintended empty frame {i}'
    statistics.append({'frame':i,'mean':float(a.mean()),'std':std,'differenceFromPrevious':diff})
    if i and hashes[i]==hashes[i-1]:run+=1
    else:run=0
    max_identical=max(max_identical,run);previous=a
assert max_identical<15,'Unintended long identical-frame freeze'
independent_errors={}
for f in [27,79,143,230]:
    with Image.open(OUT/'gate-a'/f'frame-{f:03}.png') as im:reference=np.asarray(im.convert('RGB'),dtype=np.int16)
    with Image.open(frames[f]) as im:decoded=np.asarray(im.convert('RGB'),dtype=np.int16)
    mae=float(np.mean(np.abs(reference-decoded)));independent_errors[str(f)]=mae
    assert mae<3.0, f'Independent keyframe disagrees with full render at {f}: MAE={mae}'
runtime=json.loads((OUT/'full-render-audits.json').read_text());assert not runtime['errors']
audits={a['frame']:a for a in runtime['audits']};assert set(audits)==set(range(240))
visibility_issues=[]
for f,a in audits.items():
    assert not a['cameraHits'],(f,a['cameraHits'])
    assert a['cup'][1]==1.12
    for sight in a['visibility']:
        if not sight['inFrame'] or sight['occluder']:visibility_issues.append({'frame':f,**sight})
assert not visibility_issues,visibility_issues
for gate in ['A','B']:
    review=json.loads((OUT/f'GATE_{gate}_APPROVED.json').read_text());assert review['sourceHash']==runtime['sourceHash']
subprocess.run(['git','diff','--exit-code','08b67e6','--','src/v2/cafe','src/v2/cats','src/videos/bridge'],check=True,stdout=subprocess.DEVNULL)
metrics={'video':{k:v.get(k) for k in ['codec_name','width','height','avg_frame_rate','nb_frames','pix_fmt']},'duration':probe['format']['duration'],'audioStreams':0,'decodedFrames':240,'uniquePixelFrames':len(set(hashes)),'longestIdenticalFrameRun':max_identical+1,'minimumFrameStdDev':min(s['std'] for s in statistics),'independentKeyframeMAE':independent_errors,'runtimeAuditedFrames':len(audits),'visibilityIssues':visibility_issues,'sourceHash':runtime['sourceHash'],'frames':statistics}
(OUT/'qa-metrics.json').write_text(json.dumps(metrics,indent=2))
notes=(OUT/'VISUAL_REVIEW.md').read_text() if (OUT/'VISUAL_REVIEW.md').exists() else 'Final visual review remains pending.'
report=f'''# In This Town — A Little Light: animation QA

Milestone: first silent eight-second animation test. User visual approval is pending; no pilot production was started.

## Output verified from the actual MP4

- `InThisTown_V2_8Second_Test.mp4`: H.264 / {v['pix_fmt']}, native **1080 × 1920**, **30 FPS**, **240 frames**, **8.000 seconds**.
- No audio streams; no narration, music or SFX.
- Every frame was decoded and checked: **240 / 240**, with {len(set(hashes))} distinct pixel frames. Longest identical-frame run: {max_identical+1}. Minimum downsampled full-frame standard deviation: {min(s['std'] for s in statistics):.2f}; no blank frames.
- Actual browser runtime audits cover all **240 frames**, with zero browser errors, camera-inside-geometry cases, out-of-frame required face/prop centers or obstructed required sightlines. Frustum/raycast checks supplement the visual review, not replace it.
- Independent native keyframes agree with the sequential MP4 render within H.264 conversion tolerance: maximum RGB mean absolute error {max(independent_errors.values()):.3f}/255 across frames 27, 79, 143 and 230.
- Source-bound Gate A and B technical reviews match the exact animation source used for this final render.

## Gate A — storyboard

Four native keyframes were rendered from `InThisTownV2ALittleLight`, then visually inspected. Early versions that cropped Essie or hid the cup behind the kitten were rejected and reframed. The final storyboard uses frames 27, 79, 143 and 230 decoded directly from the final video.

## Gate B — critical motion

Five real 30 FPS clips were rendered before the full video, at 540 × 960 for inspection:

| Sample | Composition frames | Frames reviewed |
|---|---|---:|
| Hesitant first step | 19–38 | 20 |
| Essie notices / head turn | 49–82 | 34 |
| Counter arrival / hop | 81–104 | 24 |
| Reach, contact, cup slide, release | 117–164 | 48 |
| Fear softens / appreciative hold | 174–239 | 66 |

Every consecutive sample frame was decoded into a review board, for **192 sampled frames** total (the arrival/head-turn samples overlap by two frames). The full render was allowed only after these technical visual reviews. Clips and per-frame audits remain in `gate-b/`.

## Motion and physical constraints

- **2,167** deterministic timeline/contact/continuity assertions passed. All four specified shot durations are exact.
- The cup/saucer base remains at **y=1.12 m** throughout. The full saucer footprint remains on the existing serving worktop.
- Cup translation is eased from frames **129–149**, with continuous paw contact during every moving frame. Paw center-to-cup distance is constrained to cup radius plus paw radius. Contact holds through frame **153**, then the paw lifts/withdraws through **164**. The cup stays fixed after release.
- The first step uses world-space foot targets and an upright-card projection so planted toes hold their floor positions while the body and camera advance.
- Kitten world positions are continuous across cuts. It moves around the existing tables/chairs and hops onto the counter during frames **81–104**, rather than changing support surfaces at the edit. The final kitten anchor stays fixed for all frames **105–239**.
- Essie's head/gaze/ear reaction leads her expression change. The reach has anticipation, visible contact, deceleration, release and a reaction hold. Her short forward support-bound adjustment occurs on the existing riser; idle poses do not move her world anchor.
- Reassurance and the kitten's small smile settle into the final emotional hold.

## Locked foundation and intentional story overrides

Approved assets were committed **before animation work** as `08b67e612becb48242ddaa2311fe2ac2656c22eb`, then the development branch `v2-a-little-light-animation` was created. `git diff` against that checkpoint confirms no changes to `src/v2/cafe/`, `src/v2/cats/` or `src/videos/bridge/`. The permanent scene is instantiated by the same approved factory; furniture, counters, lights, texture data, palettes and adult art source are unchanged.

Only animation-layer behavior is added: a separate original kitten visitor, a transient hinge for the existing entrance leaf, staging/sliding the existing serving mug, restrained cup steam, Essie's articulated reaching paw and support-bound body movement, expression/gaze/ear/tail/breathing performances, and deliberate cameras using the approved rendering pipeline. No new background furniture or V1 assets were imported. The original three cats remain present; Mocha and Latte retain their approved anchors.

The approved café's 104 layout checks (plus duplicate-counter/overlap negative probes) and the adult character rig's 66 sampled Canvas checks also passed. Private photographs were not changed, used as runtime textures, or committed.

## Actual render visual review

{notes}

## Evidence and reproduction

`ANIMATION_STORYBOARD.jpg`, `CONTACT_INTERACTION_FRAMES.jpg` and `EMOTIONAL_ACTING_FRAMES.jpg` are made from decoded final MP4 frames. `ALL_240_FRAMES.jpg` shows the entire decoded sequence. `qa-metrics.json` records frame statistics; `full-render-audits.json` records runtime checks. Gate previews are separate from the native-resolution deliverable.

See `src/v2/animation/README.md` for module responsibilities and reproduction commands. Source hash: `{runtime['sourceHash']}`. This is a local development checkpoint and render delivery, not a GitHub push or full-episode approval.
'''
(OUT/'ANIMATION_QA_REPORT.md').write_text(report)
print(json.dumps({k:v for k,v in metrics.items() if k!='frames'},indent=2))
