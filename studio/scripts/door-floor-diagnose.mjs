// Short, offline differential diagnosis for the entrance artifact in shot 04.
// Never synthesizes narration, changes the approved movie, or deletes render caches.
import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const out=path.resolve('out/v2-episodes/door-at-1111-polish');
function run(command,args){
 const proc=spawnSync(command,args,{cwd:process.cwd(),stdio:'inherit',windowsHide:false});
 if(proc.error)throw proc.error;
 if(proc.status!==0)throw Error(command+' failed with code '+proc.status);
}
console.log('Preparing existing episode edit (no narration generation)...');
run(process.execPath,['scripts/door-polish-prepare.mjs']);
const modes=[null,'no-ink','flat-floor','no-ground-shadows'],files=[],report=[];
for(const mode of modes){
 console.log('Rendering 04 floor diagnostic: '+(mode??'baseline'));
 const args=['scripts/door-polish-render.mjs','motion','--shots','04','--force'];
 if(mode)args.push('--floor-debug',mode);
 run(process.execPath,args);
 const dir=mode?path.join(out,'floor-diagnostic',mode):path.join(out,'motion');
 const file=path.join(dir,'04.mp4');
 const qa=JSON.parse(await fs.readFile(path.join(dir,'04.json'),'utf8'));
 const frameAudit=qa.audits?.find(a=>Array.isArray(a.floorRay));
 report.push({mode:mode??'baseline',sourceHash:qa.sourceHash,propsHash:qa.propsHash,frame:frameAudit?.frame??null,pixels:frameAudit?.floorRay??[],file});
 files.push(file);
}
const combined=path.join(out,'Floor_Diagnostic_04_4way.mp4');
const inputs=files.flatMap(file=>['-i',file]);
run('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-y',...inputs,'-filter_complex','[0:v][1:v][2:v][3:v]hstack=inputs=4[v]','-map','[v]','-an','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',combined]);
const reportFile=path.join(out,'Floor_Diagnostic_04_Hits.json');
await fs.writeFile(reportFile,JSON.stringify({columnOrder:['baseline','no-ink','flat-floor','no-ground-shadows'],rows:report,comparison:combined,goal:'Find actual visible surface and isolate outline, texture or shadow issue'},null,2)+'\n');
console.log('\nDiagnosis completed. FOUR columns left-to-right: baseline | no ink | flat cafe floor | no ground shadows');
console.log('Comparison movie: '+combined);
console.log('Raycaster evidence: '+reportFile);
console.log('Upload both files to ChatGPT before any new production geometry edits.');
