import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {canonicalJSON} from './episode02-render-inputs.mjs';
const exists=async p=>fs.access(p).then(()=>true,()=>false);
export const hashFile=async p=>createHash('sha256').update(await fs.readFile(p)).digest('hex');
export const reviewFolder=root=>path.join(root,'out/v2-episodes/in-this-town-02');
export function command(program,args,{root,capture=false}={}){
 const r=spawnSync(program,args,{cwd:root,env:process.env,windowsHide:true,
  ...(capture?{encoding:'utf8',maxBuffer:16*1024*1024}:{stdio:'inherit'})});
 if(r.error)throw r.error;if(r.status!==0)throw Error(path.basename(program)+' exited '+r.status+(capture?': '+r.stderr.trim():''));return r.stdout;
}
export function probe(file,root){return JSON.parse(command('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{root,capture:true}));}
export function validateMovie(p,frames,preview=true){
 const v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
 if(!v||v.width!==(preview?540:1080)||v.height!==(preview?960:1920)||v.r_frame_rate!=='30/1'||Number(v.nb_frames)!==frames||!Number.isFinite(Number(p.format?.duration))||Math.abs(Number(p.format.duration)-frames/30)>.1)
  throw Error('Review movie dimensions, frame rate, frame count or duration differ from the live edit');
 if(!a||a.codec_name!=='aac'||Number(a.sample_rate)!==48000||Number(a.channels)!==2)throw Error('Review soundtrack is not AAC stereo 48kHz');
 return {frames:Number(v.nb_frames),width:v.width,height:v.height,fps:v.r_frame_rate,duration:Number(p.format.duration),audioCodec:a.codec_name};
}
export async function inspectReadiness(root){
 const out=reviewFolder(root),required=['render-props.json','EP02_SHOT_MANIFEST.json','EP02_ADAM_NARRATED_EDIT.json','PRODUCTION_READINESS.json','MASTER_With_Music.wav'];
 const missing=[];for(const n of required)if(!await exists(path.join(out,n)))missing.push('out/v2-episodes/in-this-town-02/'+n);
 const issues=[];for(const exe of ['ffmpeg','ffprobe'])try{command(exe,['-version'],{root,capture:true});}catch{issues.push(exe+' is unavailable on PATH');}
 for(const n of ['node_modules/typescript/bin/tsc','src/v2/episodes/in-this-town-02/PRODUCTION_DIRECTOR_LOCK.json'])if(!await exists(path.join(root,n)))missing.push(n);
 if(missing.length||issues.length)return {ready:false,missing,issues};
 const read=async n=>JSON.parse(await fs.readFile(path.join(out,n),'utf8'));
 try{
  const [props,manifest,narrated,readiness]=await Promise.all(['render-props.json','EP02_SHOT_MANIFEST.json','EP02_ADAM_NARRATED_EDIT.json','PRODUCTION_READINESS.json'].map(read));
  if(props.audioApproved!==true||readiness.voiceProvided!==true)issues.push('The existing edit is a scratch or has no approved narration');
  const shots=props.shots,frames=shots?.at(-1)?.end;
  if(!Array.isArray(shots)||!shots.length||!Number.isInteger(frames)||shots[0].start!==0||shots.some((s,i)=>s.end<=s.start||s.start!==(i?shots[i-1].end:0)))issues.push('Live frame coverage is missing or discontinuous');
  if(new Set(shots?.map(s=>s.sequence)).size!==60)issues.push('The live edit must cover all 60 story beats');
  if(canonicalJSON(manifest.shots)!==canonicalJSON(props.shots)||manifest.durationInFrames!==frames)issues.push('Shot manifest differs from live render props');
  if(narrated.durationInFrames!==frames||narrated.shots?.length!==shots.length||!narrated.shots.every((s,i)=>['id','sequence','start','end','sourceStart','sourceEnd'].every(k=>s[k]===shots[i][k])))issues.push('Approved narration edit differs from render timing');
  const audio=path.join(out,'MASTER_With_Music.wav'),audioInfo=probe(audio,root),a=audioInfo.streams.find(s=>s.codec_type==='audio');
  if(!a||Number(a.sample_rate)!==48000||Number(a.channels)!==2||Math.abs(Number(audioInfo.format.duration)-frames/30)>.10)issues.push('Existing mixed soundtrack length/format differs from the live edit');
  return {ready:issues.length===0,missing,issues,frames,segments:shots.length,audio,audioSHA256:await hashFile(audio)};
 }catch(error){issues.push(error.message);return {ready:false,missing,issues};}
}

/** Copy picture packets and reuse the existing full soundtrack; never rewrite stems. */
export async function finishReview(root,frames,expectedAudioHash){
 const out=reviewFolder(root),visual=path.join(out,'EP02_540p_Visual.mp4'),audio=path.join(out,'MASTER_With_Music.wav');
 if(await hashFile(audio)!==expectedAudioHash)throw Error('Existing soundtrack changed during rendering; previous review movie retained');
 const final=path.join(out,'EP02_Updated_Full_Review_540p.mp4'),partial=final+'.partial.mp4';
 command('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-i',visual,'-i',audio,'-map','0:v:0','-map','1:a:0',
  '-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t',String(frames/30),'-movflags','+faststart',partial],{root});
 const measured=validateMovie(probe(partial,root),frames);
 if(await hashFile(audio)!==expectedAudioHash)throw Error('Soundtrack changed during final assembly; previous review retained');
 const packetHash=p=>command('ffmpeg',['-nostdin','-v','error','-i',p,'-map','0:v:0','-c:v','copy','-an','-f','hash','-hash','sha256','-'],{root,capture:true}).trim();
 if(packetHash(visual)!==packetHash(partial))throw Error('Picture packets changed while adding soundtrack');
 let backup=null;if(await exists(final)){backup=final.replace(/\.mp4$/,'.previous-'+Date.now()+'.mp4');await fs.rename(final,backup);}
 try{await fs.rename(partial,final);}catch(error){if(backup)await fs.rename(backup,final);throw error;}
 return {file:final,sha256:await hashFile(final),audioSource:audio,audioSHA256:expectedAudioHash,picturePacketsUnchanged:true,previousReview:backup,...measured};
}
