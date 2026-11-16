import {studioRoot,renderConcurrency} from './lib/runtime.mjs';
import path from 'node:path';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const stage=(process.argv[2]??'preview').toLowerCase(),c=renderConcurrency();
const python=process.env.V2_PYTHON||path.join(studioRoot,'..','.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
function run(program,args){const r=spawnSync(program,args,{stdio:'inherit',cwd:studioRoot});if(r.error)throw r.error;if(r.status!==0)throw Error('Polish stage failed: '+args.join(' ')+'. Original finished movies are preserved.');}
const node=(name,...args)=>run(process.execPath,['scripts/door-polish-'+name+'.mjs',...args]);
const py=(name,...args)=>run(python,['scripts/door-polish-'+name+'.py',...args]);
if(!['preview','all','qa'].includes(stage))throw Error('Use preview, all or qa.');
if(stage!=='qa')node('prepare');
if(stage!=='qa'&&!process.argv.includes('--skip-checks')){node('tests');node('story-tests');node('leg-tests');node('quality-tests');node('card-tests');}
if(stage==='preview'){
 node('render','motion','--concurrency',String(c));
 node('preview-assemble');
 console.log('Review the complete 540x960 movie with continuous narration: out/v2-episodes/door-at-1111-polish/Polish_Narrated_Review_540p.mp4');
 const review=JSON.parse(readFileSync(path.join(studioRoot,'out/v2-episodes/door-at-1111-polish/PREVIEW_QA.json'),'utf8'));console.log('CURRENT VERSION: '+review.file);if(process.platform==='win32')spawnSync('explorer.exe',['/select,',review.file]);
}else{
 if(stage==='all'){py('sfx');node('render','render','--concurrency',String(c));node('assemble');node('finish');}
 py('video-qa');py('boards');py('motion-boards','--native');node('reports');
 // Shared final-MP4 release gate: technical evidence only, never auto-approve rights or creative quality.
 const manifest=JSON.parse(readFileSync(path.join(studioRoot,'out/v2-episodes/door-at-1111-polish/The_Door_At_1111_Polish_Shot_Manifest.json'),'utf8'));
 for(const label of ['With_Music','No_Music']){
  const movie=path.join(studioRoot,'out/v2-episodes/door-at-1111-polish',`The_Door_At_1111_Polish_Final_${label}.mp4`);
  run(python,['scripts/release_quality_gate.py',movie,'--series','in_this_town','--expected-frames',String(manifest.durationInFrames)]);
 }
}
