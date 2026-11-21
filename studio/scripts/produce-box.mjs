import {studioRoot} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import os from 'node:os';
const mode=(process.argv[2]??'status').toLowerCase();
// The current review path preserves the existing approved edit/audio. No Python,
// scratch prepare, voice call, or old independent QA sequence is involved.
if(mode==='review'||mode==='doctor'||(mode==='build-preview'&&!process.argv.includes('--allow-scratch'))){
 const args=[path.join(studioRoot,'scripts/episode02-local-full-review.mjs'),...(mode==='doctor'?['--check-only']:[]),...process.argv.slice(3)];
 const r=spawnSync(process.execPath,args,{cwd:studioRoot,stdio:'inherit',env:process.env});
 if(r.error)throw r.error;process.exit(r.status??1);
}
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02');
// Episode01 accepted V2_PYTHON; the user's new Windows clone is now
// C:\\V2\\ep02-local-render\\studio, but the shared venv may remain at
// C:\\V2\\.venv. Resolve that BEFORE starting a long narrated render.
const pythonCandidates=[
 process.env.V2_PYTHON,
 path.join(studioRoot,'..','.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python'),
 ...(process.platform==='win32'?['C:/V2/.venv/Scripts/python.exe']:[]),
 'python'
].filter(Boolean);
const python=pythonCandidates.find(p=>{
 if((p.includes('/')||p.includes('\\'))&&!existsSync(p))return false;
 const probe=spawnSync(p,['-c','import numpy; print("ok")'],{encoding:'utf8'});
 return probe.status===0;
});
if(!python&&mode!=='status')throw Error('Episode02 cannot find Python with numpy. Set V2_PYTHON to your Episode01 virtual environment; no render started.');
const arg=(key)=>{const i=process.argv.indexOf(key);return i>=0?process.argv[i+1]:undefined;};
const flag=(key)=>process.argv.includes(key);
const run=(program,args)=>{
 console.log('\n[EPISODE 02] '+path.basename(program)+' '+args.join(' '));
 const p=spawnSync(program,args,{stdio:'inherit',cwd:studioRoot,env:process.env});
 if(p.error)throw p.error;
 if(p.status!==0)throw Error('Episode 02 stage failed ('+p.status+'): '+args.join(' ')+'. Previous completed work has been retained.');
};
const node=(name,...args)=>run(process.execPath,['scripts/episode02-'+name+'.mjs',...args]);
const py=(name,...args)=>run(python,['scripts/episode02-'+name+'.py',...args]);
const prepareArgs=[];
if(flag('--allow-scratch'))prepareArgs.push('--allow-scratch');
if(arg('--voice'))prepareArgs.push('--voice',arg('--voice'));
if(arg('--words'))prepareArgs.push('--words',arg('--words'));
// The actual Episode 01 series music is the ONLY permitted music source.
// Fail BEFORE the costly local video render if the private recording is missing.
const seriesMusic=process.env.V2_MUSIC_FILE||path.join(process.env.V2_PRIVATE_ASSETS||path.join(os.homedir(),'WhatIfCatsPrivate'),'audio','temporex-numbers-intro.mp3');
if(mode==='status'){
 for(const file of ['EP02_SHOT_MANIFEST.json','PRODUCTION_READINESS.json',
  'FINAL_RENDER_STATUS.json','VISUAL_ASSEMBLY.json','EP02_FINISHING_STATUS.json']){
  const p=path.join(out,file);console.log(file+': '+(await fs.access(p).then(()=>true,()=>false)?'exists':'not yet created'));
 }
 console.log('No rendering or paid requests during status.');
}else if(mode==='build'||mode==='build-preview'){
 // Build all source/scene/audio stages in one sequence. NO typecheck/QA/contact sheet
 // is run here: the user requested a single combined review AFTER full assembly.
 // An Episode01-style narrated render REQUIRES the actual Adam recording
 // and verified timing files. Fail immediately with an actionable message,
 // before modifying any manifest or starting a long expensive render.
 if(!flag('--allow-scratch')){
  const outputFile=arg('--voice')??process.env.EP02_VOICE_FILE??path.join(out,'Approved_Narration.wav');
  const required=[outputFile,path.join(out,'Approved_Word_Timings.json'),
   path.join(out,'EP02_VOICE_PROVENANCE.json')];
  const missing=required.filter(p=>!existsSync(p));
  if(missing.length)throw Error('EP02_ADAM_NARRATION_NOT_READY: missing '+missing.join(', ')+
   '. Generate ONE approved ElevenLabs Adam recording first. Run npm.cmd run episode2:voice-count to inspect character count / required provider approval. Do not run preview/build/check until real Adam audio and timestamps exist. No paid request was made.');
 }
 if(!existsSync(seriesMusic))throw Error('EP02_SERIES_MUSIC_MISSING: Place the already-used Episode 01 intro recording at '+seriesMusic+' or set V2_MUSIC_FILE. Never substitute procedural music. No render started.');
 const existingEdit=path.join(out,'render-props.json');
 const preserveEdit=!flag('--reprepare')&&!flag('--allow-scratch')&&existsSync(existingEdit)&&JSON.parse(await fs.readFile(existingEdit,'utf8')).audioApproved===true;
 if(preserveEdit){node('style-preflight');run(process.execPath,['src/v2/episodes/in-this-town-02/tools/locked-edit-gate.mjs']);}
 else node('prepare',...prepareArgs);
 node('director-preflight','--strict');
 // Show-dont-tell evidence: native masters require actual action movement;
 // low-resolution preview remains available to diagnose source gaps.
 node('live-action-evidence',...(mode==='build'?['--strict']:[]));
 // Exactly as Episode01's polish workflow: block production when code,
 // cat continuity or floor/camera geometry gates have not passed.
 // Windows Node 24 spawnSync('npm.cmd') fails with EINVAL. Invoke the
 // installed TypeScript CLI via Node directly (same TypeScript compiler).
 run(process.execPath,[path.join(studioRoot,'node_modules/typescript/bin/tsc'),'--noEmit']);
 node('adam-edit-test');
 node('style-preflight');
 node('box-tests');
 node('finale-audit');
 // Render a reviewable cut even if the advisory spatial audit finds issues.
 // Keep the strict camera audit in the explicit final `check` stage.
 // Do not present this preview as a quality-approved release.
 py('audio');
 node('series-music');
 node('render',mode==='build'?'render':'preview');
 node('assemble',mode==='build'?'render':'preview');
 node('finish',...(mode==='build-preview'?['--preview']:[]));
 console.log('Episode 02 render and Episode 01 music remix assembled. Full rendered creative QA is still required. Run: node scripts/produce-box.mjs check');
}else if(mode==='check'){
 // The final gate only checks a completed production master. Do not hide
 // a missing Adam build behind unrelated TypeScript or Windows errors.
 if(!existsSync(path.join(out,'EP02_FINISHING_STATUS.json')))
  throw Error('EP02_CHECK_BEFORE_BUILD: no completed Episode02 finishing report exists. Generate Adam voice, run episode2:preview-adam and episode2:build first; then run episode2:check. This command cannot make the missing video.');
 // THE ONE BATCH REVIEW GATE. This is intentionally opt-in and never runs
 // during build. It can highlight problems but cannot certify storytelling.
 // Windows Node 24 spawnSync('npm.cmd') fails with EINVAL. Invoke the
 // installed TypeScript CLI via Node directly (same TypeScript compiler).
 run(process.execPath,[path.join(studioRoot,'node_modules/typescript/bin/tsc'),'--noEmit']);
 node('director-preflight','--strict');
 node('live-action-evidence','--strict');
 node('box-tests');
 node('camera-audit');
 const ready=JSON.parse(await fs.readFile(path.join(out,'EP02_FINISHING_STATUS.json'),'utf8'));
 const manifest=JSON.parse(await fs.readFile(path.join(out,'EP02_SHOT_MANIFEST.json'),'utf8'));
 py('boards');
 for(const entry of ready.outputs){
  run(python,['scripts/release_quality_gate.py',entry.file,'--series','in_this_town',
   '--expected-frames',String(manifest.durationInFrames),'--init-review',
   ...(flag('--require-approval')?['--require-approval']:[])]);
 }
 console.log('\nEP02 batch technical check complete. Read the generated EP02_CREATIVE_REVIEW.md and exact-file reports; human visual, narration and rights review are still required.');
 if(!ready.voiceApprovedForEpisode)console.warn('WARNING: This is a SILENT SCRATCH, not a publishable episode. Provide approved voice and rebuild before publication.');
}else throw Error('Usage: node scripts/produce-box.mjs review [--open] [--force] | doctor | status | build [--reprepare] [--voice WAV] [--words JSON] [--allow-scratch] | build-preview | check');
