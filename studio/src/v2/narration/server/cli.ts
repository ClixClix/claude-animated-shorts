import * as fs from 'node:fs/promises';
import path from 'node:path';
import {NARRATORS,PLAYBACK,SAWYER_FALLBACK,TEST_SCRIPTS,Series,narratorFor,NarrationConfigError} from '../config';
import {alignText,planTown} from '../timing';
import {planTownAudition} from '../townAudition';
import {ElevenLabsClient} from './client';
import {NarrationCache,atomicJSON,sha256} from './cache';
import {generateNarration,NarrationMetadata} from './generator';
import {processNarration} from './processing';
import {inspectAudio,masterAudio,measureLoudness,mixTracks,Mix} from './audio';
import {NarrationError} from './errors';
const args=process.argv.slice(2),command=args[0]??'status';
const has=(k:string)=>args.includes('--'+k),value=(k:string)=>{const at=args.indexOf('--'+k);return at>=0?args[at+1]:undefined;};
const output=path.resolve('out/v2-narration');
const client=()=>new ElevenLabsClient({apiKey:process.env.ELEVENLABS_API_KEY,rotationConfirmed:has('rotated-key-confirmed')});
const readJSON=async(file:string|undefined)=>{if(!file)throw new NarrationError('MISSING_ARGUMENT','Required JSON file path is missing.');return JSON.parse(await fs.readFile(file,'utf8'));};
const planFor=(m:NarrationMetadata)=>m.timing.sentences.length===3?planTownAudition(m.timing,m.duration).plan:planTown(m.timing,m.duration);
async function main(){
 await fs.mkdir(output,{recursive:true});
 if(command==='status'){console.log(JSON.stringify({credential:process.env.ELEVENLABS_API_KEY?'configured':'missing',rotation:'requires explicit --rotated-key-confirmed',narrators:NARRATORS,playback:PLAYBACK,sawyerFallback:SAWYER_FALLBACK,authenticatedRequestsMade:false},null,2));return;}
 if(command==='verify'){
  const c=client(),v=await c.verify();for(const series of Object.keys(NARRATORS) as Series[])c.validate(narratorFor(series),TEST_SCRIPTS[series],v,{outputFormat:'mp3_44100_128',applyTextNormalization:'auto'});
  await atomicJSON(path.join(output,'voice-verification.json'),v);console.log('Both exact voices and model settings verified. No synthesis request was made.');return;
 }
 if(command==='generate'){
  const series=value('series')??'';narratorFor(series);const script=value('script')?await fs.readFile(value('script')!,'utf8'):TEST_SCRIPTS[series as Series];
  const override=value('override')?await readJSON(value('override')):undefined;
  const customName=value('name');if(customName&&!/^[A-Za-z0-9_-]+$/.test(customName))throw new NarrationError('INVALID_NAME','Output name must contain letters, numbers, hyphens or underscores.');
  if((value('script')||override)&&!customName)throw new NarrationError('OUTPUT_NAME_REQUIRED','Use --name for custom episodes or overrides so the approved standalone samples are preserved.');
  // Cache reuse is allowed offline. A new client/key is only used on an explicitly paid-enabled attempt.
  const c=has('allow-paid')?client():undefined;
  const result=await generateNarration({series:series as Series,script,override,parameters:value('parameters')?await readJSON(value('parameters')):undefined,pauses:value('pauses')?await readJSON(value('pauses')):[],regenerate:has('regenerate'),paidApproved:has('allow-paid')},{cache:new NarrationCache(path.join(output,'cache')),client:c});
  const stem=customName??(series==='in_this_town'?'in-this-town-adam':'what-if-cats-daniel');
  // Provider/source cache identity remains unchanged. Offline presets have a separate cache.
  await fs.copyFile(result.audio,path.join(output,stem+'-original.mp3'));
  await atomicJSON(path.join(output,stem+'-original-timestamps.json'),result.metadata);
  const processed=await processNarration({audio:result.audio,metadata:result.metadata,playback:value('playback')?await readJSON(value('playback')):undefined},new NarrationCache(path.join(output,'processed-cache')));
  const file=path.join(output,stem+'.mp3');await fs.copyFile(processed.audio,file);
  await atomicJSON(path.join(output,stem+'-timestamps.json'),processed.metadata);
  console.log(JSON.stringify({audio:file,duration:processed.metadata.duration,sourceCached:result.cached,processedCached:processed.cached,voiceId:processed.metadata.narrator.voiceId,playback:processed.metadata.processing.playback,truePeakDBTP:processed.metadata.mastering.after.truePeakDBTP}));return;
 }
 if(command==='process'){
  // This entry point never constructs an API client, regardless of environment/CLI flags.
  const audio=value('input'),name=value('name'),metadata=await readJSON(value('metadata')) as NarrationMetadata;
  if(!audio||!name||!/^[A-Za-z0-9_-]+$/.test(name))throw new NarrationError('MISSING_ARGUMENT','Specify --input, original --metadata and a safe --name.');
  const fallback=value('fallback');if(fallback&&fallback!=='sawyer')throw new NarrationError('WRONG_NARRATOR','The only archival fallback is sawyer.');
  const expected=fallback?SAWYER_FALLBACK.narrator.voiceId:NARRATORS[metadata.series]?.voiceId;
  if(metadata.narrator.voiceId!==expected)throw new NarrationError('WRONG_NARRATOR','Original take does not match the selected narrator or explicit fallback.');
  const result=await processNarration({audio,metadata,playback:fallback?{...SAWYER_FALLBACK.playback,mode:'independent'}:value('playback')?await readJSON(value('playback')):undefined},new NarrationCache(path.join(output,'processed-cache')));
  const file=path.join(output,name+'.mp3');
  if(path.resolve(audio)===file)throw new NarrationError('ORIGINAL_REQUIRED','Choose a separate name to preserve the original recording.');
  await fs.copyFile(result.audio,file);await atomicJSON(path.join(output,name+'-timestamps.json'),result.metadata);
  console.log(JSON.stringify({audio:file,duration:result.metadata.duration,cached:result.cached,voiceId:result.metadata.narrator.voiceId,playback:result.metadata.processing.playback,truePeakDBTP:result.metadata.mastering.after.truePeakDBTP,providerRequests:0}));return;
 }
 if(command==='plan'){
  const metadata=await readJSON(value('metadata')) as NarrationMetadata;
  const plan=planFor(metadata);const warnings=plan.shots.filter(s=>(s.endFrame-s.startFrame)/(s.sourceEnd-s.sourceStart+1)>3).map(s=>`${s.name}: large expansion from the silent edit; review visual action/holds before approval.`);
  await atomicJSON(path.join(output,'narrated-plan.json'),{plan,warnings,requiresSampleApproval:true,requiresPacingApproval:true});console.log(JSON.stringify({duration:plan.durationInFrames/30,shots:plan.shots,warnings},null,2));return;
 }
 if(command==='prepare-preview'){
  if(!has('samples-approved')||!has('pacing-approved'))throw new NarrationError('REVIEW_REQUIRED','Approve both standalone narrator samples and review the measured shot plan before preparing the integrated preview.');
  const metadata=await readJSON(value('metadata')) as NarrationMetadata;
  if(metadata.series!=='in_this_town'||metadata.narrator.voiceId!==NARRATORS.in_this_town.voiceId)throw new NarrationError('WRONG_NARRATOR','The integrated preview requires the selected In This Town voice.');
  const audio=value('audio');if(!audio)throw new NarrationError('MISSING_AUDIO','Specify the generated mastered audio.');
  const info=await inspectAudio(audio),peak=await measureLoudness(audio);if(peak.truePeakDBTP> -1||Math.abs(info.duration-metadata.duration)>0.08||sha256(await fs.readFile(audio))!==metadata.audioHash)throw new NarrationError('INVALID_AUDIO','Preview audio fails identity, duration or true-peak verification.');
  const audition=metadata.timing.sentences.length===3?planTownAudition(metadata.timing,info.duration):null;
  const plan=audition?.plan??planTown(metadata.timing,info.duration);await fs.mkdir('public/v2-narration',{recursive:true});await fs.copyFile(audio,'public/v2-narration/in-this-town-adam.mp3');
  await atomicJSON(path.join(output,'preview-props.json'),{audioFile:'v2-narration/in-this-town-adam.mp3',plan,...(audition?{visualTiming:audition.visualTiming}:{}),samplesApproved:true,pacingApproved:true,measuredTruePeak:peak.truePeakDBTP});
  console.log('Prepared public audio and safe Remotion props. Render the separate InThisTownV2Narrated composition; original silent test is unchanged.');return;
 }
 if(command==='master'){
  const input=value('input'),out=value('output');if(!input||!out)throw new NarrationError('MISSING_ARGUMENT','Specify --input and --output.');console.log(JSON.stringify(await masterAudio(input,out),null,2));return;
 }
 if(command==='mix'){
  const mix=await readJSON(value('tracks')) as Mix,out=value('output');if(!out)throw new NarrationError('MISSING_ARGUMENT','Specify --tracks JSON and --output WAV.');await mixTracks(mix,out);console.log('Separate tracks mixed. Run master on the mix and verify the encoded video audio after rendering.');return;
 }
 throw new NarrationError('UNKNOWN_COMMAND','Use status, verify, generate, process, plan, prepare-preview, mix or master.');
}
main().catch(error=>{const e=error instanceof NarrationError?error:error instanceof NarrationConfigError?new NarrationError('INVALID_CONFIGURATION',error.message):new NarrationError('COMMAND_FAILED','Narration command failed. Check arguments and local files. Secret values and raw provider messages are withheld.');console.error(`${e.code}: ${e.message}`);process.exitCode=1;});
