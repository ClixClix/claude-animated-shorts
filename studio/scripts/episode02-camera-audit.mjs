import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

/** Offline camera review. Runs only during the single deferred batch QA.
 * This is a spatial test; full rendered frames and creative review remain essential.
 */
const out=path.resolve('out/v2-episodes/in-this-town-02');
await fs.mkdir(out,{recursive:true});
const bundle=path.join(out,'EP02_CAMERA_AUDIT.bundle.mjs');
await build({stdin:{
 contents:[
  "export {SCRATCH_EDIT,stateAt} from './src/v2/episodes/in-this-town-02/timeline.ts';",
  "export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector.ts';"
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'
 },outfile:bundle,bundle:true,platform:'node',format:'esm',target:'node24',external:['three']});
const {SCRATCH_EDIT,stateAt,directEpisodeCamera}=await import(pathToFileURL(bundle).href);
const shots=SCRATCH_EDIT.shots;
const issues=[],samples=[];
for(const shot of shots){
 const frames=[shot.start,Math.floor((shot.start+shot.end)/2),shot.end-1];
 for(const frame of frames){
  const s=stateAt(frame,shots),c=directEpisodeCamera(s);
  const p=c.framing;
  const item={shot:shot.id,frame,region:c.region,camera:c.camera,target:c.target,
    fov:c.fov,screenHalfExtentX:p.x,screenHalfExtentY:p.y,behind:p.behind};
  samples.push(item);
  if(p.behind||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x>.84||p.y>.81)
   issues.push({...item,problem:'Unsafe portrait crop / camera behind tracked subject'});
  if(['latte','essie','group','shared'].includes(c.region)&&
    (Math.abs(c.camera[0])>3.55||c.camera[2]<-3.77||c.camera[2]>3.78))
   issues.push({...item,problem:'Camera beyond cafe solid wall'});
  if(c.region==='alley'&&c.camera[0]>-8.3&&c.camera[2]>-3.9&&c.camera[2]<4.15)
   issues.push({...item,problem:'Camera intersecting west-side shop'});
 }
}
const result={shots:shots.length,samples:samples.length,issues,passed:issues.length===0,
 note:'Source-space checks only; camera/box occlusion and art quality require full native rendered visual review.'};
await fs.writeFile(path.join(out,'EP02_CAMERA_AUDIT.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({shots:result.shots,samples:result.samples,issues:issues.length,passed:result.passed},null,2));
if(issues.length)process.exitCode=1;
