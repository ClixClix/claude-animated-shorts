// Offline editorial planning only. No provider imports, synthesis, mixing or rendering.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const sha256=value=>createHash('sha256').update(value).digest('hex');
const normalized=text=>text.replace(/\s+/g,' ').trim();
const chars=text=>[...text].length;

export function buildStoryRevision({revision:r,source,proposed,metadata:m,edit,storyboard}){
 assert.equal(r.status,'prepared-awaiting-paid-approval');
 assert.equal(r.generation.paidApproved,false,'Planning is never generation approval.');
 assert.equal(r.generation.fullRegeneration,false);
 assert.equal(r.generation.automaticRetries,false);
 assert.equal(sha256(source),r.sourceScriptSHA256,'Source script changed: rebase the proposal.');
 assert.equal(m.script,source,'Cached timing must describe this exact source script.');
 assert.equal(m.audioHash,r.sourceAudioSHA256,'Wrong approved source audio identity.');
 assert.equal(m.narrator.voiceId,r.voiceId);
 assert.equal(m.narrator.modelId,r.modelId);
 assert.equal(m.narrator.settings.speed,r.providerSpeed);
 assert.deepEqual(m.processing.playback,r.playback);
 assert.equal(r.generation.plannedRequests,r.patches.length);
 assert.equal(r.generation.creditEstimatePerCharacter,1);
 assert.ok(m.duration>0&&Number.isFinite(m.duration));
 const sentences=m.timing.sentences;
 assert.ok(sentences.length>0);
 for(let i=0;i<sentences.length;i++){
  const s=sentences[i];
  assert.ok(s.start>=0&&s.end>s.start&&s.end<=m.duration);
  if(i)assert.ok(s.start>=sentences[i-1].end,'Overlapping sentence alignment.');
 }
 const originalShots=edit.shots;
 assert.equal(originalShots[0].start,0);
 originalShots.forEach((s,i)=>{
  assert.equal(s.start,i?originalShots[i-1].end:0);
  assert.ok(s.end>s.start&&s.end-s.start<=120);
 });
 assert.equal(originalShots.at(-1).end,Math.ceil(m.duration*30));
 let reconstructed=source,priorSentence=-1;
 const ids=new Set(),rate=chars(source)/m.duration;
 const patches=r.patches.map(p=>{
  assert.ok(!ids.has(p.id),'Duplicate patch ID.');ids.add(p.id);
  const n=p.sourceSentenceIds;
  assert.ok(n.length&&Number.isInteger(n[0])&&n[0]>priorSentence,'Unordered or overlapping replacements.');
  n.forEach((id,i)=>assert.ok(Number.isInteger(id)&&id>=0&&id<sentences.length&&(!i||id===n[i-1]+1),'Non-contiguous sentence replacement.'));
  priorSentence=n.at(-1);
  assert.equal(normalized(p.before),normalized(n.map(i=>sentences[i].text).join(' ')),'Replacement cuts through a sentence.');
  assert.equal(reconstructed.split(p.before).length,2,'Replacement source is not unique.');
  assert.ok(p.after.trim()===p.after&&p.after.length);
  reconstructed=reconstructed.replace(p.before,p.after);
  const first=n[0],last=n.at(-1),start=first?(sentences[first-1].end+sentences[first].start)/2:0;
  const end=last===sentences.length-1?m.duration:(sentences[last].end+sentences[last+1].start)/2;
  assert.ok(!m.timing.words.some(w=>w.start<start&&w.end>start||w.start<end&&w.end>end),'Splice boundary intersects a spoken word.');
  const count=chars(p.after),mid=count/rate;
  const shots=originalShots.filter(s=>s.start/30<end&&s.end/30>start).map(s=>s.id);
  assert.deepEqual(p.sourceShotIds,shots,'Affected-shot list is stale.');
  return {...p,scriptSHA256:sha256(p.after),characters:count,estimatedCredits:count,
   originalSourceSeconds:{start,end,duration:end-start},
   estimatedProcessedSeconds:{low:mid*.8,mid,high:mid*1.2},affectedActualShots:shots};
 });
 assert.equal(reconstructed,proposed,'Revised full script contains unlisted changes.');
 for(const line of r.protectedLines){assert.ok(source.includes(line));assert.ok(proposed.includes(line),'Protected ending changed.');}
 assert.ok(!proposed.includes('Too little to reach the handle.'));
 assert.ok(!proposed.includes('Most cats avoided that street after dark.'));
 assert.ok(!proposed.includes('Latte stayed out too late.'));
 assert.ok(storyboard.length>0);
 const boardIds=new Set();
 const board=storyboard.map(s=>{
  const p=patches.find(p=>p.id===s.patchId);
  assert.ok(p&&!boardIds.has(s.id),'Unknown patch or duplicate storyboard ID.');boardIds.add(s.id);
  assert.ok(Number.isFinite(s.weight)&&s.weight>0);
  assert.ok(s.maxSeconds>0&&s.maxSeconds<=4&&s.mochaVisible===false,'Duration or premature Mocha reveal.');
  assert.ok(p.after.includes(s.narrationAnchor),'Shot refers to a missing narration anchor.');
  assert.ok(s.criticalSubject&&s.action);
  const total=storyboard.filter(b=>b.patchId===s.patchId).reduce((n,b)=>n+b.weight,0);
  const estimate=p.estimatedProcessedSeconds.mid*s.weight/total;
  assert.ok(estimate<=s.maxSeconds,'Provisional shot already exceeds four seconds.');
  return {...s,estimatedSeconds:estimate,timingStatus:'provisional-not-renderable'};
 });
 for(const p of patches)assert.ok(board.some(s=>s.patchId===p.id),'Patch lacks storyboard.');
 const opening=board.filter(s=>s.patchId==='opening');
 assert.equal(opening[0].criticalSubject,'cafe-door');
 const clock=opening.findIndex(s=>s.criticalSubject==='clock');
 assert.ok(clock>=0&&opening.slice(0,clock+1).reduce((n,s)=>n+s.estimatedSeconds,0)<=3,'Cafe/time not established within first three seconds.');
 for(const subject of ['home-and-cafe','latte-and-mouse','first-streetlight','kitten-paw-contact','nose-shoulder-contact'])assert.ok(board.some(s=>s.criticalSubject===subject),'Missing story action: '+subject);
 let cursor=0;
 const audioEdit=[];
 for(const p of patches){
  const {start,end}=p.originalSourceSeconds;
  assert.ok(start>=cursor);
  if(start>cursor)audioEdit.push({kind:'retain-cached',sourceStart:cursor,sourceEnd:start});
  audioEdit.push({kind:'replace-after-approval',patchId:p.id,sourceStart:start,sourceEnd:end});
  cursor=end;
 }
 if(cursor<m.duration)audioEdit.push({kind:'retain-cached',sourceStart:cursor,sourceEnd:m.duration});
 audioEdit.forEach((s,i)=>assert.equal(s.sourceStart,i?audioEdit[i-1].sourceEnd:0));
 const retainedSeconds=audioEdit.filter(s=>s.kind==='retain-cached').reduce((n,s)=>n+s.sourceEnd-s.sourceStart,0);
 const duration=Object.fromEntries(['low','mid','high'].map(k=>[k,retainedSeconds+patches.reduce((n,p)=>n+p.estimatedProcessedSeconds[k],0)]));
 return {status:r.status,baselineCommit:r.baselineCommit,checkpoint:r.checkpoint,
  paidRequestsMade:0,plannedRequests:r.patches.length,automaticRetries:false,
  originalCharacters:chars(source),revisedCharacters:chars(proposed),revisedScriptSHA256:sha256(proposed),
  estimatedCredits:patches.reduce((n,p)=>n+p.estimatedCredits,0),pricingBasis:r.generation.pricingBasis,
  processedCharactersPerSecond:rate,baselineDurationSeconds:m.duration,retainedSeconds,
  estimatedDurationSeconds:duration,timingStatus:'estimate-only; provider alignment and actual recording durations required before rendering',
  patches,audioEdit,storyboard:board};
}
