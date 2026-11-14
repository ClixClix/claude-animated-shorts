"""Original deterministic procedural cartoon Foley; no downloaded or third-party SFX."""
from pathlib import Path
import json,subprocess,hashlib
import numpy as np
from scipy import signal
ROOT=Path('out/v2-episodes/door-at-1111');plan=json.loads((ROOT/'SFX_CUES.json').read_text());SR=48000;D=plan['duration'];N=round(D*SR)
rng=np.random.default_rng(1111);mix=np.zeros((N,2),np.float64)
def filtered(x,low,high):
 return signal.sosfilt(signal.butter(2,[low,high],btype='bandpass',fs=SR,output='sos'),x)
def put(x,at,gain=1,pan=0):
 start=round(at*SR);end=min(N,start+len(x));x=x[:end-start]*gain
 if start<0 or end<=start:return
 mix[start:end,0]+=x*np.sqrt((1-pan)/2);mix[start:end,1]+=x*np.sqrt((1+pan)/2)
def env(t,d):return np.sin(np.pi*np.minimum(1,t/d))**2
# Continuous rain and restrained room/night ambience.
rain=filtered(rng.normal(0,1,N),450,8500);time=np.arange(N)/SR
wet=np.clip((time-plan['rainStart'])/2,0,1);put(rain,0,.0065*wet)
room=filtered(rng.normal(0,1,N),90,950);put(room,0,.0012)
# Bus pulls away during the opening, and briefly in the final explanatory callback.
def bus(at,d=2.6):
 t=np.arange(round(d*SR))/SR;phase=2*np.pi*(61*t+12*t*t);x=(np.sin(phase)+.35*np.sin(phase*2)+.2*filtered(rng.normal(0,1,len(t)),80,800))*np.sin(np.pi*np.minimum(1,t/d))**.5
 put(x,at,.045,-.40)
bus(0)
manifest=json.loads((ROOT/'The_Door_At_1111_Shot_Manifest.json').read_text())
callback=next(s for s in manifest['shots'] if s['id']=='58A');bus(callback['start']/30,1.5)
results=[]
for i,event in enumerate(plan['events']):
 kind=event['type'];d=.22
 if kind=='kitten-meow':d=.63
 elif kind=='door-hinge':d=.82
 elif kind=='blanket-rustle':d=.56
 elif kind=='warm-accent':d=.9
 elif kind=='door-slam':d=.32
 t=np.arange(round(d*SR))/SR;noise=rng.normal(0,1,len(t));x=np.zeros_like(t);gain=1
 if kind in ['run-step','soft-step']:
  x=(np.sin(2*np.pi*(135*t-95*t*t))+filtered(noise,650,6000)*.8)*np.exp(-t*30);gain=.065 if kind=='run-step' else .026
 elif kind=='window-tap':x=(np.sin(2*np.pi*1850*t)+.45*np.sin(2*np.pi*3330*t))*np.exp(-t*55);gain=.10
 elif kind=='clock-tick':x=filtered(noise,1800,7000)*np.exp(-t*150);gain=.038
 elif kind=='door-latch':x=filtered(noise,450,6000)*np.exp(-t*60)+.4*np.sin(2*np.pi*650*t)*np.exp(-t*70);gain=.065
 elif kind=='door-hinge':x=(np.sin(2*np.pi*(330*t+12*np.sin(t*5)))+.3*np.sin(2*np.pi*690*t))*env(t,d);gain=.012
 elif kind=='electric-buzz':x=(np.sin(2*np.pi*60*t)+.28*np.sin(2*np.pi*120*t)+filtered(noise,2200,7000)*.10)*env(t,d);gain=.027
 elif kind=='light-fail':x=filtered(noise,700,6500)*np.exp(-t*75);gain=.033
 elif kind=='switch-click':x=filtered(noise,1200,7000)*np.exp(-t*160)+np.sin(2*np.pi*1700*t)*np.exp(-t*110);gain=.075
 elif kind=='door-slam':x=(np.sin(2*np.pi*88*t)+.4*filtered(noise,130,2200))*np.exp(-t*18);gain=.11
 elif kind=='slip':x=filtered(noise,900,6000)*env(t,d);gain=.055
 elif kind=='bowl-contact':x=(np.sin(2*np.pi*980*t)+.28*np.sin(2*np.pi*2300*t))*np.exp(-t*40);gain=.085
 elif kind=='blanket-rustle':x=filtered(noise,380,5000)*env(t,d)*(.6+.3*np.sin(t*33));gain=.027
 elif kind=='kitten-meow':
  f=420+260*np.exp(-((t-.22)/.13)**2)-100*t/d;phase=2*np.pi*np.cumsum(f)/SR
  for k in range(1,10):
   strength=(.25+np.exp(-((k*f-1100)/700)**2)+.3*np.exp(-((k*f-2600)/700)**2))/k
   x+=strength*np.sin(k*phase+.04*np.sin(t*69))
  x*=env(t,d);gain=.077
 elif kind=='warm-accent':x=(np.sin(2*np.pi*523.25*t)+.5*np.sin(2*np.pi*659.25*t))*env(t,d)*np.exp(-t*2);gain=.012
 else:raise ValueError(kind)
 x*=np.minimum(1,t/.002)*np.minimum(1,(d-t)/.008)
 put(x,event['frame']/30,gain,(-.08 if i%2 else .08));results.append({'frame':event['frame'],'type':kind,'duration':d})
# Gentle fade of ambience at the film boundary; discrete story events retain their envelopes.
fade=np.clip((D-time)/1.1,0,1);mix*=fade[:,None]
peak=float(np.abs(mix).max());assert peak<.90 and np.isfinite(mix).all()
file=ROOT/'SFX_Stem.wav'
subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','pipe:0','-c:a','pcm_f32le',str(file)],input=mix.astype('<f4').tobytes(),check=True)
(ROOT/'SFX_PROVENANCE.json').write_text(json.dumps({'license':'Original procedural synthesis created for this project; no third-party SFX recordings','sampleRate':SR,'channels':2,'duration':D,'seed':1111,'samplePeak':peak,'events':results,'cuesSHA256':hashlib.sha256((ROOT/'SFX_CUES.json').read_bytes()).hexdigest(),'sourceSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'audioSHA256':hashlib.sha256(file.read_bytes()).hexdigest()},indent=2)+'\n')
print(json.dumps({'file':str(file),'duration':D,'events':len(results),'samplePeak':peak}))
