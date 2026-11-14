import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {PlaybackSettings,playbackFor} from '../config';
import {alignText} from '../timing';
import type {NarrationMetadata} from './generator';
import {NarrationCache,atomicJSON,cacheIdentity,sha256} from './cache';
import {inspectAudio,masterAudio} from './audio';
import {NarrationError} from './errors';

const exec=promisify(execFile);
const options='formant=preserved:pitchq=consistency:window=long';
export const processingFilters=(p:PlaybackSettings,sampleRate=44100)=>p.mode==='varispeed'?{
 tempo:`asetrate=${Math.round(sampleRate*p.speed)},aresample=48000`,pitch:'anull',
}:({
 tempo:`rubberband=tempo=${p.speed}:pitch=1:${options}`,
 pitch:`rubberband=tempo=1:pitch=${2**(p.pitchSemitones/12)}:${options}`,
});
export type ProcessedMetadata=NarrationMetadata & {
 kind:'offline-processed';
 processing:{version:1;playback:PlaybackSettings;order:readonly string[];filters:ReturnType<typeof processingFilters>;ffmpeg:string;timingBasis:string};
 source:{cacheKey:string;audioHash:string;duration:number};
};

/** Never contacts a provider. Only accepts a verified, unmodified natural-speed source. */
export async function processNarration(req:{audio:string;metadata:NarrationMetadata;playback?:Partial<PlaybackSettings>},cache:NarrationCache){
 const source=req.metadata;
 if(!source||'kind' in source||'processing' in source||source.version!==1||source.narrator?.settings?.speed!==1)
  throw new NarrationError('ORIGINAL_REQUIRED','Process the original natural-speed recording and its original metadata, never a processed version.');
 const p=playbackFor(source.series,req.playback);
 const identitySource=source.identity as {voiceId?:string;settings?:{speed?:number}};
 if(cacheIdentity(source.identity)!==source.cacheKey||identitySource.voiceId!==source.narrator.voiceId||identitySource.settings?.speed!==1||sha256(await fs.readFile(req.audio))!==source.audioHash)
  throw new NarrationError('SOURCE_MISMATCH','Original recording and metadata failed source identity/hash verification.');
 const info=await inspectAudio(req.audio);
 if(Math.abs(info.duration-source.duration)>0.08)throw new NarrationError('SOURCE_MISMATCH','Original recording duration differs from metadata.');
 alignText(source.timing.characters,source.script,info.duration);
 const ffmpeg=(await exec('ffmpeg',['-version'])).stdout.split('\n')[0];
 const filters=processingFilters(p,info.sampleRate),order=p.mode==='varispeed'?['sample-rate speed-up (tempo and pitch linked)','constant-gain mastering']:['pitch-preserving tempo','independent duration-preserving pitch','constant-gain mastering'];
 const processing:ProcessedMetadata['processing']={version:1,playback:p,order,filters,ffmpeg,timingBasis:'Original provider character alignment divided by playback speed; not new forced alignment.'};
 const targetLUFS=p.mode==='varispeed'?Math.max(-24,Math.min(-14,source.mastering.after.integratedLUFS)):-16;
 const identity={kind:'offline-processed',sourceCacheKey:source.cacheKey,sourceAudioHash:source.audioHash,processing,targetLUFS};
 const key=cacheIdentity(identity);
 // Processed cache is a separate root from the provider/source cache.
 const hit=await cache.lookup<ProcessedMetadata>(key);if(hit)return {...hit,cached:true};
 return cache.lock(key,async()=>{
  const again=await cache.lookup<ProcessedMetadata>(key);if(again)return {...again,cached:true};
  const dir=await cache.begin(key),attempt=path.join(dir,'offline-'+randomUUID());await fs.mkdir(attempt);
  const staged=path.join(attempt,'master.mp3');let mastering: NarrationMetadata['mastering'];
  if(p.speed===1&&p.pitchSemitones===0){
   // Daniel's recovered identity preset preserves the cached recording byte-for-byte.
   await fs.copyFile(req.audio,staged);mastering=source.mastering;
  }else{
   const tempo=path.join(attempt,'tempo.wav'),pitched=path.join(attempt,'pitched.wav');
   const run=async(input:string,filter:string,out:string)=>{
    try{await exec('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-i',input,'-vn','-af',filter,'-ar','48000','-ac','1','-c:a','pcm_f32le',out],{maxBuffer:1024*1024});}
    catch{throw new NarrationError('PLAYBACK_PROCESSING_FAILED','Offline tempo/pitch processing failed; no provider call or automatic regeneration was attempted.');}
   };
   // Independent mode uses ordered tempo/pitch passes. Straight varispeed instead
   // raises pitch naturally with tempo, matching the approved 1.35× audition.
   // Float intermediates retain peaks without integer clipping.
   if(p.mode==='varispeed')await run(req.audio,filters.tempo,pitched);
   else{await run(req.audio,filters.tempo,tempo);await run(tempo,filters.pitch,pitched);}
   mastering=await masterAudio(pitched,staged,targetLUFS);
  }
  const finalInfo=await inspectAudio(staged);
  if(Math.abs(finalInfo.duration-info.duration/p.speed)>0.10)throw new NarrationError('PLAYBACK_DURATION','Offline audio duration does not match the independent tempo setting.');
  const timing=alignText({characters:[...source.timing.characters.characters],character_start_times_seconds:source.timing.characters.character_start_times_seconds.map(t=>t/p.speed),character_end_times_seconds:source.timing.characters.character_end_times_seconds.map(t=>t/p.speed)},source.script,finalInfo.duration);
  if(mastering.after.truePeakDBTP> -1)throw new NarrationError('TRUE_PEAK_FAILURE','Processed audio exceeds -1 dBTP.');
  const metadata:ProcessedMetadata={...source,kind:'offline-processed',cacheKey:key,identity,processing,source:{cacheKey:source.cacheKey,audioHash:source.audioHash,duration:source.duration},timing,duration:finalInfo.duration,audioHash:sha256(await fs.readFile(staged)),mastering,createdAt:new Date().toISOString(),warnings:[...source.warnings,processing.timingBasis]};
  // Detect any concurrent source change before publishing a derived file.
  if(sha256(await fs.readFile(req.audio))!==source.audioHash)throw new NarrationError('SOURCE_MISMATCH','Source changed during processing.');
  const audio=path.join(dir,'master.mp3');await fs.copyFile(staged,audio);await atomicJSON(path.join(dir,'metadata.json'),metadata);
  return {audio,metadata,cached:false};
 });
}
