import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {inspectReadiness,finishReview,reviewFolder,hashFile,command,probe,validateMovie} from './lib/episode02-review-workflow.mjs';
async function fixture(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ep02-review-test-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));await fs.mkdir(reviewFolder(root),{recursive:true});return root;}
test('missing local inputs are reported together before any render',async t=>{
 const root=await fixture(t),r=await inspectReadiness(root);
 assert.equal(r.ready,false);assert.equal(r.missing.length,7);
 assert(r.missing.some(n=>n.endsWith('MASTER_With_Music.wav')));
 assert.deepEqual(await fs.readdir(reviewFolder(root)),[]);
});
test('movie validation rejects the wrong edit and absent audio',()=>{
 const p={streams:[{codec_type:'video',width:540,height:960,r_frame_rate:'30/1',nb_frames:'30'},{codec_type:'audio',codec_name:'aac',sample_rate:'48000',channels:2}],format:{duration:'1'}};
 assert.equal(validateMovie(p,30).frames,30);
 assert.throws(()=>validateMovie(p,31),/frame/);
 assert.throws(()=>validateMovie({...p,format:{duration:'2'}},30),/duration/);
 assert.throws(()=>validateMovie({...p,format:{}},30),/duration/);
 assert.throws(()=>validateMovie({...p,streams:[p.streams[0]]},30),/soundtrack/);
});
test('real FFmpeg mux preserves picture packets, source audio and the previous review',async t=>{
 const root=await fixture(t),out=reviewFolder(root);
 const visual=path.join(out,'EP02_540p_Visual.mp4'),audio=path.join(out,'MASTER_With_Music.wav'),final=path.join(out,'EP02_Updated_Full_Review_540p.mp4');
 command('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=c=orange:s=540x960:r=30','-frames:v','30','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',visual],{root});
 command('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','1','-ac','2',audio],{root});
 await fs.writeFile(final,'PREVIOUS_REVIEW_FIXTURE');const audioHash=await hashFile(audio),visualHash=await hashFile(visual);
 await assert.rejects(finishReview(root,30,'wrong-audio-hash'),/soundtrack changed/);
 assert.equal(await fs.readFile(final,'utf8'),'PREVIOUS_REVIEW_FIXTURE');
 const result=await finishReview(root,30,audioHash);
 assert.equal(result.picturePacketsUnchanged,true);assert.equal(result.frames,30);
 assert.equal(await hashFile(audio),audioHash);assert.equal(await hashFile(visual),visualHash);
 assert.equal(await fs.readFile(result.previousReview,'utf8'),'PREVIOUS_REVIEW_FIXTURE');
 validateMovie(probe(final,root),30);
 // A short replacement must fail without replacing the last complete review.
 const previous=await hashFile(final);
 await assert.rejects(finishReview(root,60,audioHash),/duration/);
 assert.equal(await hashFile(final),previous);
});
