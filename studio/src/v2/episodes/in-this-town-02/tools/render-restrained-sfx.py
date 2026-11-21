"""Episode02 meow/cardboard-only Foley. Reuses the existing meow synthesis family.
No narration, music, browser, provider calls or third-party audio downloads.
"""
from pathlib import Path
import argparse, json, math, wave
import numpy as np

SCENE=Path(__file__).resolve().parent.parent
STUDIO=SCENE.parents[3]
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,default=STUDIO/'out/v2-episodes/in-this-town-02');args=p.parse_args()
OUT=args.out
policy=json.loads((SCENE/'AUDIO_POLICY.json').read_text(encoding='utf-8'))
manifest=json.loads((OUT/'EP02_SHOT_MANIFEST.json').read_text(encoding='utf-8'))
props=json.loads((OUT/'render-props.json').read_text(encoding='utf-8'))
scratch=json.loads((SCENE/'EDITORIAL_SCRATCH_PLAN.json').read_text(encoding='utf-8'))
SR=48000;FPS=30;N=round(manifest['durationInFrames']/FPS*SR)
if [(s['id'],s['start'],s['end']) for s in manifest['shots']] != [(s['id'],s['start'],s['end']) for s in props['shots']]:
    raise ValueError('Manifest and live narration props differ. No SFX written.')
sfx=np.zeros((N,2),np.float32);events=[]
def ease(t):return np.clip(t,0,1)
def envelope(t,attack,release):return ease(t/max(.001,attack))*np.exp(-t/max(.025,release))
def frame_for(beat,u):
    src=next(s for s in scratch['shots'] if s['sequence']==beat)
    desired=src['estimateStartFrame']+u*(src['estimateEndFrame']-src['estimateStartFrame']-1)
    parts=[s for s in props['shots'] if s['sequence']==beat]
    for s in parts:
        lo=s.get('sourceStart',src['estimateStartFrame']);hi=s.get('sourceEnd',src['estimateEndFrame'])-1
        if lo-.001 <= desired <= hi+.001:
            alpha=np.clip((desired-lo)/max(1,hi-lo),0,1)
            return round(s['start']+alpha*(s['end']-s['start']-1))
    raise ValueError(f'No live source mapping for SFX beat {beat} at {u}')
for i,event in enumerate(policy['events']):
    kind=event['kind']
    if kind not in ('cat-meow','box'):raise ValueError('Unapproved SFX kind: '+kind)
    frame=frame_for(event['beat'],event['sourceU']);gain=float(event['gain'])
    if not 0<=gain<=.20:raise ValueError('SFX gain outside restrained policy')
    if kind=='cat-meow':
        # Same pre-existing Episode02 cartoon meow; no added magic/purr layer.
        t=np.arange(round(.48*SR),dtype=np.float32)/SR
        freq=(event.get('tone',1)*380)*(1+.24*np.sin(t*8)-.18*t)
        phase=np.cumsum(freq)/SR
        x=(np.sin(2*np.pi*phase)+.18*np.sin(4*np.pi*phase))*envelope(t,.085,.22)
    else:
        dur=event.get('duration',.25);t=np.arange(round(dur*SR),dtype=np.float32)/SR
        rng=np.random.default_rng(220211+event['beat']*101+i)
        noise=rng.standard_normal(len(t)).astype(np.float32)
        smooth=np.convolve(noise,np.ones(31,dtype=np.float32)/31,mode='same')
        # Paper fibres and flex only: omit the old pitched sweep/tonal accent.
        x=(noise*.12+smooth*.85)*envelope(t,.012,.10)
    x*=np.minimum(1,t/.004)*np.minimum(1,(t[-1]-t)/.015)
    start=round(frame/FPS*SR);length=min(len(x),N-start)
    if length<=0:raise ValueError('SFX falls outside the film')
    pan=event.get('pan',0);gains=np.array([math.sqrt((1-pan)*.5),math.sqrt((1+pan)*.5)],np.float32)
    sfx[start:start+length]+=x[:length,None]*gain*gains[None,:]
    events.append({**event,'frame':frame,'seconds':frame/FPS,'source':'existing original procedural meow / original unpitched cardboard Foley'})
if not np.isfinite(sfx).all():raise ValueError('Invalid SFX samples')
peak=float(np.abs(sfx).max())
if peak>=.25:raise ValueError('Restrained SFX peak exceeded; no stem written')
file=OUT/'SFX_Stem.wav'
with wave.open(str(file),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((sfx*32767).astype('<i2').tobytes())
report={'policy':'MEOWS_AND_BOXES_ONLY','allowedKinds':['cat-meow','box'],'events':events,
        'cueCount':len(events),'durationSeconds':N/SR,'samplePeak':peak,'paidRequests':0,
        'sourceSFXLicense':'Original deterministic procedural synthesis; meows are cartoon synthesis, not recordings',
        'removed':['magic tones','pops','ticks','whooshes','purr loops','footstep effects','musical accents'],
        'sfx':{'file':str(file),'samples':N},'music':None,
        'note':'Narration/music unchanged. Actual listening review remains required.'}
(OUT/'EP02_AUDIO_SOURCE.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(OUT/'EP02_SOUND_CUES.json').write_text(json.dumps(events,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='events'},indent=2))
