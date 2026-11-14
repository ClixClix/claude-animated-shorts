import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {NarrationError} from './errors';
const exec=promisify(execFile);
async function ff(args:string[]){try{return await exec('ffmpeg',['-nostdin','-hide_banner',...args],{maxBuffer:8*1024*1024});}catch{throw new NarrationError('AUDIO_PROCESSING_FAILED','FFmpeg failed to decode or process the audio. No successful audio result was recorded.');}}
export async function inspectAudio(file:string){
 try{
  const {stdout}=await exec('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{maxBuffer:1024*1024});const p=JSON.parse(stdout);const a=p.streams?.find((s:{codec_type:string})=>s.codec_type==='audio');const duration=Number(p.format?.duration??a?.duration);
  if(!a||!Number.isFinite(duration)||duration<=0.05||duration>3600||!Number.isFinite(Number(a.sample_rate)))throw new Error();
  await ff(['-v','error','-xerror','-i',file,'-f','null','-']);
  return {duration,sampleRate:Number(a.sample_rate),channels:Number(a.channels),codec:String(a.codec_name)};
 }catch{throw new NarrationError('INVALID_AUDIO','The audio file is missing, corrupt, truncated, silent-length, or undecodable.');}
}
export type Loudness={integratedLUFS:number;truePeakDBTP:number;rangeLU:number};
export async function measureLoudness(file:string):Promise<Loudness>{
 const {stderr}=await ff(['-i',file,'-af','loudnorm=I=-16:TP=-1:LRA=20:print_format=json','-f','null','-']);
 const match=stderr.match(/\{\s*"input_i"[\s\S]*?\}/);if(!match)throw new NarrationError('LOUDNESS_FAILED','FFmpeg did not produce loudness measurements.');
 const p=JSON.parse(match[0]);const r={integratedLUFS:Number(p.input_i),truePeakDBTP:Number(p.input_tp),rangeLU:Number(p.input_lra)};
 if(Object.values(r).some(v=>!Number.isFinite(v)))throw new NarrationError('SILENT_AUDIO','Audio has no measurable non-silent loudness.');return r;
}
/** Constant gain preserves dynamics. Peak headroom takes precedence over hitting a LUFS target. */
export async function masterAudio(input:string,output:string,targetLUFS=-16){
 if(!Number.isFinite(targetLUFS)||targetLUFS< -24||targetLUFS> -14)throw new NarrationError('INVALID_MASTER','Narration target must be between -24 and -14 LUFS.');
 await inspectAudio(input);const before=await measureLoudness(input);let gainDB=Math.min(targetLUFS-before.integratedLUFS,-1.6-before.truePeakDBTP);
 for(let attempt=0;attempt<4;attempt++){
  await ff(['-y','-i',input,'-vn','-af',`volume=${gainDB.toFixed(6)}dB`,'-ar','44100','-ac','1','-codec:a','libmp3lame','-b:a','128k',output]);
  const info=await inspectAudio(output),after=await measureLoudness(output);
  if(after.truePeakDBTP<=-1)return {info,before,after,gainDB,targetLUFS,ceilingDBTP:-1,dynamics:'constant-gain; no compressor or time stretch'};
  gainDB-=after.truePeakDBTP+1+0.25;
 }
 throw new NarrationError('TRUE_PEAK_FAILURE','Encoded MP3 could not satisfy the -1 dBTP ceiling. Output is not approved.');
}
export async function insertPauses(input:string,output:string,duration:number,pauses:{at:number;seconds:number}[]){
 if(!Number.isFinite(duration)||duration<=0||pauses.some((p,i)=>!Number.isFinite(p.at)||!Number.isFinite(p.seconds)||p.at<0||p.at>duration||p.seconds<=0||p.seconds>5||i>0&&p.at<=pauses[i-1].at))throw new NarrationError('INVALID_PAUSES','Invalid pause positions or durations.');
 if(!pauses.length){await ff(['-y','-i',input,'-vn','-ar','48000','-ac','1','-c:a','pcm_f32le',output]);return;}
 const parts:string[]=[],labels:string[]=[];let from=0;
 for(let i=0;i<=pauses.length;i++){
  const to=i<pauses.length?pauses[i].at:duration;
  if(to>from+0.00001){parts.push(`[0:a]atrim=start=${from}:end=${to},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=mono[a${i}]`);labels.push(`[a${i}]`);}
  if(i<pauses.length){parts.push(`anullsrc=r=48000:cl=mono,atrim=duration=${pauses[i].seconds}[p${i}]`);labels.push(`[p${i}]`);from=to;}
 }
 parts.push(`${labels.join('')}concat=n=${labels.length}:v=0:a=1[out]`);
 await ff(['-y','-i',input,'-filter_complex',parts.join(';'),'-map','[out]','-c:a','pcm_f32le',output]);
}
export type MixTrack={file:string;gainDB?:number;duck?:boolean};
export type Mix={narration:string;vocalizations?:MixTrack;sfx?:MixTrack;music?:MixTrack};
export async function mixTracks(tracks:Mix,output:string,ducking={threshold:0.03,ratio:8,attack:25,release:300}){
 if(ducking.threshold<=0||ducking.threshold>1||ducking.ratio<1||ducking.ratio>20||ducking.attack<0.01||ducking.release<0.01||Object.values(ducking).some(v=>!Number.isFinite(v)))throw new NarrationError('INVALID_DUCKING','Invalid ducking parameters.');
 if(typeof tracks.narration!=='string'||!tracks.narration)throw new NarrationError('INVALID_TRACK','Narration input is required.');
 const others=[tracks.vocalizations,tracks.sfx,tracks.music].filter((t):t is MixTrack=>!!t);
 if(others.some(t=>typeof t.file!=='string'||!t.file||t.duck!==undefined&&typeof t.duck!=='boolean'))throw new NarrationError('INVALID_TRACK','Invalid secondary track.');
 const args=['-y','-i',tracks.narration];others.forEach(t=>args.push('-i',t.file));
 const parts=['[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[n]'];
 if(others.length)parts.push(`[n]asplit=${others.length+1}[voice]${others.map((_,i)=>`[key${i}]`).join('')}`);
 const labels=[others.length?'[voice]':'[n]'];
 others.forEach((t,i)=>{const gain=t.gainDB??0;if(!Number.isFinite(gain)||gain< -60||gain>12)throw new NarrationError('INVALID_GAIN','Track gain must be -60 to +12 dB.');
  parts.push(`[${i+1}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${gain}dB[t${i}]`);
  if(t.duck!==false){parts.push(`[t${i}][key${i}]sidechaincompress=threshold=${ducking.threshold}:ratio=${ducking.ratio}:attack=${ducking.attack}:release=${ducking.release}[d${i}]`);labels.push(`[d${i}]`);}
  else {parts.push(`[key${i}]anullsink`);labels.push(`[t${i}]`);}
 });
 parts.push(`${labels.join('')}amix=inputs=${labels.length}:duration=longest:normalize=0[out]`);
 await ff([...args,'-filter_complex',parts.join(';'),'-map','[out]','-c:a','pcm_f32le',output]);return inspectAudio(output);
}

/** Recheck AAC in the final container; copy video bit-for-bit while applying only necessary attenuation. */
export async function finalizeVideoAudio(input:string,output:string){
 await inspectAudio(input);const before=await measureLoudness(input);let gain=Math.min(0,-1.6-before.truePeakDBTP);
 for(let pass=0;pass<4;pass++){
  await ff(['-y','-i',input,'-map','0:v:0','-map','0:a:0','-c:v','copy','-af',`volume=${gain.toFixed(6)}dB`,'-c:a','aac','-b:a','192k','-movflags','+faststart',output]);
  const after=await measureLoudness(output);if(after.truePeakDBTP<=-1)return {before,after,gainDB:gain,ceilingDBTP:-1};gain-=after.truePeakDBTP+1+0.25;
 }
 throw new NarrationError('TRUE_PEAK_FAILURE','Final encoded video audio exceeds the -1 dBTP ceiling.');
}
