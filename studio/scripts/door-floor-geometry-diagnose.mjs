// Narrow, local-only floor geometry A/B: baseline vs. no static batching vs. no city sidewalk.
// Do not alter finished video, song, narrator, or paid caches.
import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const out=path.resolve('out/v2-episodes/door-at-1111-polish');
function run(cmd,args){
 const result=spawnSync(cmd,args,{cwd:process.cwd(),stdio:'inherit',windowsHide:false});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error(cmd+' exited with code '+result.status);
}
run(process.execPath,['scripts/door-polish-prepare.mjs']);
const variants=[
 {name:'baseline',mode:null,dir:'motion'},
 {name:'no-batching',mode:'no-batching',dir:'floor-diagnostic/no-batching'},
 {name:'no-sidewalk',mode:'no-sidewalk',dir:'floor-diagnostic/no-sidewalk'},
];
const files=[],rows=[];
for(const v of variants){
 console.log('Floor geometry test: '+v.name);
 const args=['scripts/door-polish-render.mjs','motion','--shots','04','--force'];
 if(v.mode)args.push('--floor-debug',v.mode);
 run(process.execPath,args);
 const file=path.join(out,v.dir,'04.mp4');
 const evidence=JSON.parse(await fs.readFile(file.replace(/\.mp4$/,'.json'),'utf8'));
 const audit=evidence.audits?.find(x=>Array.isArray(x.floorRay));
 if(!audit)throw Error('Missing visible-mesh ray evidence for '+v.name);
 files.push(file);
 rows.push({variant:v.name,sourceHash:evidence.sourceHash,frame:audit.frame,pixels:audit.floorRay,file});
}
const comparison=path.join(out,'Floor_Geometry_04_3way.mp4');
run('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-y',...files.flatMap(p=>['-i',p]),'-filter_complex','[0:v][1:v][2:v]hstack=inputs=3[v]','-map','[v]','-an','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',comparison]);
const evidencePath=path.join(out,'Floor_Geometry_04_Hits.json');
await fs.writeFile(evidencePath,JSON.stringify({variants:variants.map(v=>v.name),comparison,rows,comment:'Ray hits filtered to visible meshes on active camera layers; original layer-7 source meshes excluded.'},null,2)+'\n');
console.log('Geometry diagnosis complete: baseline | no-batching | no-sidewalk');
console.log('Comparison: '+comparison);
console.log('Visible-mesh evidence: '+evidencePath);
console.log('Upload both to ChatGPT for a targeted permanent fix.');
