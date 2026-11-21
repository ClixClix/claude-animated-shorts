/** One current, narration-preserving local Episode02 review command. */
import {studioRoot} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceChecks} from './lib/episode02-source-checks.mjs';
import {renderInputs,requireUnchangedInputs} from './lib/episode02-render-inputs.mjs';
import {inspectReadiness,command,hashFile,finishReview,reviewFolder} from './lib/episode02-review-workflow.mjs';

export async function fullReview({root=studioRoot,checkOnly=false,force=false,run=command}={}){
 const out=reviewFolder(root);await fs.mkdir(out,{recursive:true});
 const report={stage:'PREFLIGHT',started:new Date().toISOString(),steps:[],visualApproval:false,publishingAllowed:false,paidRequests:0};
 const reportFile=path.join(out,'EP02_REVIEW_RUN.json');
 const save=()=>fs.writeFile(reportFile,JSON.stringify(report,null,2)+'\n');
 try{
  console.log('[EP02 REVIEW] Checking the existing edit, soundtrack and local tools...');
  report.readiness=await inspectReadiness(root);await save();
  if(!report.readiness.ready)throw Error('Local review inputs are not ready. Missing: '+(report.readiness.missing.join(', ')||'none')+'. Issues: '+(report.readiness.issues.join('; ')||'none')+'. See '+reportFile);
  const protectedNames=['render-props.json','EP02_SHOT_MANIFEST.json','EP02_ADAM_NARRATED_EDIT.json','MASTER_With_Music.wav','Narration_Stem.wav','Music_Stem.wav','SFX_Stem.wav'];
  const before={};for(const name of protectedNames){const file=path.join(out,name);if(await fs.access(file).then(()=>true,()=>false))before[name]=await hashFile(file);}
  console.log('[EP02 REVIEW] Validating the CURRENT narration-aligned source...');
  for(const check of sourceChecks){
   console.log('[EP02 CHECK] '+check.name);let error=null;
   try{run(process.execPath,[path.join(root,check.script),...(check.args??[])],{root});}catch(e){error=e.message;}
   report.steps.push({name:check.name,passed:error===null,error});
   if(error&&check.name==='TypeScript')break;
  }
  if(report.steps.length!==sourceChecks.length||report.steps.some(s=>!s.passed))throw Error('Source checks failed: '+report.steps.filter(s=>!s.passed).map(s=>s.name).join(', ')+'. No video render started. See '+reportFile);
  const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
  const inputs=await renderInputs(root,props,true);report.renderInputs=inputs;
  const ensureProtected=async()=>{for(const [name,sha] of Object.entries(before))if(await hashFile(path.join(out,name))!==sha)throw Error('Protected edit/audio input changed: '+name);};
  await ensureProtected();await requireUnchangedInputs(root,inputs);
  if(checkOnly){report.stage='SOURCE_READY__VIDEO_NOT_RENDERED';await save();return report;}
  console.log('[EP02 REVIEW] Rendering all '+props.shots.length+' live segments. Matching, intact cache entries are reusable.');
  run(process.execPath,[path.join(root,'scripts/episode02-render.mjs'),'preview',...(force?['--force']:[])],{root});
  await requireUnchangedInputs(root,inputs);await ensureProtected();
  console.log('[EP02 REVIEW] Assembling only CURRENT source-matched picture...');
  run(process.execPath,[path.join(root,'scripts/episode02-assemble.mjs'),'preview'],{root});
  console.log('[EP02 REVIEW] Adding the unchanged existing soundtrack and checking the encoded movie...');
  report.output=await finishReview(root,report.readiness.frames,report.readiness.audioSHA256);
  await ensureProtected();await requireUnchangedInputs(root,inputs);
  report.protectedInputs=before;report.stage='FULL_REVIEW_VIDEO_READY__CREATIVE_REVIEW_PENDING';
  report.finished=new Date().toISOString();await save();
  console.log('\nUpdated FULL REVIEW: '+report.output.file+'\nRun record: '+reportFile);
  return report;
 }catch(error){report.stage='REVIEW_STOPPED';report.error=error.message;report.finished=new Date().toISOString();await save();throw error;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const flags=process.argv.slice(2),unknown=flags.filter(f=>!['--check-only','--force','--open'].includes(f));
 if(unknown.length)throw Error('Unknown review options: '+unknown.join(', '));
 fullReview({checkOnly:flags.includes('--check-only'),force:flags.includes('--force')}).then(report=>{
  if(flags.includes('--open')&&report.output&&process.platform==='win32')command('explorer.exe',[report.output.file],{root:studioRoot});
 }).catch(error=>{console.error('EP02 REVIEW STOPPED: '+error.message);process.exitCode=1;});
}
