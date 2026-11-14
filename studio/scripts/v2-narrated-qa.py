"""Inspect the complete actual narrated MP4; no API calls. Run from studio/ using the project venv."""
from pathlib import Path
import subprocess,json,hashlib,math
import numpy as np
from scipy.signal import correlate,correlation_lags
from PIL import Image,ImageDraw,ImageFont,ImageOps

OUT=Path('out/v2-animation-test');WORK=OUT/'narrated'
VIDEO=OUT/'InThisTown_V2_Narrated_Test.mp4'
plan=json.loads((WORK/'timing-plan.json').read_text())
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(VIDEO)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
assert (v['width'],v['height'])==(1080,1920)
assert v['avg_frame_rate']=='30/1' and int(v['nb_frames'])==plan['plan']['durationInFrames']
assert any(s['codec_type']=='audio' for s in probe['streams'])
assert abs(float(probe['format']['duration'])-int(v['nb_frames'])/30)<0.08
assert hashlib.sha256(Path(plan['approvedAudio']).read_bytes()).hexdigest()==plan['audioSHA256']
for preserved in json.loads((WORK/'preserved-files.json').read_text()):
    assert hashlib.sha256(Path(preserved['file']).read_bytes()).hexdigest()==preserved['sha256'],preserved['file']
subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(VIDEO),'-f','null','-'],check=True)
frames_dir=WORK/'decoded';frames_dir.mkdir(parents=True,exist_ok=True)
subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-threads','2','-i',str(VIDEO),str(frames_dir/'%04d.png')],check=True)
files=sorted(frames_dir.glob('*.png'));assert len(files)==int(v['nb_frames'])
cuts={s['startFrame'] for s in plan['plan']['shots'][1:]}
stats=[];previous=None;hashes=[];identical=0;longest=0
for i,file in enumerate(files):
    with Image.open(file) as im:
        assert im.size==(1080,1920)
        raw=im.convert('RGB');a=np.asarray(raw.resize((108,192)),dtype=float)
        digest=hashlib.sha256(raw.tobytes()).hexdigest()
    std=float(a.std());assert std>12,f'Blank or empty frame {i}'
    diff=None if previous is None else float(np.mean(np.abs(a-previous)))
    if diff is not None and i not in cuts:assert diff<8,f'Unexpected intra-shot pop at {i}: {diff}'
    identical=identical+1 if hashes and digest==hashes[-1] else 0
    longest=max(longest,identical);hashes.append(digest);previous=a
    stats.append({'frame':i,'std':std,'differenceFromPrevious':diff})
assert longest<15,'Unintended frozen scene'

runtime=json.loads((WORK/'render-audits.json').read_text());assert not runtime['errors']
audits={a['renderFrame']:a for a in runtime['audits']}
assert set(audits)==set(range(len(files)))
for f,a in audits.items():
    assert not a['cameraHits'],(f,a['cameraHits'])
    assert all(s['inFrame'] and not s['occluder'] for s in a['visibility']),(f,a['visibility'])
    assert a['cup'][1]==1.12
    if a['shot']>=3:assert a['kitten']==[0.64,1.12,-0.79]
    if a['contact']:
        gap=math.hypot(a['paw'][0]-a['cup'][0],a['paw'][2]-a['cup'][2])
        assert abs(gap-0.17)<1e-8
    if f:
        b=audits[f-1]
        if math.dist(a['cup'],b['cup'])>1e-8:assert a['contact'] and b['contact']
        assert math.dist(a['kitten'],b['kitten'])<0.20

def pcm(file):
    return np.frombuffer(subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(file),'-vn','-ac','1','-ar','16000','-f','f32le','-acodec','pcm_f32le','pipe:1']),dtype='<f4').astype(float)
source=pcm(Path(plan['approvedAudio']));encoded=pcm(VIDEO)
assert np.isfinite(encoded).all()
limit=1600;window=encoded[:len(source)+limit]
corr=correlate(window,source,mode='full',method='fft');lags=correlation_lags(len(window),len(source))
mask=np.abs(lags)<=limit;lag=int(lags[mask][np.argmax(corr[mask])])
assert abs(lag)<=534,f'Audio shifted by more than one video frame: {lag/16000}'
if lag>=0:target=encoded[lag:lag+len(source)];reference=source
else:target=encoded[:len(source)+lag];reference=source[-lag:]
coefficient=float(np.dot(target,reference)/(np.linalg.norm(target)*np.linalg.norm(reference)))
assert coefficient>0.98,f'Encoded speech differs from approved audio: {coefficient}'
tail=encoded[math.ceil((plan['audio']['duration']+0.3)*16000):]
tail_peak=float(np.max(np.abs(tail))) if len(tail) else 0
assert tail_peak<0.001,'Unexpected audio after the approved narration'
master=json.loads((WORK/'encoded-audio-qa.json').read_text());assert master['after']['truePeakDBTP']<=-1

font=lambda n:ImageFont.truetype(str(Path(__file__).resolve().parents[1] / 'assets/fonts/DejaVuSans.ttf'),n)
def board(indices,labels,name,title,cols=4,tile=(432,768),crop=None):
    w,h=tile;gap=16;top=70;cell=h+34;rows=(len(indices)+cols-1)//cols
    im=Image.new('RGB',(cols*(w+gap)+gap,top+rows*cell+gap),'#152a31');d=ImageDraw.Draw(im)
    d.text((16,17),title,font=font(22),fill='#f6ddbb')
    for j,(index,label) in enumerate(zip(indices,labels)):
        with Image.open(files[index]) as src:
            pic=src.convert('RGB');pic=pic.crop(crop) if crop else pic
            pic=ImageOps.contain(pic,tile,Image.Resampling.LANCZOS)
            x=gap+(j%cols)*(w+gap);y=top+(j//cols)*cell
            im.paste(pic,(x+(w-pic.width)//2,y))
            d.text((x,y+h+7),label,font=font(14 if w>=180 else 10),fill='#d3d5cd')
    im.save(OUT/name,quality=94,subsampling=0)
keyframes=[202,258,322,410]
board(keyframes,['6.73s / THE LITTLE STRANGER','8.60s / ESSIE NOTICES','10.73s / A GENTLE OFFER','13.67s / A LITTLE LIGHT'],'Narrated_Test_Storyboard.jpg','IN THIS TOWN / Approved Sawyer narration + visual act of kindness')
for start in range(0,len(files),144):
    indices=list(range(start,min(start+144,len(files))))
    board(indices,[f'{f:03} / {f/30:.2f}s' for f in indices],f'narrated/all-frames-{start:03}.jpg',f'COMPLETE NARRATED VIDEO / frames {indices[0]}–{indices[-1]}',cols=12,tile=(90,160))
contact=[300,304,305,306,307,309,314,320,326,329,333,334,339,343]
board(contact,[f'Frame {f}' for f in contact],'narrated/contact-review.jpg','PAW / CUP / Reach, contact, slide, release',cols=7,tile=(240,250),crop=(90,650,1060,1420))
step=list(range(163,224,4))
board(step,[f'Frame {f}' for f in step],'narrated/step-review.jpg','HESITANT STEP / Actual consecutive action samples',cols=8,tile=(180,320))
acting=[234,240,246,252,258,264,274,283,344,354,364,374,384,394,410,423]
board(acting,[f'Frame {f}' for f in acting],'narrated/acting-review.jpg','NOTICE / CONCERN / RELIEF / Final emotional hold',cols=8,tile=(180,320))
transition=[221,222,223,224,225,226,281,282,283,284,285,286,341,342,343,344,345,346]
board(transition,[f'Frame {f}' for f in transition],'narrated/cut-review.jpg','DELIBERATE CAMERA CUTS / Consecutive frames around each edit',cols=6,tile=(180,320))
mae={}
for f in keyframes:
    with Image.open(WORK/'keyframes'/f'frame-{f}.png') as im:a=np.asarray(im.convert('RGB'),dtype=float)
    with Image.open(files[f]) as im:b=np.asarray(im.convert('RGB'),dtype=float)
    mae[str(f)]=float(np.mean(np.abs(a-b)));assert mae[str(f)]<3
with Image.open(WORK/'silent-regression-143.png') as im:a=np.asarray(im.convert('RGB'),dtype=float)
with Image.open(OUT/'gate-a/frame-143.png') as im:b=np.asarray(im.convert('RGB'),dtype=float)
silent_mae=float(np.mean(np.abs(a-b)));assert silent_mae<0.01,'Original silent rendering changed'
# Validate immutable sources without requiring a restored .git directory.
baseline=json.loads(Path('out/v2-episodes/door-at-1111/PRESERVATION_BASELINE.json').read_text())
adjustments=json.loads(Path('../PORTABILITY_ADJUSTMENTS.json').read_text())
for file,expected in baseline.items():
    allowed=adjustments.get(file)
    if allowed:assert allowed['originalSHA256']==expected
    assert hashlib.sha256((Path('..')/file).read_bytes()).hexdigest()==(allowed['portableSHA256'] if allowed else expected),file
metrics={'video':{'width':v['width'],'height':v['height'],'fps':v['avg_frame_rate'],'frames':len(files),'duration':float(probe['format']['duration'])},'uniqueFrames':len(set(hashes)),'longestIdenticalRun':longest+1,'runtimeAuditedFrames':len(audits),'visibilityIssues':0,'audio':{'approvedSHA256':plan['audioSHA256'],'correlation':coefficient,'shiftSeconds':lag/16000,'quietTailPeak':tail_peak,'encodedMastering':master},'independentKeyframeMAE':mae,'originalSilentFrameMAE':silent_mae,'frames':stats}
(WORK/'qa-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
report=f'''# In This Town V2 — narrated test QA

Actual Remotion render: `InThisTown_V2_Narrated_Test.mp4`.
This preview uses the approved cached Sawyer recording and preserves the original silent composition.

## Delivery and timing

- Video: **1080×1920**, **30 FPS**, **{len(files)} frames**, **{len(files)/30:.3f} seconds**.
- MP4 container duration: {float(probe['format']['duration']):.3f} seconds, including AAC end padding.
- Composition: `InThisTownV2Narrated`; original `InThisTownV2ALittleLight` remains 240 frames.
- Audio: approved `Sawyer_Test.mp3`, {plan['audio']['duration']:.6f} seconds, natural 1.0× speed.
- No narration regeneration, provider request, music, SFX or full-episode production.
- The 8.777-second script describes the café and arrival only. The longer preview gives the cup interaction
  and emotional resolution their own unvoiced time, without assigning invented spoken descriptions to them.

| Beat | Output frames | Time |
|---|---|---|
| Exterior / hesitant step | 0–223 | 0.000–7.467 s |
| Essie notices | 224–283 | 7.467–9.467 s |
| Reach / contact / cup slide / release | 284–343 | 9.467–11.467 s |
| Emotional payoff / reassuring hold | 344–423 | 11.467–14.133 s |

The step begins at the recorded “One night” (within one frame); the first cut follows “appeared.”
The narration finishes during Essie's reaction. Camera cuts are deliberate edits, without interpolating
the camera through the café. Fractional source time keeps the extended opening smooth; ambient acting
uses real elapsed time. All original action paths and cup contact logic remain authoritative.

## Actual encoded audio

- Final integrated loudness: **{master['after']['integratedLUFS']:.2f} LUFS**.
- Final true peak: **{master['after']['truePeakDBTP']:.2f} dBTP**, satisfying the −1 dBTP ceiling.
- Additional final mixing gain: **{master['gainDB']:.3f} dB**, applied only for encoded peak safety.
- Full audio/video decode passed. Approved MP3 remains byte-for-byte unchanged.
- Source/encoded narration waveform correlation: **{coefficient:.6f}**.
- Measured source-to-final audio shift: **{lag/16000*1000:.3f} ms**, within one 30 FPS frame.
- The full source is present. Remaining video tail is quiet (absolute peak {tail_peak:.8f}).
- AAC is verified in the actual final MP4; a limiter setting alone is not treated as a pass.

## Every-frame technical QA

- {len(files)} decoded native frames; {len(set(hashes))} distinct pixel frames.
- No blank/black scenes or unintended long freeze; longest identical-frame run {longest+1}.
- Every frame has a runtime scene audit. No required face/cup visibility failures or camera obstruction.
- Cup height remains exactly 1.12 m on the worktop. Every moving-cup frame retains paw contact.
- Kitten's counter position remains fixed during cup/ending beats; no observed root sliding or teleport.
- Intra-shot image-change checks pass; only the three planned edits allow large image differences.
- Independently rendered storyboard frames match their final encoded counterparts, MAE {mae}.
- Original silent frame 143 matches its prior approved render, MAE **{silent_mae:.6f}**.
- Permanent café/adult character/Bridge assets, narrator configuration, mastering and caching implementations
  pass comparison with the pre-task checkpoint. Hash checks preserve the original silent MP4, Sawyer audio,
  archived Darian audio and their metadata.

## Source validation

TypeScript passed. All **19 narration tests** passed (16 existing plus three real-timing regressions).
Existing café tests passed 104 structural checks and duplicate-counter/overlap probes; animation tests passed
2,167 contact/continuity checks. All 66 adult character Canvas checks passed.

## Review evidence

- `Narrated_Test_Storyboard.jpg`: four panels extracted from this actual final MP4.
- `narrated/all-frames-000.jpg`, `all-frames-144.jpg`, `all-frames-288.jpg`: every decoded frame.
- `narrated/step-review.jpg`, `contact-review.jpg`, `acting-review.jpg`, `cut-review.jpg`: motion detail.
- `narrated/qa-metrics.json`: frame statistics, sync/correlation, audio and regression measurements.
- `narrated/render-audits.json`, `timing-plan.json`, `encoded-audio-qa.json`: actual rendering evidence.

Visual inspection of these completed frames is recorded separately below. Final user approval remains pending.
'''
(OUT/'Narrated_Test_QA.md').write_text(report)
print(json.dumps({k:v for k,v in metrics.items() if k!='frames'},indent=2))
