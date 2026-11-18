// Offline regression: mirror Episode01's narration-led editorial contract.
// No ElevenLabs request, audio generation, browser render or publishing.
import './lib/runtime.mjs';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createNarratedEpisodeEdit} from './lib/episode02-adam-edit.mjs';
const src=path.resolve('src/v2/episodes/in-this-town-02');
const [script,map,draft]=await Promise.all([
 fs.readFile(path.join(src,'DRAFT_BOX_NARRATION.txt'),'utf8').then(s=>s.trim()),
 fs.readFile(path.join(src,'NARRATION_SHOT_ALIGNMENT_PLAN.json'),'utf8').then(JSON.parse),
 fs.readFile(path.join(src,'EDITORIAL_SCRATCH_PLAN.json'),'utf8').then(JSON.parse)
]);
const tokenize=s=>String(s).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[];
const original=tokenize(script);
assert.ok(original.length>300&&map.shots.length===60);
const sha=createHash('sha256').update(script).digest('hex');
const meta={voiceId:'pNInz6obpgDQGcFmaJgB',
 modelId:'eleven_multilingual_v2',scriptSHA256:sha,
 pitchAndTempo:{speed:1.35,mode:'varispeed'},duration:126};
const timing=original.map((text,i)=>({
 text,start:.12+i*.31,end:.34+i*.31
}));
const duration=Math.ceil((timing.at(-1).end+.8)*30)/30;
meta.duration=duration;
const test=(overrides={})=>createNarratedEpisodeEdit({
 script,plan:map,draft,alignment:timing,voiceSeconds:duration,
 provenance:meta,...overrides
});
const edit=test();
assert.equal(edit.markers.length,60);
assert.equal(edit.durationInFrames,Math.ceil(duration*30));
assert.equal(edit.voice.wordCount,timing.length);
assert.equal(edit.shots[0].sourceStart,0);
assert.equal(edit.shots.filter(s=>s.sequence<=2).at(-1).sourceEnd,105);
assert.ok(edit.shots.length>=60);
assert.ok(edit.shots.every((s,i)=>s.end-s.start<=120&&
  (i===0?s.start===0:s.start===edit.shots[i-1].end)));
for(const mark of edit.markers){
 const related=edit.shots.filter(s=>s.sequence===mark.sequence);
 assert.equal(related[0].start,mark.editStartFrame);
 assert.equal(related.at(-1).end,mark.editEndFrame);
}
for(const change of [
 {provenance:{...meta,voiceId:'8dEUmyPMdDdK91vboYih'}},
 {alignment:timing.slice(0,-1)},
 {alignment:timing.map((w,i)=>i===0?{...w,text:'wrong'}:w)},
 {provenance:{...meta,pitchAndTempo:{speed:1.0,mode:'independent'}}}
])assert.throws(()=>test(change));
console.log(JSON.stringify({
 stage:'ADAM_EDIT_OFFLINE_REGRESSION_PASSED',
 originalVoice:'pNInz6obpgDQGcFmaJgB',
 testScriptWords:original.length,narrationBeats:edit.markers.length,
 continuousShots:edit.shots.length,frames:edit.durationInFrames,
 previewOnly:true,providerRequests:0,realNarrationGenerated:false
},null,2));
