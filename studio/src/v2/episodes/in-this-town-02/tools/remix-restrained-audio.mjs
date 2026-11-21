/** Reuse the existing visual stream and mastering stage. No Remotion or audio APIs. */
import fs from 'node:fs/promises';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
const scene=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),studio=path.resolve(scene,'../../../..');
await import(pathToFileURL(path.join(studio,'scripts/lib/runtime.mjs')).href);
const out=path.join(studio,'out/v2-episodes/in-this-town-02');
const exists=async p=>fs.access(p).then(()=>true,()=>false);
const hash=async p=>createHash('sha256').update(await fs.readFile(p)).digest('hex');
const capture=(program,args)=>{const r=spawnSync(program,args,{cwd:studio,encoding:'utf8',env:process.env,maxBuffer:16*1024*1024});if(r.error)throw r.error;if(r.status!==0)throw Error(program+' failed: '+r.stderr+'\n'+r.stdout);return r;};
const run=(program,args)=>{const r=spawnSync(program,args,{cwd:studio,stdio:'inherit',env:process.env});if(r.error)throw r.error;if(r.status!==0)throw Error(program+' exited '+r.status);};
const pythonCandidates=[process.env.V2_PYTHON,path.join(studio,'..','.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python'),...(process.platform==='win32'?['C:/V2/.venv/Scripts/python.exe']:[]),'python'].filter(Boolean);
const python=pythonCandidates.find(p=>{const r=spawnSync(p,['-c','import numpy'],{cwd:studio,encoding:'utf8'});return !r.error&&r.status===0;});
if(!python)throw Error('No Python with numpy. Set V2_PYTHON to your existing project venv. Nothing changed.');
const readiness=JSON.parse(await fs.readFile(path.join(out,'PRODUCTION_READINESS.json'),'utf8'));
if(!readiness.voiceProvided)throw Error('Approved narration is required; refusing to remix a scratch edit.');
const manifest=JSON.parse(await fs.readFile(path.join(out,'EP02_SHOT_MANIFEST.json'),'utf8'));
const protectedInputs=['Narration_Stem.wav','Music_Stem.wav','EP02_1080p_Visual.mp4'];
for(const n of protectedInputs)if(!await exists(path.join(out,n)))throw Error('Missing existing production input: '+n);
const before=Object.fromEntries(await Promise.all(protectedInputs.map(async n=>[n,await hash(path.join(out,n))])));
const names=['SFX_Stem.wav','EP02_AUDIO_SOURCE.json','EP02_SOUND_CUES.json','MASTER_No_Music.wav','MASTER_With_Music.wav','EP02_Final_No_Music.mp4','EP02_Final_With_Music.mp4','EP02_FINISHING_STATUS.json'];
const backup=path.join(out,'audio-remix-backup-'+Date.now());await fs.mkdir(backup,{recursive:true});
const present=[];
for(const n of names)if(await exists(path.join(out,n))){await fs.copyFile(path.join(out,n),path.join(backup,n));present.push(n);}
const videoHash=p=>capture('ffmpeg',['-nostdin','-v','error','-i',p,'-map','0:v:0','-c:v','copy','-an','-f','hash','-hash','sha256','-']).stdout.trim();
const sourceVideoHash=videoHash(path.join(out,'EP02_1080p_Visual.mp4'));
try{
 run(python,[path.join(scene,'tools/render-restrained-sfx.py')]);
 run(process.execPath,['scripts/episode02-finish.mjs']);
 const checks=[];
 for(const n of ['EP02_Final_No_Music.mp4','EP02_Final_With_Music.mp4']){
  const file=path.join(out,n);
  const probe=JSON.parse(capture('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]).stdout);
  const v=probe.streams.find(x=>x.codec_type==='video');
  if(!v||v.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1')throw Error('Unexpected video format: '+n);
  if(Math.abs(Number(probe.format.duration)-manifest.durationInFrames/30)>.10)throw Error('Unexpected encoded duration: '+n);
  if(Number(v.nb_frames)!==manifest.durationInFrames)throw Error('Unexpected encoded frame count: '+n);
  if(videoHash(file)!==sourceVideoHash)throw Error('Video stream changed: '+n);
  const measured=capture('ffmpeg',['-nostdin','-hide_banner','-i',file,'-map','0:a:0','-af','loudnorm=I=-16:TP=-1:LRA=10:print_format=json','-f','null','-']).stderr;
  const match=measured.match(/\{\s*"input_i"[\s\S]*?\}/g)?.at(-1);
  if(!match)throw Error('Could not measure encoded true peak: '+n);
  const stats=JSON.parse(match),peak=Number(stats.input_tp);
  if(!Number.isFinite(peak)||peak>-1)throw Error('Encoded true peak exceeds -1 dBTP: '+n+' '+peak);
  checks.push({file:n,videoStreamUnchanged:true,truePeakDBTP:peak,duration:probe.format.duration});
 }
 for(const n of protectedInputs)if(await hash(path.join(out,n))!==before[n])throw Error('Protected input changed: '+n);
 await fs.writeFile(path.join(out,'RESTRAINED_AUDIO_QA.json'),JSON.stringify({policy:'MEOWS_AND_BOXES_ONLY',backup,paidRequests:0,renderedVideo:false,checks,listeningReview:'PENDING',publishingAllowed:false},null,2)+'\n');
 console.log('Audio remix complete. Video packets, narration stem and music stem unchanged. Backups: '+backup);
}catch(e){
 for(const n of names){if(present.includes(n))await fs.copyFile(path.join(backup,n),path.join(out,n));else await fs.rm(path.join(out,n),{force:true});}
 throw e;
}
