// Offline splice of the three cached approved patches. No provider imports or requests.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {buildStoryRevision,sha256} from './lib/story-revision-plan.mjs';
const studio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(studio);
const dir='src/v2/episodes/door-at-1111-story-polish',json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const revision=await json(dir+'/revision.json'),metadata=await json(revision.sourceMetadata),script=await fs.readFile(dir+'/narration.txt','utf8');
const plan=buildStoryRevision({revision,metadata,source:await fs.readFile(revision.sourceScript,'utf8'),proposed:script,edit:await json('src/v2/episodes/door-at-1111-polish/edit.json'),storyboard:await json(dir+'/storyboard.json')});
const out=path.resolve(revision.candidateOutput);await fs.mkdir(path.join(out,'tools'),{recursive:true});
await build({stdin:{contents:"export {alignText} from './timing';export {inspectAudio,measureLoudness,masterAudio} from './server/audio';",resolveDir:path.resolve('src/v2/narration'),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:path.join(out,'tools/splice-audio.mjs')});
const {alignText,inspectAudio,measureLoudness,masterAudio}=await import(pathToFileURL(path.join(out,'tools/splice-audio.mjs')).href);
const decode=file=>execFileSync('ffmpeg',['-nostdin','-v','error','-i',file,'-ar','48000','-ac','1','-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
if(sha256(await fs.readFile(revision.sourceAudio))!==revision.sourceAudioSHA256)throw Error('Source audio identity changed.');
const original=decode(revision.sourceAudio),parts=[],mapping=[],alignment={characters:[],character_start_times_seconds:[],character_end_times_seconds:[]};
let targetSamples=0;
for(const item of plan.audioEdit){
 let raw,meta,sourceStart,sourceEnd,file;
 if(item.kind==='retain-cached'){
  file=revision.sourceAudio;meta=metadata;sourceStart=item.sourceStart;
  raw=original.subarray(Math.round(sourceStart*48000)*4,Math.min(original.length,Math.round(item.sourceEnd*48000)*4));sourceEnd=sourceStart+raw.length/4/48000;
 }else{
  file='out/v2-narration/story-polish/'+item.patchId+'/Adam_135x.mp3';meta=await json('out/v2-narration/story-polish/'+item.patchId+'/processed-timestamps.json');
  const patch=plan.patches.find(p=>p.id===item.patchId);
  if(sha256(await fs.readFile(file))!==meta.audioHash||meta.script!==patch.after||meta.narrator.voiceId!==revision.voiceId)throw Error('Wrong patch source or processing.');
  assert.deepEqual(meta.processing.playback,revision.playback,'Wrong patch playback preset.');
  raw=decode(file);sourceStart=0;sourceEnd=raw.length/4/48000;
 }
 const destinationStart=targetSamples/48000,duration=raw.length/4/48000;
 const a=meta.timing.characters;
 a.characters.forEach((c,i)=>{
  const s=a.character_start_times_seconds[i],e=a.character_end_times_seconds[i];
  if(e<=sourceStart||s>=sourceEnd)return;
  alignment.characters.push(c);alignment.character_start_times_seconds.push(destinationStart+Math.max(0,s-sourceStart));
  alignment.character_end_times_seconds.push(destinationStart+Math.min(duration,e-sourceStart));
 });
 mapping.push({...item,file,sourceStart,sourceEnd,targetStart:destinationStart,targetEnd:destinationStart+duration,pcmHash:sha256(raw)});
 parts.push(raw);targetSamples+=raw.length/4;
}
const pcm=Buffer.concat(parts),duration=targetSamples/48000,timing=alignText(alignment,script,duration);
const seams=[];let offset=0;
for(let i=0;i<parts.length;i++){
 if(i){const before=pcm.readFloatLE(offset-4),after=pcm.readFloatLE(offset);seams.push({seconds:offset/4/48000,step:Math.abs(before-after)});}
 offset+=parts[i].length;
}
if(seams.some(s=>s.step>.01))throw Error('Splice discontinuity requires offline review; no regeneration was attempted.');
const wav=path.join(out,'Narration_Story_Polish.wav'),mp3=path.join(out,'Narration_Story_Polish.mp3');
execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-f','f32le','-ar','48000','-ac','1','-i','pipe:0','-c:a','pcm_f32le',wav],{input:pcm,maxBuffer:1024*1024});
const loudness=await measureLoudness(wav);let safeMixGain=0;
if(loudness.truePeakDBTP<=-1.6){
 execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-i',wav,'-c:a','libmp3lame','-b:a','192k',mp3]);
}else{const mastering=await masterAudio(wav,mp3,Math.max(-24,Math.min(-14,loudness.integratedLUFS)));safeMixGain=mastering.gainDB;}
const info=await inspectAudio(mp3),encoded=await measureLoudness(mp3);
if(encoded.truePeakDBTP> -1)throw Error('Encoded MP3 exceeds the approved true peak. Preserve WAV and correct offline.');
// Verify all retained PCM samples survive unchanged in the assembled float WAV.
const roundTrip=decode(wav);if(!roundTrip.equals(pcm))throw Error('PCM assembly did not preserve source samples.');
const captions=timing.words.map((w,i)=>({text:w.text,start:Math.floor(w.start*30),end:Math.max(Math.floor(w.start*30)+1,Math.min(Math.ceil(w.end*30),Math.floor((timing.words[i+1]?.start??duration)*30)))}));
const result={kind:'editorial-composite',script,narrator:metadata.narrator,processing:{playback:revision.playback,patchesProcessedOnce:true,retainedTakeReprocessed:false},audioHash:sha256(await fs.readFile(mp3)),duration:info.duration,pcmDuration:duration,timing,mapping,safeMixGain,paidRequestsMadeByAssembly:0};
await fs.writeFile(path.join(out,'Narration_Story_Polish-timestamps.json'),JSON.stringify(result,null,2)+'\n');
await fs.writeFile(path.join(out,'ONE_WORD_CAPTION_TIMES.json'),JSON.stringify(captions,null,2)+'\n');
const qa={decoded:true,originalPreserved:true,retainedPCMVerified:true,fullScriptAligned:true,lastSpokenWord:timing.words.at(-1),seconds:info.duration,pcmDuration:duration,integratedLUFS:encoded.integratedLUFS,truePeakDBTP:encoded.truePeakDBTP,seams,safeMixGain,paidRequestsMade:0,listeningApproval:'Still requires listening review; numerical checks do not certify prosody or pronunciation.',visualIntegration:'Pending; the active old edit and captions are untouched.'};
await fs.writeFile(path.join(out,'AUDIO_QA.json'),JSON.stringify(qa,null,2)+'\n');console.log(JSON.stringify(qa,null,2));
