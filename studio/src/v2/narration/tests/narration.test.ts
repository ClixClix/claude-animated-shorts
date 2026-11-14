import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {NARRATORS,narratorFor,TEST_SCRIPTS} from '../config';
import {alignText,planTown,secondsToFrame,shiftTiming,validatePauses,visualFrameAt,Alignment} from '../timing';
import {ElevenLabsClient,DEFAULT_PARAMETERS,Model} from '../server/client';
import {NarrationCache,cacheIdentity,sha256,atomicJSON} from '../server/cache';
import {generateNarration} from '../server/generator';
import {inspectAudio,insertPauses,masterAudio,measureLoudness,mixTracks} from '../server/audio';
import {providerError} from '../server/errors';
const models:Model[]=[{model_id:'eleven_multilingual_v2',can_do_text_to_speech:true,can_use_style:true,can_use_speaker_boost:true}];
const alignment=(script:string,step=0.015):Alignment=>({characters:[...script],character_start_times_seconds:[...script].map((_,i)=>i*step),character_end_times_seconds:[...script].map((_,i)=>(i+1)*step)});
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
function fake(audio?:Buffer,script='Hello, café. Warm now.'){
 const calls:{url:string;method:string;body:unknown}[]=[];
 const fetcher:typeof fetch=async(input,init)=>{
  const url=String(input);calls.push({url,method:init?.method??'GET',body:init?.body?JSON.parse(String(init.body)):null});
  if(url.endsWith('/models'))return response(models);
  if(url.includes('/voices/')){const voice_id=url.split('/').pop();return response({voice_id,name:voice_id===NARRATORS.in_this_town.voiceId?'Sawyer':'Darian'});}
  return response({audio_base64:audio?.toString('base64'),alignment:alignment(script,0.04)});
 };
 return {client:new ElevenLabsClient({apiKey:'unit-test-secret-not-real',rotationConfirmed:true,fetcher}),calls};
}
let root:string,fixture:string,fixtureBytes:Buffer;
test.before(async()=>{
 root=await fs.mkdtemp(path.join(tmpdir(),'v2-narration-tests-'));fixture=path.join(root,'fixture.mp3');
 execFileSync('ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','sine=frequency=880:duration=3','-c:a','libmp3lame','-b:a','128k',fixture]);fixtureBytes=await fs.readFile(fixture);
});
test.after(async()=>{await fs.rm(root,{recursive:true,force:true});});
test('series select exact permanent voices; overrides leave defaults intact',()=>{
 assert.equal(narratorFor('in_this_town').voiceId,'8dEUmyPMdDdK91vboYih');assert.equal(narratorFor('what_if_cats').voiceId,'gOupLcAkjEnguROwi4oS');
 assert.equal(narratorFor('in_this_town',{settings:{stability:0.8}}).settings.stability,0.8);assert.equal(NARRATORS.in_this_town.settings.stability,0.6);
 assert.throws(()=>narratorFor('unknown'));assert.throws(()=>narratorFor('in_this_town',{settings:{speed:1.2}}));assert.throws(()=>narratorFor('what_if_cats',{settings:{style:NaN}}));
});
test('missing/old credentials fail before transport; raw provider secrets never enter error text',()=>{
 assert.throws(()=>new ElevenLabsClient({rotationConfirmed:true}),/missing/);assert.throws(()=>new ElevenLabsClient({apiKey:'not-real',rotationConfirmed:false}),/rotated/);
 const e=providerError(401,{detail:{status:'invalid_api_key',message:'unit-test-secret-not-real'}},null);assert.equal(e.code,'INVALID_CREDENTIAL');assert.ok(!e.message.includes('unit-test-secret'));
 assert.equal(providerError(401,{detail:{status:'quota_exceeded'}},null).code,'INSUFFICIENT_CREDITS');
 assert.equal(providerError(429,{},'12').retryAfterSeconds,12);assert.equal(providerError(402,{},null).code,'INSUFFICIENT_CREDITS');assert.equal(providerError(404,{},null).code,'VOICE_UNAVAILABLE');assert.equal(providerError(403,{},null).code,'ACCESS_DENIED');assert.equal(providerError(500,{},null).code,'PROVIDER_FAILURE');
});
test('verification checks both exact IDs and generation uses timestamps API at 1x',async()=>{
 const f=fake(fixtureBytes);const v=await f.client.verify();assert.equal(v.voices.length,2);
 await assert.rejects(f.client.synthesize(narratorFor('in_this_town'),'Hello.',DEFAULT_PARAMETERS,v,false),/authorization/);
 await f.client.synthesize(narratorFor('in_this_town'),'Hello.',DEFAULT_PARAMETERS,v,true);
 const post=f.calls.find(c=>c.method==='POST')!;assert.ok(post.url.includes('/8dEUmyPMdDdK91vboYih/with-timestamps?output_format=mp3_44100_128'));assert.equal((post.body as {voice_settings:{speed:number}}).voice_settings.speed,1);
});
test('unavailable voices/models/settings and unsupported markup fail without paid requests',async()=>{
 const f=fake(),v=await f.client.verify(),n=narratorFor('in_this_town');
 assert.throws(()=>f.client.validate({...n,modelId:'unknown'},'Hello.',v,DEFAULT_PARAMETERS));
 assert.throws(()=>f.client.validate(n,'<speak>Hello</speak>',v,DEFAULT_PARAMETERS));
 assert.throws(()=>f.client.validate(n,'Hello.',{...v,models:[{...models[0],can_use_style:false}]},DEFAULT_PARAMETERS));
 const bad=new ElevenLabsClient({apiKey:'not-real',rotationConfirmed:true,fetcher:async()=>response({detail:{message:'never-log-this'}},404)});await assert.rejects(bad.verify(),/unavailable/);assert.ok(!f.calls.some(c=>c.method==='POST'));
});
test('full-script Unicode words/sentences, ellipsis, monotonic bounds, pauses and frames',()=>{
 const script=TEST_SCRIPTS.in_this_town,t=alignText(alignment(script),script,4);
 assert.equal(t.sentences.length,5);assert.ok(t.words.some(w=>w.text==='café'));assert.ok(t.words.some(w=>w.text==="didn't"));
 const comedy=TEST_SCRIPTS.what_if_cats;assert.equal(alignText(alignment(comedy),comedy,4).sentences.length,2);
 const pauses=validatePauses([{afterSentence:1,seconds:0.4}],t),shifted=shiftTiming(t,pauses);assert.equal(shifted.sentences[1].end,t.sentences[1].end);assert.equal(shifted.sentences[2].start,t.sentences[2].start+0.4);
 const plan=planTown(shifted,4.4);assert.equal(plan.shots.length,4);assert.equal(plan.durationInFrames,152);assert.equal(secondsToFrame(1.5),45);assert.equal(visualFrameAt(0,plan),0);assert.equal(visualFrameAt(plan.durationInFrames-1,plan),239);
 assert.throws(()=>alignText(alignment('Wrong.'),script,4));assert.throws(()=>alignText({...alignment(script),character_end_times_seconds:[1]},script,4));
 assert.throws(()=>alignText(alignment(script),script,0.1));assert.throws(()=>validatePauses([{afterSentence:99,seconds:1}],t));assert.throws(()=>secondsToFrame(-1));
});
test('cache includes voice/model/text/settings/parameters and is ordering-stable',()=>{
 const x={script:'Hello',voiceId:'a',model:'v2',settings:{speed:1,style:0.1},parameters:{format:'mp3'}};
 assert.equal(cacheIdentity(x),cacheIdentity({parameters:x.parameters,settings:{style:0.1,speed:1},model:'v2',voiceId:'a',script:'Hello'}));
 for(const change of [{script:'hello'},{voiceId:'b'},{model:'v3'},{settings:{speed:1,style:0.2}},{parameters:{format:'wav'}}])assert.notEqual(cacheIdentity(x),cacheIdentity({...x,...change}));
});
test('real FFmpeg decoding, measured encoded mastering and inserted pause duration',async()=>{
 const before=await inspectAudio(fixture);assert.ok(Math.abs(before.duration-3)<0.1);
 const out=path.join(root,'master.mp3'),m=await masterAudio(fixture,out);assert.ok(m.after.truePeakDBTP<=-1);assert.ok(Number.isFinite(m.after.integratedLUFS));
 const paused=path.join(root,'pause.wav');await insertPauses(fixture,paused,3,[{at:1,seconds:0.4}]);assert.ok(Math.abs((await inspectAudio(paused)).duration-3.4)<0.02);
 const corrupt=path.join(root,'corrupt.mp3');await fs.writeFile(corrupt,'not audio');await assert.rejects(inspectAudio(corrupt),/undecodable/);
});
test('generator validates returned audio, caches exact narration offline and requires deliberate corruption recovery',async()=>{
 const f=fake(fixtureBytes),cache=new NarrationCache(path.join(root,'cache'));
 const req={series:'in_this_town' as const,script:'Hello, café. Warm now.',paidApproved:true};
 const first=await generateNarration(req,{cache,client:f.client});assert.equal(first.cached,false);assert.ok(first.metadata.duration>0);assert.ok(first.metadata.timing.words.length>0);
 const again=await generateNarration({...req,paidApproved:false},{cache});assert.equal(again.cached,true);assert.equal(f.calls.filter(c=>c.method==='POST').length,1);
 await fs.writeFile(again.audio,'corrupt');await assert.rejects(generateNarration({...req,paidApproved:false},{cache}),/corrupt/);assert.equal(f.calls.filter(c=>c.method==='POST').length,1);
 await assert.rejects(generateNarration({...req,regenerate:true,paidApproved:false},{cache,client:f.client}),/approval/);
 const deliberate=await generateNarration({...req,regenerate:true},{cache,client:f.client});assert.equal(deliberate.cached,false);assert.equal(f.calls.filter(c=>c.method==='POST').length,2);
});
test('cache lock prevents concurrent duplicate paid attempts',async()=>{
 const cache=new NarrationCache(path.join(root,'locks')),key=cacheIdentity({a:1});let unlock!:()=>void;const ready=new Promise<void>(r=>unlock=r);
 let entered!:()=>void;const started=new Promise<void>(r=>entered=r);const p=cache.lock(key,async()=>{entered();await ready;});await started;
 await assert.rejects(cache.lock(key,async()=>{}),/Another generation/);unlock();await p;
});
test('track separation and real sidechain ducking attenuate music during narration',async()=>{
 const voice=path.join(root,'voice.wav'),music=path.join(root,'music.wav');
 execFileSync('ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i',"aevalsrc=if(between(t\\,1\\,2)\\,0.35*sin(2*PI*900*t)\\,0):s=48000:d=3",voice]);
 execFileSync('ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','sine=frequency=300:duration=3:sample_rate=48000',music]);
 const out=path.join(root,'mix.wav');await mixTracks({narration:voice,music:{file:music,duck:true}},out);
 const raw=execFileSync('ffmpeg',['-v','error','-i',out,'-ac','1','-f','f32le','-'],{maxBuffer:4_000_000});const a=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);
 const amp=(at:number)=>{let s=0,c=0;for(let i=0;i<4800;i++){s+=a[Math.round(at*48000)+i]*Math.sin(2*Math.PI*300*i/48000);c+=a[Math.round(at*48000)+i]*Math.cos(2*Math.PI*300*i/48000);}return Math.hypot(s,c);};
 assert.ok(amp(1.5)<amp(0.5)*0.5,'music must duck by more than 6 dB');
 const measured=await measureLoudness(out);assert.ok(Number.isFinite(measured.truePeakDBTP));
});

test('invalid pauses/mastering fail before a billable POST; invalid provider audio is never delivered',async()=>{
 const f=fake(fixtureBytes),cache=new NarrationCache(path.join(root,'invalid'));
 await assert.rejects(generateNarration({series:'in_this_town',script:'Hello.',pauses:[{afterSentence:9,seconds:1}],paidApproved:true},{cache,client:f.client}),/pause/);
 await assert.rejects(generateNarration({series:'in_this_town',script:'Hello.',targetLUFS:0,paidApproved:true},{cache,client:f.client}),/Target/);
 assert.equal(f.calls.filter(c=>c.method==='POST').length,0);
 const invalid=fake(Buffer.from('invalid audio'));
 await assert.rejects(generateNarration({series:'in_this_town',script:'Hello.',paidApproved:true},{cache:new NarrationCache(path.join(root,'invalid-audio')),client:invalid.client}));
});
test('non-JSON network denial and transport failures stay sanitized',async()=>{
 const denied=new ElevenLabsClient({apiKey:'unit-test-secret-not-real',rotationConfirmed:true,fetcher:async()=>new Response('proxy denied; never include secret',{status:403})});
 await assert.rejects(denied.verify(),e=>(e as {code:string}).code==='ACCESS_DENIED');
 const network=new ElevenLabsClient({apiKey:'unit-test-secret-not-real',rotationConfirmed:true,fetcher:async()=>{throw new Error('unit-test-secret-not-real');}});
 await assert.rejects(network.verify(),e=>!(e as Error).message.includes('unit-test-secret')&&(e as {code:string}).code==='NETWORK_FAILURE');
});
test('missing cache files and metadata edits block unapproved regeneration',async()=>{
 const f=fake(fixtureBytes),cache=new NarrationCache(path.join(root,'missing-cache'));
 const result=await generateNarration({series:'in_this_town',script:'Hello, café. Warm now.',paidApproved:true},{cache,client:f.client});
 const meta=path.join(cache.directory(result.metadata.cacheKey),'metadata.json');const m=JSON.parse(await fs.readFile(meta,'utf8'));m.identity.script='Changed';await atomicJSON(meta,m);
 await assert.rejects(cache.lookup(result.metadata.cacheKey),/corrupt/);await fs.unlink(result.audio);await assert.rejects(cache.lookup(result.metadata.cacheKey),/missing/);
 assert.equal(f.calls.filter(c=>c.method==='POST').length,1);
});
test('generic episode beat maps are reusable; malformed visual plans fail before render',async()=>{
 const {planFromBeats,validatePlan}=await import('../timing');const text=TEST_SCRIPTS.in_this_town,t=alignText(alignment(text),text,4);const p=planTown(t,4);
 assert.equal(validatePlan(p),p);assert.throws(()=>validatePlan({...p,durationInFrames:1}));assert.throws(()=>validatePlan({...p,shots:p.shots.map((s,i)=>({...s,startFrame:i===1?0:s.startFrame}))}));
 const c=TEST_SCRIPTS.what_if_cats,ct=alignText(alignment(c),c,4);const generic=planFromBeats(ct,4,[{name:'Setup',fromSentence:0,toSentence:0,sourceStart:0,sourceEnd:30},{name:'Punchline',fromSentence:1,toSentence:1,sourceStart:31,sourceEnd:70}]);assert.equal(generic.shots.length,2);
 assert.throws(()=>planFromBeats(ct,4,[{name:'Incomplete',fromSentence:1,toSentence:1,sourceStart:0,sourceEnd:30}]));
});
test('high-crest audio preserves dynamics and meets measured encoded peak ceiling',async()=>{
 const high=path.join(root,'high-crest.wav');execFileSync('ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','aevalsrc=if(lt(mod(t\\,1)\\,0.01)\\,0.95*sin(2*PI*400*t)\\,0.01*sin(2*PI*400*t)):s=48000:d=3','-c:a','pcm_f32le',high]);
 const m=await masterAudio(high,path.join(root,'high-crest.mp3'));assert.ok(m.after.truePeakDBTP<=-1);assert.ok(m.gainDB<0);assert.equal(m.dynamics,'constant-gain; no compressor or time stretch');
});
test('missing provider timing retains raw audio and blocks accidental paid retry',async()=>{
 const base=fake(fixtureBytes),cache=new NarrationCache(path.join(root,'no-timing'));
 const f:typeof fetch=async(url,init)=>init?.method==='POST'?response({audio_base64:fixtureBytes.toString('base64')}):url.toString().endsWith('/models')?response(models):response({voice_id:String(url).split('/').pop(),name:'Approved fixture voice'});
 const client=new ElevenLabsClient({apiKey:'not-real',rotationConfirmed:true,fetcher:f});
 await assert.rejects(generateNarration({series:'in_this_town',script:'Hello.',paidApproved:true},{cache,client}),/timestamps endpoint/);
 await assert.rejects(generateNarration({series:'in_this_town',script:'Hello.',paidApproved:false},{cache}),/incomplete/);
});
