// Explicitly approved patch generation only. Never called by preview/render commands.
import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {buildStoryRevision,sha256} from './lib/story-revision-plan.mjs';
const dir='src/v2/episodes/door-at-1111-story-polish';
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
let receipt;
try{receipt=await json(dir+'/generation-receipt.json');}catch(e){if(e.code!=='ENOENT')throw e;}
if(receipt?.authorizationConsumed)throw Error('These three paid requests are already complete. Transfer/restore their cached audio; do not generate them again.');
const revision=await json(dir+'/revision.json');
const source=await fs.readFile(revision.sourceScript,'utf8'),metadata=await json(revision.sourceMetadata);
const plan=buildStoryRevision({revision,source,metadata,proposed:await fs.readFile(dir+'/narration.txt','utf8'),edit:await json('src/v2/episodes/door-at-1111-polish/edit.json'),storyboard:await json(dir+'/storyboard.json')});
const args=process.argv.slice(2),cap=Number(args[args.indexOf('--max-credits')+1]);
if(!args.includes('--allow-paid')||!args.includes('--rotated-key-confirmed')||cap!==646||plan.estimatedCredits!==646)throw Error('Explicit approval flags and the exact 646-credit plan are required.');
if(sha256(await fs.readFile(revision.sourceAudio))!==revision.sourceAudioSHA256)throw Error('Approved source audio changed.');
const out=path.resolve(revision.candidateOutput),cacheRoot=path.resolve('out/v2-narration/story-polish');
await fs.mkdir(path.join(out,'tools'),{recursive:true});await fs.mkdir(cacheRoot,{recursive:true});
await build({stdin:{contents:"export {generateNarration} from './generator';export {ElevenLabsClient} from './client';export {NarrationCache,atomicJSON} from './cache';export {processNarration} from './processing';",resolveDir:path.resolve('src/v2/narration/server'),loader:'ts'},outfile:path.join(out,'tools/patch-audio.mjs'),bundle:true,platform:'node',format:'esm',target:'node24'});
const {generateNarration,ElevenLabsClient,NarrationCache,atomicJSON,processNarration}=await import(pathToFileURL(path.join(out,'tools/patch-audio.mjs')).href);
const client=new ElevenLabsClient({apiKey:process.env.ELEVENLABS_API_KEY,rotationConfirmed:true});
async function subscription(){
 try{
  const r=await fetch('https://api.elevenlabs.io/v1/user/subscription',{headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY},signal:AbortSignal.timeout(30000),redirect:'error'});
  if(!r.ok)throw Error();const s=await r.json();return {characterCount:s.character_count,characterLimit:s.character_limit,tier:s.tier,status:s.status};
 }catch{throw Error('Non-billable account verification failed. No paid retry was attempted.');}
}
const before=await subscription(),verification=await client.verify([revision.voiceId]);
const model=verification.models.find(m=>m.model_id===revision.modelId);
if(!model?.can_do_text_to_speech||before.characterLimit-before.characterCount<cap)throw Error('Voice/model or remaining account budget is insufficient.');
const access=await json(path.join(out,'ACCESS_CHECK.json'));
const rates=access.model?.model_rates;
if(!access.authenticated||access.voice.voice_id!==revision.voiceId||access.model.model_id!==revision.modelId||Date.now()-Date.parse(access.checkedAt)>15*60000||!(rates?.character_cost_multiplier>0)||!(rates?.cost_discount_multiplier>0)||rates.character_cost_multiplier*rates.cost_discount_multiplier>1)throw Error('A fresh non-billable rate check within the approved budget is required.');
await atomicJSON(path.join(out,'NARRATION_PATCH_APPROVAL.json'),{authorization:'User replied yes to three one-time patch calls up to 646 credits, without automatic paid retries.',scriptHash:plan.revisedScriptSHA256,maximumCredits:cap,patches:plan.patches.map(p=>({id:p.id,scriptHash:p.scriptSHA256,characters:p.characters})),automaticRetries:false,fullRegeneration:false});
const synthesize=client.synthesize.bind(client);let current,postedCharacters=0;
client.synthesize=async(narrator,script,...rest)=>{
 const p=current;
 if(!p||sha256(script)!==p.scriptSHA256||narrator.voiceId!==revision.voiceId||postedCharacters+[...script].length>cap)throw Error('Request differs from the approved patch budget.');
 const journal=path.join(cacheRoot,p.id,'ATTEMPT.json');
 // Exclusive durable marker: an interrupted/failed POST can never be issued again automatically.
 const handle=await fs.open(journal,'wx',0o600);
 await handle.writeFile(JSON.stringify({id:p.id,status:'paid-request-started',scriptHash:p.scriptSHA256,characters:p.characters,createdAt:new Date().toISOString(),automaticRetries:false}));await handle.sync();await handle.close();
 postedCharacters+=p.characters;
 const response=await synthesize(narrator,script,...rest);
 const patchDir=path.dirname(journal);
 if(typeof response.audio_base64==='string')await fs.writeFile(path.join(patchDir,'provider.mp3'),Buffer.from(response.audio_base64,'base64'),{mode:0o600});
 await atomicJSON(path.join(patchDir,'provider-alignment.json'),{alignment:response.alignment,normalized_alignment:response.normalized_alignment});
 await atomicJSON(journal,{id:p.id,status:'response-retained',scriptHash:p.scriptSHA256,characters:p.characters,automaticRetries:false});
 return response;
};
const results=[];
try{
 for(const p of plan.patches){
  current=p;const dest=path.join(cacheRoot,p.id);await fs.mkdir(dest,{recursive:true});
  const original=await generateNarration({series:revision.series,script:p.after,parameters:metadata.parameters,targetLUFS:Math.max(-24,Math.min(-14,metadata.mastering.after.integratedLUFS)),paidApproved:true},{cache:new NarrationCache(path.join(cacheRoot,'original-cache')),client});
  await fs.copyFile(original.audio,path.join(dest,'original.mp3'));await atomicJSON(path.join(dest,'original-timestamps.json'),original.metadata);
  const processed=await processNarration({audio:original.audio,metadata:original.metadata,playback:revision.playback},new NarrationCache(path.join(cacheRoot,'processed-cache')));
  await fs.copyFile(processed.audio,path.join(dest,'Adam_135x.mp3'));await atomicJSON(path.join(dest,'processed-timestamps.json'),processed.metadata);
  const result={id:p.id,status:'complete',characters:p.characters,cached:original.cached,voiceId:revision.voiceId,sourceCacheKey:original.metadata.cacheKey,processedCacheKey:processed.metadata.cacheKey,duration:processed.metadata.duration,audioHash:processed.metadata.audioHash,truePeakDBTP:processed.metadata.mastering.after.truePeakDBTP};
  await atomicJSON(path.join(dest,'ATTEMPT.json'),{...result,scriptHash:p.scriptSHA256,automaticRetries:false});results.push(result);
  console.log(JSON.stringify(result));
 }
 const after=await subscription();
 await atomicJSON(path.join(out,'NARRATION_PATCH_USAGE.json'),{before,after,observedAccountCreditDelta:after.characterCount-before.characterCount,authorizedMaximumCredits:cap,postedCharactersThisRun:postedCharacters,patches:results,automaticRetries:false,fullRegeneration:false});
 console.log(JSON.stringify({complete:true,postedCharactersThisRun:postedCharacters,observedAccountCreditDelta:after.characterCount-before.characterCount}));
}catch(error){
 await atomicJSON(path.join(out,'NARRATION_PATCH_STOP.json'),{stoppedAtPatch:current?.id,completed:results,postedCharactersThisRun:postedCharacters,errorCode:typeof error?.code==='string'?error.code:'PATCH_STOPPED',message:'Stopped without any paid retry. Inspect durable patch attempt markers and retained responses before recovery.'});
 console.error('PATCH_STOPPED: No paid retry was made. Retained responses and attempt markers are in out/v2-narration/story-polish/.');process.exitCode=1;
}
