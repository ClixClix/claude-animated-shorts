#!/usr/bin/env python3
"""Original deterministic Episode 02 Foley only; no provider/API calls.

The soundtrack is handled separately by episode02-series-music.mjs using the
actual Episode 01 licensed-source preset. Do NOT synthesize stand-in music.
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

# Episode01-style narrated edits may split a beat into A/B/C segments.
# Music follows every segment, but physical sound actions happen ONCE per
# spoken story beat, not at every internal camera cut.
by_number={}
for item in manifest['shots']:
    by_number.setdefault(int(item['sequence']),[]).append(item)
seen_beats=set()
for i,shot in enumerate(manifest['shots']):
    start=shot['start']/FPS;end=shot['end']/FPS;span=end-start
    n=int(shot['sequence']);cue=shot['soundCue'].lower()
    at=start+min(.25,span*.16)
    if n in seen_beats:
        events.append({'shot':shot['id'],'start_seconds':start,'end_seconds':end,
          'description':'continued shot: SFX only; no duplicate cue',
          'suggested_sync_seconds':at,'source':'original deterministic procedural synthesis'})
        continue
    seen_beats.add(n)
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
    pieces=by_number[number]
    first,last=pieces[0],pieces[-1]
    t=first['start']/FPS+(last['end']-first['start'])/FPS*.6
    magic(t-.12,.26,reverse=reverse)
# Natural ending fade avoids abrupt tail.
fade=min(round(3*SR),N)
if fade>0:
    ramp=np.linspace(1,0,fade,dtype=np.float32)
    sfx[-round(.25*SR):]*=np.linspace(1,0,round(.25*SR),dtype=np.float32)[:,None]

def write(name,arr):
    peak=float(np.max(np.abs(arr))) or 1.0
    arr=(arr*min(1,.75/peak)).clip(-.97,.97)
    pcm=(arr*32767).astype('<i2')
    with wave.open(str(OUT/name),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
    return {'file':str(OUT/name),'samples':N,'peak_before_safety':peak}
report={'original':True,'sourceSFXLicense':'original deterministic procedural synthesis','paidRequests':0,
        'durationSeconds':duration,'cueCount':len(events),
        'sfx':write('SFX_Stem.wav',sfx),
        'music':None,
        'note':'Foley only. Episode 01 music requires the real user-supplied source via episode02-series-music.mjs.'}
(OUT/'EP02_AUDIO_SOURCE.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(OUT/'EP02_SOUND_CUES.json').write_text(json.dumps(events,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
