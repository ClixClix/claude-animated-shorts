import {studioRoot} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const mode=(process.argv[2]??'status').toLowerCase();
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
const audioArgs=[];
if(arg('--licensed-music'))audioArgs.push('--licensed-music',arg('--licensed-music'));
if(flag('--music-rights-confirmed'))audioArgs.push('--music-rights-confirmed');
if(mode==='status'){
 for(const file of ['EP02_SHOT_MANIFEST.json','PRODUCTION_READINESS.json',
  'FINAL_RENDER_STATUS.json','VISUAL_ASSEMBLY.json','EP02_FINISHING_STATUS.json']){
  const p=path.join(out,file);console.log(file+': '+(await fs.access(p).then(()=>true,()=>false)?'exists':'not yet created'));
 }
 console.log('No rendering or paid requests during status.');
}else if(mode==='build'||mode==='build-preview'){
 // Build all source/scene/audio stages in one sequence. NO typecheck/QA/contact sheet
 // is run here: the user requested a single combined review AFTER full assembly.
 node('prepare',...prepareArgs);
 // Exactly as Episode01's polish workflow: block production when code,
 // cat continuity or floor/camera geometry gates have not passed.
 run(process.platform==='win32'?'npm.cmd':'npm',['run','typecheck']);
 node('adam-edit-test');
 node('style-preflight');
 node('box-tests');
 node('finale-audit');
 node('camera-audit');
 py('audio');
 node('render',mode==='build'?'render':'preview');
 node('assemble',mode==='build'?'render':'preview');
 node('finish',...(mode==='build-preview'?['--preview']:[]),...audioArgs);
 console.log('All Episode 02 stages assembled. NO QA has been executed. Run: node scripts/produce-box.mjs check');
}else if(mode==='check'){
 // THE ONE BATCH REVIEW GATE. This is intentionally opt-in and never runs
 // during build. It can highlight problems but cannot certify storytelling.
 run(process.platform==='win32'?'npm.cmd':'npm',['run','typecheck']);
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
}else throw Error('Usage: node scripts/produce-box.mjs status | build [--voice WAV] [--words JSON] [--allow-scratch] | build-preview | check');
