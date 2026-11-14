import * as fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {narratorFor,Series,Narrator,NARRATORS,TEST_SCRIPTS} from '../config';
import {Alignment,alignText,Pause,shiftTiming,validatePauses,Timing} from '../timing';
import {ElevenLabsClient,DEFAULT_PARAMETERS,GenerationParameters,Verification} from './client';
import {NarrationCache,cacheIdentity,sha256,atomicJSON} from './cache';
import {inspectAudio,insertPauses,masterAudio} from './audio';
import {NarrationError} from './errors';
export type NarrationMetadata={version:1;cacheKey:string;identity:unknown;series:Series;script:string;narrator:Narrator;parameters:GenerationParameters;duration:number;audioHash:string;timing:Timing;mastering:Awaited<ReturnType<typeof masterAudio>>;verification:Verification;createdAt:string;warnings:string[]};
export type GenerateRequest={series:Series;script:string;override?:Parameters<typeof narratorFor>[1];parameters?:GenerationParameters;pauses?:Pause[];targetLUFS?:number;regenerate?:boolean;paidApproved:boolean};
export async function generateNarration(req:GenerateRequest,dependencies:{cache:NarrationCache;client?:ElevenLabsClient}){
 const narrator=narratorFor(req.series,req.override),parameters=req.parameters??DEFAULT_PARAMETERS;
 if(typeof req.script!=='string'||!req.script.trim()||req.script.length>5000)throw new NarrationError('INVALID_SCRIPT','Script must contain 1–5000 characters.');
 const target=req.targetLUFS??-16;if(!Number.isFinite(target)||target< -24||target> -14)throw new NarrationError('INVALID_MASTER','Target must be -24 to -14 LUFS.');
 const chars=[...req.script];const zero={characters:chars,character_start_times_seconds:chars.map(()=>0),character_end_times_seconds:chars.map(()=>0)};validatePauses(req.pauses??[],alignText(zero,req.script,0));
 const identity={series:req.series,script:req.script,voiceId:narrator.voiceId,modelId:narrator.modelId,settings:narrator.settings,parameters,pauses:req.pauses??[],targetLUFS:target};
 const key=cacheIdentity(identity);
 if(!req.regenerate){const hit=await dependencies.cache.lookup<NarrationMetadata>(key);if(hit)return {...hit,cached:true};}
 if(!req.paidApproved)throw new NarrationError('PAID_APPROVAL_REQUIRED','No valid cache hit. Explicit user approval is required before paid synthesis.');
 const client=dependencies.client;if(!client)throw new NarrationError('MISSING_CREDENTIAL','A rotated, authenticated ElevenLabs client is required for new narration.');
 return dependencies.cache.lock(key,async()=>{
  if(!req.regenerate){const hit=await dependencies.cache.lookup<NarrationMetadata>(key);if(hit)return {...hit,cached:true};}
  const verification=await client.verify([narrator.voiceId]);for(const series of Object.keys(NARRATORS) as Series[])client.validate(narratorFor(series),TEST_SCRIPTS[series],verification,DEFAULT_PARAMETERS);
  client.validate(narrator,req.script,verification,parameters);
  const dir=await dependencies.cache.begin(key);const attempt=path.join(dir,'attempt-'+randomUUID());await fs.mkdir(attempt);
  const response=await client.synthesize(narrator,req.script,parameters,verification,true);
  // Retain only the audio and timing payload after the paid response; never credentials/HTTP headers.
  if(typeof response.audio_base64!=='string'||response.audio_base64.length<30||response.audio_base64.length>80_000_000||!/^[A-Za-z0-9+/]*={0,2}$/.test(response.audio_base64)||response.audio_base64.length%4!==0)throw new NarrationError('INVALID_AUDIO','Provider did not return valid base64 audio. No narration was delivered.');
  const raw=path.join(attempt,'provider.mp3');await fs.writeFile(raw,Buffer.from(response.audio_base64,'base64'),{mode:0o600});
  await atomicJSON(path.join(attempt,'provider-timestamps.json'),{alignment:response.alignment,normalized_alignment:response.normalized_alignment});
  const info=await inspectAudio(raw);let timing:Timing;const warnings:string[]=[];
  if(!response.alignment&&!response.normalized_alignment)throw new NarrationError('MISSING_TIMESTAMPS','Valid audio was retained, but the timestamps endpoint did not return alignment. No fabricated word timings were substituted.');
  try{timing=alignText(response.normalized_alignment??response.alignment!,req.script,info.duration);}
  catch{if(!response.alignment)throw new NarrationError('ALIGNMENT_MISMATCH','Provider timing does not match the full script; raw audio was retained.');timing=alignText(response.alignment,req.script,info.duration);warnings.push('Normalized alignment differed; validated original-character alignment was used.');}
  const pauses=validatePauses(req.pauses??[],timing),prepared=path.join(attempt,'prepared.wav');await insertPauses(raw,prepared,info.duration,pauses);
  const staged=path.join(attempt,'master.mp3'),mastering=await masterAudio(prepared,staged,req.targetLUFS??-16);
  timing=shiftTiming(timing,pauses);alignText(timing.characters,req.script,mastering.info.duration);
  const metadata:NarrationMetadata={version:1,cacheKey:key,identity,series:req.series,script:req.script,narrator,parameters,duration:mastering.info.duration,audioHash:sha256(await fs.readFile(staged)),timing,mastering,verification,createdAt:new Date().toISOString(),warnings};
  // Publish only a completely validated result. Preserve all earlier attempts for deliberate recovery.
  const audio=path.join(dir,'master.mp3');await fs.copyFile(staged,audio);await atomicJSON(path.join(dir,'metadata.json'),metadata);
  return {metadata,audio,cached:false};
 });
}
