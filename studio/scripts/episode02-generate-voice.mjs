import './lib/runtime.mjs';
/**
 * Explicitly approved ONE-TIME Episode 02 narrator synthesis.
 * NEVER called by produce-box.mjs build/check and NEVER run automatically.
 * No request will occur without the three matching flags and key.
 *
 * Example, only AFTER user authorizes provider cost:
 * node scripts/episode02-generate-voice.mjs --allow-paid --rotated-key-confirmed --approve-characters N
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const out=path.resolve('out/v2-episodes/in-this-town-02');
const narration=(await fs.readFile('src/v2/episodes/in-this-town-02/DRAFT_BOX_NARRATION.txt','utf8')).trim();
const chars=[...narration].length;
const at=process.argv.indexOf('--approve-characters');
const allowed=at>=0?Number(process.argv[at+1]):NaN;
if(!process.argv.includes('--allow-paid')||!process.argv.includes('--rotated-key-confirmed')||allowed!==chars)
 throw new Error('Paid voice generation is disabled. Requires --allow-paid --rotated-key-confirmed --approve-characters '+chars+' after explicit provider-cost authorization. This will request a billed ElevenLabs generation; credits can differ from characters.');
if(!process.env.ELEVENLABS_API_KEY)throw Error('ELEVENLABS_API_KEY is not set.');
await fs.mkdir(out,{recursive:true});
const receipt=path.join(out,'EP02_PAID_VOICE_ATTEMPT.json');
const final=path.join(out,'Approved_Narration.wav');
if(await fs.access(receipt).then(()=>true,()=>false))throw Error('A paid attempt was already started. Manually inspect existing provider/cache and receipt; no paid retry permitted.');
if(await fs.access(final).then(()=>true,()=>false))throw Error('Approved voice exists. Do not overwrite.');
await build({stdin:{contents:[
 "export {generateNarration} from './generator';",
 "export {ElevenLabsClient} from './client';",
 "export {NarrationCache} from './cache';",
 "export {processNarration} from './processing';"
].join('\n'),resolveDir:path.resolve('src/v2/narration/server'),loader:'ts'},
 outfile:path.join(out,'ep02-voice-tools.mjs'),bundle:true,platform:'node',format:'esm',target:'node24'});
const {generateNarration,ElevenLabsClient,NarrationCache,processNarration}=await import(pathToFileURL(path.join(out,'ep02-voice-tools.mjs')).href);
const client=new ElevenLabsClient({apiKey:process.env.ELEVENLABS_API_KEY,rotationConfirmed:true});
const hash=createHash('sha256').update(narration).digest('hex');
const h=await fs.open(receipt,'wx',0o600);
await h.writeFile(JSON.stringify({status:'billed-attempt-authorized-started',scriptSHA256:hash,
 characters:chars,model:'eleven_multilingual_v2',series:'in_this_town',
 voice:'Adam',automaticRetries:false,at:new Date().toISOString()},null,2));
await h.sync();await h.close();
try{
 const source=await generateNarration({series:'in_this_town',script:narration,paidApproved:true},
 {cache:new NarrationCache('out/v2-narration/cache'),client});
 const processed=await processNarration({audio:source.audio,metadata:source.metadata},
  new NarrationCache('out/v2-narration/processed-cache'));
 const wordPath=path.join(out,'Approved_Word_Timings.json');
 const words=processed.metadata.timing.words.map(w=>({text:w.text,start:w.start,end:w.end}));
 execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-i',processed.audio,
  '-ar','48000','-ac','2','-c:a','pcm_f32le',final]);
 await fs.writeFile(wordPath,JSON.stringify(words,null,2)+'\n');
 await fs.writeFile(path.join(out,'EP02_VOICE_PROVENANCE.json'),
  JSON.stringify({sourceCached:source.cached,processedCached:processed.cached,
   voiceId:processed.metadata.narrator.voiceId,modelId:processed.metadata.narrator.modelId,
   scriptSHA256:hash,characters:chars,audio:final,wordTimings:wordPath,
   duration:processed.metadata.duration,pitchAndTempo:processed.metadata.processing.playback,
   providerCallsThisExecution:source.cached?0:1},null,2)+'\n');
 await fs.writeFile(receipt,JSON.stringify({status:'completed',scriptSHA256:hash,characters:chars,
   completedAt:new Date().toISOString(),automaticRetries:false},null,2)+'\n');
 console.log('Episode 02 approved narrator source saved locally. Run produce-box.mjs build to assemble; checks remain a separate stage.');
}catch(e){
 console.error('Paid attempt may have been charged. No automatic retry. Check provider and existing cache before any new request.');
 throw e;
}
