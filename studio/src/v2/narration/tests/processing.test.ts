import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {NARRATORS,PLAYBACK,SAWYER_FALLBACK,narratorFor,playbackFor} from '../config';
import {alignText} from '../timing';
import {NarrationCache,cacheIdentity,sha256} from '../server/cache';
import {masterAudio} from '../server/audio';
import type {NarrationMetadata} from '../server/generator';
import {processNarration} from '../server/processing';

let root:string,source:string,metadata:NarrationMetadata;
test.before(async()=>{
 root=await fs.mkdtemp(path.join(tmpdir(),'v2-playback-'));
 const wav=path.join(root,'tone.wav');source=path.join(root,'original.mp3');
 execFileSync('ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','sine=frequency=440:duration=4:sample_rate=48000','-c:a','pcm_f32le',wav]);
 const mastering=await masterAudio(wav,source),script='Test.';
 const timing=alignText({characters:[...script],character_start_times_seconds:[0,0.4,0.8,1.2,1.6],character_end_times_seconds:[0.4,0.8,1.2,1.6,2]},script,mastering.info.duration);
 const narrator=narratorFor('in_this_town'),identity={series:'in_this_town',voiceId:narrator.voiceId,settings:narrator.settings,script};
 metadata={version:1,series:'in_this_town',script,narrator,parameters:{outputFormat:'mp3_44100_128',applyTextNormalization:'auto'},identity,cacheKey:cacheIdentity(identity),audioHash:sha256(await fs.readFile(source)),duration:mastering.info.duration,timing,mastering,verification:{} as NarrationMetadata['verification'],createdAt:new Date().toISOString(),warnings:[]};
});
test.after(async()=>{await fs.rm(root,{recursive:true,force:true});});

test('selected Adam offline preset, immutable Sawyer fallback, and recovered Daniel settings',()=>{
 assert.equal(NARRATORS.in_this_town.voiceId,'pNInz6obpgDQGcFmaJgB');
 assert.deepEqual(playbackFor('in_this_town'),{speed:1.35,pitchSemitones:0,mode:'varispeed'});
 assert.deepEqual(playbackFor('what_if_cats'),{speed:1,pitchSemitones:0});
 assert.equal(NARRATORS.what_if_cats.voiceId,'onwK4e9ZLuTAKqWW03F9');
 assert.deepEqual(NARRATORS.what_if_cats.settings,{stability:0.72,similarity_boost:0.70,style:0,use_speaker_boost:true,speed:1});
 assert.equal(SAWYER_FALLBACK.narrator.voiceId,'8dEUmyPMdDdK91vboYih');
 assert.deepEqual(SAWYER_FALLBACK.narrator.settings,{stability:0.6,similarity_boost:0.75,style:0.15,use_speaker_boost:true,speed:1});
 assert.deepEqual(SAWYER_FALLBACK.playback,{speed:1,pitchSemitones:0});
 assert.equal(narratorFor('in_this_town').settings.speed,1);
 assert.deepEqual(playbackFor('in_this_town',{speed:1.15,pitchSemitones:1,mode:'independent'}),{speed:1.15,pitchSemitones:1,mode:'independent'});
 assert.equal(PLAYBACK.in_this_town.speed,1.35);
 for(const p of [{speed:NaN},{speed:0},{pitchSemitones:13}])assert.throws(()=>playbackFor('in_this_town',p));
});

function measured(file:string){
 const raw=execFileSync('ffmpeg',['-v','error','-i',file,'-ac','1','-ar','48000','-f','f32le','-'],{maxBuffer:4_000_000});
 const data=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),from=24000,to=Math.min(from+96000,data.length-24000);
 // Interpolated upward zero crossings over the stable middle of the engineering tone.
 const crossings:number[]=[];for(let i=from+1;i<to;i++)if(data[i-1]<0&&data[i]>=0)crossings.push(i-1-data[i-1]/(data[i]-data[i-1]));
 return {duration:data.length/48000,hz:(crossings.length-1)*48000/(crossings.at(-1)!-crossings[0])};
}

test('real sequential tempo and pitch passes are independent; exact repeat uses derived cache',async()=>{
 const cache=new NarrationCache(path.join(root,'processed-cache'));
 const cases=[{speed:1.3,pitchSemitones:0},{speed:1,pitchSemitones:5},{speed:1.3,pitchSemitones:5}];
 for(const p of cases){
  const result=await processNarration({audio:source,metadata,playback:{...p,mode:'independent'}},cache),m=measured(result.audio);
  assert.ok(Math.abs(m.hz-440*2**(p.pitchSemitones/12))<2,`pitch ${m.hz} must be independent of tempo`);
  assert.ok(Math.abs(m.duration-4/p.speed)<0.025,`duration ${m.duration} must be independent of pitch`);
  assert.ok(result.metadata.mastering.after.truePeakDBTP<=-1);
  assert.notEqual(result.metadata.cacheKey,metadata.cacheKey);
  assert.equal(result.metadata.source.audioHash,metadata.audioHash);
  assert.equal(result.metadata.timing.sentences[0].end,metadata.timing.sentences[0].end/p.speed);
  const hit=await processNarration({audio:source,metadata,playback:{...p,mode:'independent'}},cache);
  assert.equal(hit.cached,true);assert.equal(hit.metadata.audioHash,result.metadata.audioHash);
 }
 assert.equal(sha256(await fs.readFile(source)),metadata.audioHash);
});

test('reject processed inputs and modified originals without provider access',async()=>{
 const cache=new NarrationCache(path.join(root,'reject-cache'));
 const derived=await processNarration({audio:source,metadata},cache);
 await assert.rejects(processNarration({audio:derived.audio,metadata:derived.metadata},cache),/original natural-speed/);
 await assert.rejects(processNarration({audio:derived.audio,metadata},cache),/hash/);
 const corrupt=path.join(root,'corrupt.mp3');await fs.copyFile(source,corrupt);await fs.appendFile(corrupt,'changed');
 await assert.rejects(processNarration({audio:corrupt,metadata},cache),/hash/);
 await fs.writeFile(derived.audio,'corrupt cached derivative');
 await assert.rejects(processNarration({audio:source,metadata},cache),/corrupt/);
});

test('identity processing preserves original bytes, synthesis identity, and cached source',async()=>{
 const before=JSON.stringify(metadata),cache=new NarrationCache(path.join(root,'identity'));
 const result=await processNarration({audio:source,metadata,playback:{speed:1,pitchSemitones:0,mode:'independent'}},cache);
 assert.equal(result.metadata.audioHash,metadata.audioHash);
 assert.deepEqual(await fs.readFile(result.audio),await fs.readFile(source));
 assert.equal(JSON.stringify(metadata),before);
});


test('approved straight 1.35x preset raises tempo and pitch together and has a distinct cache',async()=>{
 const cache=new NarrationCache(path.join(root,'varispeed'));
 const result=await processNarration({audio:source,metadata},cache),m=measured(result.audio);
 assert.ok(Math.abs(m.hz-440*1.35)<1,'straight speed-up must raise pitch naturally');
 assert.ok(Math.abs(m.duration-4/1.35)<0.025);
 assert.deepEqual(result.metadata.processing.playback,{speed:1.35,pitchSemitones:0,mode:'varispeed'});
 assert.ok(result.metadata.mastering.after.truePeakDBTP<=-1);
 const independent=await processNarration({audio:source,metadata,playback:{speed:1.35,pitchSemitones:0,mode:'independent'}},cache);
 assert.notEqual(independent.metadata.cacheKey,result.metadata.cacheKey);
 assert.ok(Math.abs(measured(independent.audio).hz-440)<2);
 const hit=await processNarration({audio:source,metadata},cache);assert.equal(hit.cached,true);
 assert.throws(()=>playbackFor('in_this_town',{pitchSemitones:5}));
});
