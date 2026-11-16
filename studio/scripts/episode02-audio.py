#!/usr/bin/env python3
"""Original deterministic Episode 02 cartoon Foley and underscore. No service/API calls.

Generates SFX_Stem.wav, Original_Music_Stem.wav and sound cue timing report from
the latest shot manifest. These stems are original synthesized source, not
samples/imitations of an existing copyrighted recording. The result is a
production *starting mix*, not a substitute for critical human audio review.
"""
from __future__ import annotations
from pathlib import Path
import json, math, wave
import numpy as np

OUT=Path('out/v2-episodes/in-this-town-02')
manifest=json.loads((OUT/'EP02_SHOT_MANIFEST.json').read_text(encoding='utf-8'))
FPS=30; SR=48000
duration=manifest['durationInFrames']/FPS
N=round(duration*SR)
rng=np.random.default_rng(220211)
sfx=np.zeros((N,2),np.float32)
music=np.zeros((N,2),np.float32)
events=[]
def add(audio, when, mono, gain=.4, pan=0):
    a=max(0,round(when*SR))
    length=min(len(mono),N-a)
    if length<=0:return
    g=np.clip(gain,0,1)
    audio[a:a+length,0]+=mono[:length]*g*np.sqrt((1-np.clip(pan,-1,1))*.5)
    audio[a:a+length,1]+=mono[:length]*g*np.sqrt((1+np.clip(pan,-1,1))*.5)
def env(t, attack=.015, release=.18):
    a=np.clip(t/max(.001,attack),0,1)
    return a*np.exp(-t/max(.025,release))
def tick(when, gain=.28,pan=0):
    t=np.arange(round(.16*SR),dtype=np.float32)/SR
    x=np.sin(2*np.pi*(510*t+230*t*t))*np.exp(-t*24)
    x+=rng.standard_normal(len(t)).astype(np.float32)*np.exp(-t*48)*.12
    add(sfx,when,x,gain,pan)
def box(when,gain=.38,pan=0,dur=.35):
    t=np.arange(round(dur*SR),dtype=np.float32)/SR
    noise=rng.standard_normal(len(t)).astype(np.float32)
    smooth=np.convolve(noise,np.ones(31,dtype=np.float32)/31,mode='same')
    scrape=(noise*.18+smooth*.9)*env(t,.018,.13)
    flex=np.sin(2*np.pi*(105*t+260*t*t))*np.exp(-t*18)*.35
    add(sfx,when,scrape+flex,gain,pan)
def magic(when,gain=.46,pan=0,reverse=False):
    t=np.arange(round(.7*SR),dtype=np.float32)/SR
    f=(420-265*t) if not reverse else (190+610*t)
    phase=np.cumsum(f)/SR
    x=(np.sin(2*np.pi*phase)+.45*np.sin(2*np.pi*phase*1.77))*env(t,.045,.37)
    x+=rng.standard_normal(len(t)).astype(np.float32)*env(t,.025,.12)*.06
    add(sfx,when,x,gain,pan)
def meow(when,gain=.24,pan=0,tone=1.0):
    # Original cartoon vocal-like synth; never claims to be real cat audio.
    t=np.arange(round(.48*SR),dtype=np.float32)/SR
    freq=(tone*380)*(1+.24*np.sin(t*8)-.18*t)
    phase=np.cumsum(freq)/SR
    x=(np.sin(2*np.pi*phase)+.18*np.sin(4*np.pi*phase))*env(t,.085,.22)
    add(sfx,when,x,gain,pan)
def pad(when,length,notes,gain=.12):
    if length<=0:return
    t=np.arange(round(length*SR),dtype=np.float32)/SR
    ramp=np.minimum(1,np.minimum(t/.55,(length-t)/.75)).clip(0,1)
    v=np.zeros(len(t),np.float32)
    for k,note in enumerate(notes):
        hz=440*2**((note-69)/12)
        v+=np.sin(2*np.pi*hz*t+k*.25).astype(np.float32)*(.62+0.18*np.sin(t*.13+k))
        v+=.14*np.sin(2*np.pi*hz*2*t+k*.4).astype(np.float32)
    v=v/max(1,len(notes))*ramp
    add(music,when,v,gain)
def footfalls(when,count=3):
    for i in range(count):
        t=np.arange(round(.075*SR),dtype=np.float32)/SR
        impact=np.sin(2*np.pi*(90+30*(i%2))*t).astype(np.float32)*np.exp(-t*48)
        add(sfx,when+i*.16,impact,.29,(-1 if i%2 else 1)*.25)
def whoosh(when,gain=.33,reverse=False):
    t=np.arange(round(.38*SR),dtype=np.float32)/SR
    noise=rng.standard_normal(len(t)).astype(np.float32)
    filtered=np.convolve(noise,np.ones(121,dtype=np.float32)/121,mode='same')
    shape=np.sin(np.pi*np.clip(t/.38,0,1))**2
    if reverse:shape=shape[::-1]
    add(sfx,when,filtered*shape,gain)
def purr(when,dur=.65,gain=.23,pan=0):
    t=np.arange(round(dur*SR),dtype=np.float32)/SR
    x=np.sin(2*np.pi*45*t)*(1+.34*np.sin(2*np.pi*21*t))
    x*=np.sin(np.pi*np.clip(t/dur,0,1))**2
    add(sfx,when,x,gain,pan)

ACT_CHORDS={
 'RULE':[48,55,60], 'INTRO':[50,57,62], 'LATTE':[45,52,57],
 'GUARD':[48,55,60], 'MISSING':[45,52,56], 'SEARCH':[43,50,55],
 'TRANSFORM':[42,49,54], 'AFTERMATH':[41,48,53],
 'CURE':[48,55,60], 'TOWN':[50,57,62], 'END':[53,60,65],
}
for i,shot in enumerate(manifest['shots']):
    start=shot['start']/FPS;end=shot['end']/FPS;span=end-start
    n=int(shot['sequence']);cue=shot['soundCue'].lower()
    act=str(shot['act']).upper()
    base=.09 if act in ('RULE','MISSING','SEARCH','TRANSFORM','AFTERMATH') else .10
    if act=='CURE':base=.095
    if act=='END':base=.13
    # Original low-level motif that changes harmony with the narrative act.
    pad(start,span+.05,ACT_CHORDS.get(act,[48,55,60]),gain=base)
    at=start+min(.25,span*.16)
    if 'creak' in cue or 'cardboard' in cue or 'paper' in cue or 'flap' in cue or 'rustl' in cue:box(at,pan=math.sin(i))
    if 'foot' in cue or 'paw' in cue or 'running' in cue:footfalls(at,min(6,max(2,round(span/.24))))
    if 'meow' in cue or 'mew' in cue or 'purr' in cue:
        meow(at+.24,tone=1.3 if n in (13,55) else 1.0)
    if 'purr' in cue:purr(at+.15,pan=math.sin(i*.8))
    if 'tension' in cue or 'heart' in cue:tick(at,gain=.18)
    if 'swoop' in cue or 'wind' in cue or 'sprint' in cue:whoosh(at,gain=.26)
    if 'knock' in cue or 'tap' in cue or 'thump' in cue:
        tick(at,.32,-.2);tick(at+.20,.29,.2)
    if 'magical' in cue or 'transformation' in cue or 'magic' in cue:
        moment=start+span*(.82 if n in (3,39,55) else .50)
        magic(moment-.16,gain=.62 if n in (3,39,55) else .43,reverse=n in (50,55))
        box(moment-.06,gain=.55 if n in (3,39) else .36)
    if 'pop' in cue:magic(start+span*.52,gain=.73,reverse=True)
    if 'happy' in cue:meow(at+.24,gain=.3)
    if 'music' in cue or 'chord' in cue:tick(at,.11)
    events.append({'shot':shot['id'],'start_seconds':start,'end_seconds':end,'description':shot['soundCue'],
      'suggested_sync_seconds':at,'source':'original deterministic procedural synthesis'})

# Distinct shared motifs: small rising chord into cure, release stingers at both rescues.
for number,reverse in [(3,False),(39,False),(50,True),(51,True),(55,True)]:
    shot=manifest['shots'][number-1]
    t=shot['start']/FPS+(shot['end']-shot['start'])/FPS*.6
    magic(t-.12,.26,reverse=reverse)
# Natural ending fade avoids abrupt tail.
fade=min(round(3*SR),N)
if fade>0:
    ramp=np.linspace(1,0,fade,dtype=np.float32)
    music[-fade:]*=ramp[:,None]
    sfx[-round(.25*SR):]*=np.linspace(1,0,round(.25*SR),dtype=np.float32)[:,None]

def write(name,arr):
    peak=float(np.max(np.abs(arr))) or 1.0
    arr=(arr*min(1,.75/peak)).clip(-.97,.97)
    pcm=(arr*32767).astype('<i2')
    with wave.open(str(OUT/name),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
    return {'file':str(OUT/name),'samples':N,'peak_before_safety':peak}
report={'original':True,'sourceMusicLicense':'original deterministic procedural composition',
        'sourceSFXLicense':'original deterministic procedural synthesis','paidRequests':0,
        'durationSeconds':duration,'cueCount':len(events),
        'sfx':write('SFX_Stem.wav',sfx),
        'music':write('Original_Music_Stem.wav',music),
        'note':'First complete automatic score/Foley pass; human listening and exact contact cue review are still required.'}
(OUT/'EP02_AUDIO_SOURCE.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(OUT/'EP02_SOUND_CUES.json').write_text(json.dumps(events,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
