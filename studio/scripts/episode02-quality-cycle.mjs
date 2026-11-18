/**
 * Deterministic, repeatable Episode02 code review cycle.
 * Checks EXACT Episode01 original source, TypeScript, physical box assets,
 * then source-driven 58-60 animation-frame geometry.
 *
 * Run "node scripts/episode02-quality-cycle.mjs" to audit ONLY.
 * --preview adds real 14+11 rendered PNGs and HTML review; no full episode.
 * No paid voices, publishing, network calls or automatic quality assertions.
 */
import {studioRoot} from './lib/runtime.mjs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
const preview=process.argv.includes('--preview');
const checks=[
 {name:'Episode01 source identity and shading',file:'episode02-style-preflight.mjs'},
 {name:'TypeScript --noEmit',file:null},
 {name:'Physical cardboard and permanent café fixture tests',file:'episode02-box-tests.mjs'},
 {name:'Source-driven Episode02 finale frame by frame',file:'episode02-finale-audit.mjs'}
];
const results=[];
for(const check of checks){
 const args=check.file?
  [path.join(studioRoot,'scripts',check.file)]:
  [path.join(studioRoot,'node_modules/typescript/bin/tsc'),'--noEmit'];
 process.stdout.write('EP02 CHECK: '+check.name+'\n');
 try{
  execFileSync(process.execPath,args,{cwd:studioRoot,stdio:'inherit'});
  results.push({name:check.name,passed:true});
 }catch(e){
  results.push({name:check.name,passed:false,error:String(e.message??e).slice(0,200)});
  break;
 }
}
const passed=results.length===checks.length&&results.every(x=>x.passed);
// Non-blocking EDITORIAL timing audit: exact spoken-word map is not aligned
// to any authorized recorded narration yet. Flag impossible per-shot densities
// without changing the approved 60-shot visual timeline or calling a voice API.
let narrationTimingAudit={status:'UNAVAILABLE'};
try{
 const dir=path.join(studioRoot,'src/v2/episodes/in-this-town-02');
 const [plan,map,source]=await Promise.all([
  fs.readFile(path.join(dir,'EDITORIAL_SCRATCH_PLAN.json'),'utf8').then(JSON.parse),
  fs.readFile(path.join(dir,'NARRATION_SHOT_ALIGNMENT_PLAN.json'),'utf8').then(JSON.parse),
  fs.readFile(path.join(dir,'DRAFT_BOX_NARRATION.txt'),'utf8')
 ]);
 const words=s=>String(s).match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g)??[];
 const normalize=s=>words(s.toLowerCase()).map(w=>w.replace(/’/g,"'")).join(' ');
 const exactWordsMatch=normalize(map.shots.map(s=>s.spoken).join(' '))===normalize(source);
 const flagged=map.shots.map((s,i)=>{
  const edit=plan.shots[i];
  if(!edit||String(edit.id)!==String(s.id))throw Error('Narration shot order mismatch at '+(i+1));
  const duration=(edit.estimateEndFrame-edit.estimateStartFrame)/30;
  const count=words(s.spoken).length;
  return {shot:s.id,startFrame:edit.estimateStartFrame,endFrameExclusive:edit.estimateEndFrame,
   seconds:+duration.toFixed(3),words:count,impliedWpm:Math.round(count*60/duration)};
 }).filter(x=>x.impliedWpm>250);
 narrationTimingAudit={status:'UNTIMED_SCRATCH_WARNING_NOT_AUDIO_FAILURE',
  exactWordsMatch,shots:map.shots.length,wordCount:words(source).length,
  totalFrames:plan.approximateFrameCount,thresholdWpm:250,
  flaggedShots:flagged,flaggedCount:flagged.length,
  note:'These are implied words/minute if every mapped line must fit inside its single shot. Actual voice timings may span cuts. Do not retime approved visuals or synthesize paid narration without explicit authorization.'};
 if(!exactWordsMatch||map.shots.length!==60)
  narrationTimingAudit.status='SOURCE_SCRIPT_MAPPING_MISMATCH';
 console.log('EP02 NON-BLOCKING NARRATION TIMING:',JSON.stringify(narrationTimingAudit));
}catch(e){
 narrationTimingAudit={status:'AUDIT_UNAVAILABLE',error:String(e)};
 console.warn('EP02 narration timing audit unavailable:',String(e));
}
const reportDir=path.join(studioRoot,'out/v2-episodes/in-this-town-02/series-style-qa');
await fs.mkdir(reportDir,{recursive:true});
let previewResult='NOT_REQUESTED';
if(preview&&passed){
 try{
  execFileSync(process.execPath,
   [path.join(studioRoot,'scripts/episode02-episode1-assets-preview.mjs')],
   {cwd:studioRoot,stdio:'inherit'});
  previewResult='RENDERED_FRAMES_STILL_REQUIRE_HUMAN_REVIEW';
 }catch(e){
  previewResult='FAILED: '+String(e.message??e).slice(0,300);
 }
}
const out={stage:passed?'SOURCE_AND_GEOMETRY_CHECKS_PASS_VISUAL_REVIEW_PENDING':'CODE_AUDIT_FAILED',
 passed,checks:results,preview:previewResult,sourceReviewComplete:passed,
 artisticReviewComplete:false,confidenceInEpisode01VisualParity:null,
 noPaidMedia:true,noPublishing:true,narrationTimingAudit,
 note:'No code test can claim 99% similarity to the Episode01 movie until actual Episode02 moving footage is inspected.'
};
const filename=path.join(reportDir,'EP2_REPEATABLE_CODE_AUDIT.json');
await fs.writeFile(filename,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({stage:out.stage,checks:results.length,
 preview:out.preview,report:filename},null,2));
if(!passed||previewResult.startsWith('FAILED'))process.exitCode=2;
