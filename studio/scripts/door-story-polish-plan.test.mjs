import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildStoryRevision} from './lib/story-revision-plan.mjs';
const studio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(studio,'src/v2/episodes/door-at-1111-story-polish');
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const revision=await json(path.join(dir,'revision.json'));
const fixture={revision,source:await fs.readFile(path.join(studio,revision.sourceScript),'utf8'),
 proposed:await fs.readFile(path.join(dir,'narration.txt'),'utf8'),metadata:await json(path.join(studio,revision.sourceMetadata)),
 edit:await json(path.join(studio,'src/v2/episodes/door-at-1111-polish/edit.json')),storyboard:await json(path.join(dir,'storyboard.json'))};
test('Three patches cover only sentence-aligned replacements; all other audio is retained',()=>{
 const p=buildStoryRevision(fixture);
 assert.equal(p.plannedRequests,3);assert.equal(p.estimatedCredits,646);assert.equal(p.paidRequestsMade,0);
 assert.equal(p.revisedCharacters,2352);assert.equal(p.audioEdit.at(-1).sourceEnd,fixture.metadata.duration);
 assert.ok(p.retainedSeconds>91&&p.retainedSeconds<93);
 assert.ok(p.estimatedDurationSeconds.low< p.estimatedDurationSeconds.mid&&p.estimatedDurationSeconds.mid<p.estimatedDurationSeconds.high);
 assert.ok(p.storyboard.every(s=>s.estimatedSeconds<=4));
});
test('Reject stale source, different voice/preset, or undeclared script edits',()=>{
 for(const mutate of [f=>f.source+=' extra',f=>f.metadata.narrator.voiceId='onwK4e9ZLuTAKqWW03F9',
  f=>f.metadata.processing.playback.speed=1.3,f=>f.proposed=f.proposed.replace("He wasn't waiting for customers.",'He wanted customers.')]){
  const f=structuredClone(fixture);mutate(f);assert.throws(()=>buildStoryRevision(f));
 }
});
test('Reject overlapping patches, a mid-sentence replacement, and spoken-word splices',()=>{
 for(const mutate of [f=>f.revision.patches[1].sourceSentenceIds=[4,5],f=>f.revision.patches[0].before='In this town,',
  f=>f.metadata.timing.words.push({text:'bad-boundary',start:11.4,end:11.7})]){
  const f=structuredClone(fixture);mutate(f);assert.throws(()=>buildStoryRevision(f));
 }
});
test('Reject filler hook, a missing help action, premature Mocha, and excessive shot length',()=>{
 for(const mutate of [f=>f.storyboard[0].criticalSubject='random-city',f=>f.storyboard.find(s=>s.criticalSubject==='nose-shoulder-contact').criticalSubject='latte',
  f=>f.storyboard[0].mochaVisible=true,f=>f.storyboard[0].weight=100]){
  const f=structuredClone(fixture);mutate(f);assert.throws(()=>buildStoryRevision(f));
 }
});
test('Planning cannot silently become paid authorization, full generation or retries',()=>{
 for(const key of ['paidApproved','fullRegeneration','automaticRetries']){
  const f=structuredClone(fixture);f.revision.generation[key]=true;assert.throws(()=>buildStoryRevision(f));
 }
});
