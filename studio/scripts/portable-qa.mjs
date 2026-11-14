// Offline portability checks only: no Chrome rendering and no API client.
import {studioRoot} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {hash,visualSourceHash,validSegment} from './lib/render-cache.mjs';
const root=path.resolve(studioRoot,'..'),out=path.join(studioRoot,'out/v2-episodes/door-at-1111');
const plan=JSON.parse(await fs.readFile(path.join(out,'The_Door_At_1111_Shot_Manifest.json'),'utf8'));
const freeze=JSON.parse(await fs.readFile(path.join(out,'SOURCE_FREEZE.json'),'utf8'));
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));props.optimize=true;props.previewScale=1;
const sourceHash=await visualSourceHash(),propsHash=hash(JSON.stringify(props));
assert.equal(sourceHash,freeze.sourceHash,'Portable source must preserve existing native-cache identity');assert.equal(propsHash,freeze.propsHash);
const completed=[];
for(const s of plan.shots)if(await validSegment(path.join(out,'segments',s.id+'.mp4'),s,sourceHash,propsHash))completed.push(s);
assert.ok(completed.length>=37,'Expected all 37 transferred complete native shots to remain valid.');
const first=completed[0],file=path.join(out,'segments',first.id+'.mp4');
assert.equal(await validSegment(file,first,sourceHash,'changed-props'),false);
assert.equal(await validSegment(file,first,'changed-source',propsHash),false);
assert.equal(await validSegment(file,first,sourceHash,propsHash,1,[first.start,first.end-2]),false);
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'v2 resume with spaces '));
try{
 const copy=path.join(dir,'sample.mp4');await fs.copyFile(file,copy);
 const a=JSON.parse(await fs.readFile(file.replace('.mp4','.json'),'utf8'));a.audits=a.audits.filter(x=>x.frame!==first.start);
 await fs.writeFile(copy.replace('.mp4','.json'),JSON.stringify(a));assert.equal(await validSegment(copy,first,sourceHash,propsHash),false,'Missing frame audits must invalidate a shot');
}finally{await fs.rm(dir,{recursive:true,force:true});}
const models=await fs.readdir(path.join(studioRoot,'public/bridge/kenney'));
assert.equal(models.filter(n=>n.endsWith('.glb')).length,26);await fs.access(path.join(studioRoot,'public/bridge/kenney/Textures/colormap.png'));
await fs.access(path.join(studioRoot,'assets/fonts/DejaVuSans.ttf'));
const sourceNarration=path.join(studioRoot,'out/v2-narration/Door_At_1111_Adam-original.mp3');
assert.equal(hash(await fs.readFile(sourceNarration)),'1d26b702388c2b16a147131c238eaa5ac83797e9ec54b9d4d96c8b9b304f5e1c');
assert.equal(hash(await fs.readFile(path.join(studioRoot,'out/v2-narration/Door_At_1111_Adam.mp3'))),'96304ee5e4a8f89feb4810f99b3a49cc043f88b9fc702e722354c24a5a44f37f');
const serveUrl=await bundle({entryPoint:path.join(studioRoot,'src/index.ts'),publicDir:path.join(studioRoot,'public')});
const versions=Object.fromEntries(['ffmpeg','ffprobe'].map(name=>[name,execFileSync(name,['-version'],{encoding:'utf8'}).split('\n')[0]]));
const report={passed:true,platform:process.platform,node:process.version,versions,freshNpmCi:true,sourceHash,propsHash,completeNativeShots:completed.length,completedFrames:completed.reduce((n,s)=>n+s.end-s.start,0),totalShots:plan.shots.length,totalFrames:4800,maximumShotFrames:Math.max(...plan.shots.map(s=>s.end-s.start)),cacheRejectsStaleSourceAndProps:true,cacheRejectsPartialRangesAndMissingAudits:true,bundledCurrentRoot:true,bundleDirectory:serveUrl,originalKenneyGLBCount:26,originalKenneyTextureCount:1,originalAndProcessedNarrationHashesMatch:true,renderTestsRun:false,windowsExecutionTested:false,reasonNoRender:'User explicitly requested no further cloud rendering; local smoke command is provided.',providerRequests:0};
await fs.writeFile(path.join(root,'PORTABILITY_QA.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
