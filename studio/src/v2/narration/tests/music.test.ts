import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {musicSourceFilter} from '../server/music';

test('clean music phrase fills the edit, excludes later source and keeps seamless repeated samples',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'v2-clean-music-'));
 try{
  const file=path.join(dir,'source.wav'),sr=48000;
  // A later high tone represents unwanted source material; it must never enter the loop.
  execFileSync('ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i',"aevalsrc=if(lt(t\\,1.5)\\,0.1*sin(2*PI*300*t)\\,0.1*sin(2*PI*3000*t)):s=48000:d=3",'-c:a','pcm_f32le',file]);
  const plan=musicSourceFilter({startSeconds:0,periodSeconds:.907,crossfadeSeconds:.03},6.2,sr);
  const bytes=execFileSync('ffmpeg',['-nostdin','-v','error','-i',file,'-filter_complex',plan.filter,'-map','[music-source]','-f','f32le','pipe:1'],{maxBuffer:8*1024*1024});
  assert.equal(bytes.length,Math.round(6.2*sr)*2*4,'loop must fill the edit without padding');
  const frames=bytes.length/8,value=(n:number)=>bytes.readFloatLE(n*8),period=plan.periodSamples;
  let repeatDifference=0,seamStep=0,real=0,imag=0,highReal=0,highImag=0;
  for(let n=0;n<period;n++)repeatDifference=Math.max(repeatDifference,Math.abs(value(n)-value(n+period*3)));
  for(let k=1;k<6;k++)seamStep=Math.max(seamStep,Math.abs(value(k*period)-value(k*period-1)));
  for(let n=0;n<frames;n++){const v=value(n),a=2*Math.PI*n/sr;real+=v*Math.cos(a*300);imag+=v*Math.sin(a*300);highReal+=v*Math.cos(a*3000);highImag+=v*Math.sin(a*3000);}
  assert.ok(repeatDifference<1e-6,'loop bodies and seams must repeat without corruption');
  assert.ok(seamStep<.01,'the wrap must not introduce a waveform click');
  assert.ok(Math.hypot(real,imag)>Math.hypot(highReal,highImag)*100,'later high tone must be excluded, while the opening tone stays present');
 }finally{await rm(dir,{recursive:true,force:true});}
});
