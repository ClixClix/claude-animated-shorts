import * as fs from 'node:fs/promises';
import path from 'node:path';
import {NARRATORS,TEST_SCRIPTS,Series,narratorFor,NarrationConfigError} from '../config';
import {alignText,planTown} from '../timing';
import {ElevenLabsClient} from './client';
import {NarrationCache,atomicJSON} from './cache';
import {generateNarration,NarrationMetadata} from './generator';
import {inspectAudio,masterAudio,measureLoudness,mixTracks,Mix} from './audio';
import {NarrationError} from './errors';
const args=process.argv.slice(2),command=args[0]??'status';
const has=(k:string)=>args.includes('--'+k),value=(k:string)=>{const at=args.indexOf('--'+k);return at>=0?args[at+1]:undefined;};
const output=path.resolve('out/v2-narration');
const client=()=>new ElevenLabsClient({apiKey:process.env.ELEVENLABS_API_KEY,rotationConfirmed:has('rotated-key-confirmed')});
const readJSON=async(file:string|undefined)=>{if(!file)throw new NarrationError('MISSING_ARGUMENT','Required JSON file path is missing.');return JSON.parse(await fs.readFile(file,'utf8'));};
async function main(){
 await fs.mkdir(output,{recursive:true});
 if(command==='status'){console.log(JSON.stringify({credential:process.env.ELEVENLABS_API_KEY?'configured':'missing',rotation:'requires explicit --rotated-key-confirmed',narrators:NARRATORS,authenticatedRequestsMade:false},null,2));return;}
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
  const stem=customName??(series==='in_this_town'?'in-this-town-sawyer':'what-if-cats-daniel');
  const file=path.join(output,stem+'.mp3');await fs.copyFile(result.audio,file);
  await atomicJSON(path.join(output,customName?customName+'-timestamps.json':series==='in_this_town'?'in-this-town-timestamps.json':'what-if-cats-timestamps.json'),result.metadata);
  console.log(JSON.stringify({audio:file,duration:result.metadata.duration,cached:result.cached,voiceId:result.metadata.narrator.voiceId,truePeakDBTP:result.metadata.mastering.after.truePeakDBTP}));return;
 }
 if(command==='plan'){
  const metadata=await readJSON(value('metadata')) as NarrationMetadata;
  const plan=planTown(metadata.timing,metadata.duration);const warnings=plan.shots.filter(s=>(s.endFrame-s.startFrame)/(s.sourceEnd-s.sourceStart+1)>3).map(s=>`${s.name}: large expansion from the silent edit; review visual action/holds before approval.`);
  await atomicJSON(path.join(output,'narrated-plan.json'),{plan,warnings,requiresSampleApproval:true,requiresPacingApproval:true});console.log(JSON.stringify({duration:plan.durationInFrames/30,shots:plan.shots,warnings},null,2));return;
 }
 if(command==='prepare-preview'){
  if(!has('samples-approved')||!has('pacing-approved'))throw new NarrationError('REVIEW_REQUIRED','Approve both standalone narrator samples and review the measured shot plan before preparing the integrated preview.');
  const metadata=await readJSON(value('metadata')) as NarrationMetadata;
  if(metadata.series!=='in_this_town'||metadata.narrator.voiceId!==NARRATORS.in_this_town.voiceId)throw new NarrationError('WRONG_NARRATOR','The integrated preview requires the approved Sawyer voice.');
  const audio=value('audio');if(!audio)throw new NarrationError('MISSING_AUDIO','Specify the generated mastered audio.');
  const info=await inspectAudio(audio),peak=await measureLoudness(audio);if(peak.truePeakDBTP> -1||Math.abs(info.duration-metadata.duration)>0.08)throw new NarrationError('INVALID_AUDIO','Preview audio fails duration or true-peak verification.');
  const plan=planTown(metadata.timing,info.duration);await fs.mkdir('public/v2-narration',{recursive:true});await fs.copyFile(audio,'public/v2-narration/in-this-town-sawyer.mp3');
  await atomicJSON(path.join(output,'preview-props.json'),{audioFile:'v2-narration/in-this-town-sawyer.mp3',plan,samplesApproved:true,pacingApproved:true,measuredTruePeak:peak.truePeakDBTP});
  console.log('Prepared public audio and safe Remotion props. Render the separate InThisTownV2Narrated composition; original silent test is unchanged.');return;
 }
 if(command==='master'){
  const input=value('input'),out=value('output');if(!input||!out)throw new NarrationError('MISSING_ARGUMENT','Specify --input and --output.');console.log(JSON.stringify(await masterAudio(input,out),null,2));return;
 }
 if(command==='mix'){
  const mix=await readJSON(value('tracks')) as Mix,out=value('output');if(!out)throw new NarrationError('MISSING_ARGUMENT','Specify --tracks JSON and --output WAV.');await mixTracks(mix,out);console.log('Separate tracks mixed. Run master on the mix and verify the encoded video audio after rendering.');return;
 }
 throw new NarrationError('UNKNOWN_COMMAND','Use status, verify, generate, plan, prepare-preview, mix or master.');
}
main().catch(error=>{const e=error instanceof NarrationError?error:error instanceof NarrationConfigError?new NarrationError('INVALID_CONFIGURATION',error.message):new NarrationError('COMMAND_FAILED','Narration command failed. Check arguments and local files. Secret values and raw provider messages are withheld.');console.error(`${e.code}: ${e.message}`);process.exitCode=1;});
