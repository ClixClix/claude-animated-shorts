// Run from any directory. Writes ONLY proposal files; never touches the active edit/cache.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildStoryRevision,sha256} from './lib/story-revision-plan.mjs';
const studio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const proposal=path.join(studio,'src/v2/episodes/door-at-1111-story-polish');
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const revision=await json(path.join(proposal,'revision.json'));
const [source,proposed,metadata,edit,storyboard,audio]=await Promise.all([
 fs.readFile(path.join(studio,revision.sourceScript),'utf8'),fs.readFile(path.join(proposal,'narration.txt'),'utf8'),
 json(path.join(studio,revision.sourceMetadata)),json(path.join(studio,'src/v2/episodes/door-at-1111-polish/edit.json')),
 json(path.join(proposal,'storyboard.json')),fs.readFile(path.join(studio,revision.sourceAudio))]);
if(sha256(audio)!==revision.sourceAudioSHA256)throw Error('Approved source audio changed. No output prepared.');
const plan=buildStoryRevision({revision,source,proposed,metadata,edit,storyboard});
let receipt;
try{receipt=await json(path.join(proposal,'generation-receipt.json'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(receipt){plan.currentStatus=receipt.status;plan.generationReceipt=receipt;}
const out=path.join(studio,revision.candidateOutput);await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'STORY_REVISION_PLAN.json'),JSON.stringify(plan,null,2)+'\n');
await fs.writeFile(path.join(out,'REVISED_NARRATION.txt'),proposed);
for(const p of plan.patches)await fs.writeFile(path.join(out,p.id+'.txt'),p.after);
const f=n=>n.toFixed(2);
const report=['# Episode 1: prepared story revision','',
 receipt?'**The three patches have been approved and generated once. Authorization is consumed. Visual integration is still pending. See EPISODE1_AUDIO_DELIVERY.md.**':'**Awaiting separate paid approval. No new narration or movie has been generated.**','',
 `Baseline: ${plan.baselineCommit}; checkpoint: ${plan.checkpoint}.`,
 `Three replacement requests: ${plan.estimatedCredits} estimated credits, ${plan.revisedCharacters} characters in the full revised script.`,
 plan.pricingBasis,
 `Estimated runtime: ${f(plan.estimatedDurationSeconds.low)}–${f(plan.estimatedDurationSeconds.high)} seconds (central estimate ${f(plan.estimatedDurationSeconds.mid)}).`,
 `Retain ${f(plan.retainedSeconds)} seconds of the existing ${f(plan.baselineDurationSeconds)}-second take.`,
 'These are planning estimates, not word timings or approved render ranges.','',
 '## Exact before/after and source intervals','',
 ...plan.patches.flatMap(p=>[`### ${p.id}`,'',`Before: ${p.before}`,'',`After: ${p.after}`,'',
  `${p.characters} characters / ${p.estimatedCredits} estimated credits. Existing audio interval ${f(p.originalSourceSeconds.start)}–${f(p.originalSourceSeconds.end)} seconds.`,
  `Affected existing shots: ${p.affectedActualShots.join(', ')}. New segment estimate: ${f(p.estimatedProcessedSeconds.low)}–${f(p.estimatedProcessedSeconds.high)} seconds.`,'']),
 '## Provisional storyboard','',
 ...plan.storyboard.flatMap(s=>[`- **${s.id}** (~${f(s.estimatedSeconds)}s, maximum ${s.maxSeconds}s): “${s.narrationAnchor}” — ${s.action}`]),'',
 '## Post-approval gates','',
 'Generate only the three exact patch texts once each, without paid retries; keep original and processed caches separate. Apply the same 1.35x varispeed once to each original patch.',
 'Join at verified silent sentence boundaries; preserve every retained spoken word. Listen for timbre/prosody changes and edit clicks before staging final pictures. A bad join is a review issue, not permission for a paid retry.',
 'Measure actual new audio and use provider timestamps. Rebuild captions, cuts and SFX from those timings; never render using these estimates.',
 'Use EPISODE1_STORY_POLISH_PLAN.md for the source-change map, continuity requirements and local workflow.',''];
await fs.writeFile(path.join(out,'STORY_REVISION_PLAN.md'),report.join('\n'));
console.log(JSON.stringify({status:receipt?.status??plan.status,paidAuthorizationConsumed:receipt?.authorizationConsumed??false,actualCredits:receipt?.actualCredits,plannedRequests:plan.plannedRequests,estimatedCredits:plan.estimatedCredits,
 estimatedDurationSeconds:plan.estimatedDurationSeconds,retainedSeconds:plan.retainedSeconds,paidRequestsMade:0,report:path.join(out,'STORY_REVISION_PLAN.md')},null,2));
