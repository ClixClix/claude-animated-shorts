/**
 * Episode 02 full-timeline camera / occlusion preflight.
 *
 * Uses actual scene actor/camera state, measured city building dimensions,
 * permanent cafe fixture data, and the original streetlight coordinates.
 * A ray through a bounds proxy indicates a possible obstruction; only
 * freshly rendered footage can confirm the appearance.
 *
 * This is a REPORT, not an artistic pass or full mesh raycast.
 */
import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const out=path.resolve('out/v2-episodes/in-this-town-02');
await fs.mkdir(out,{recursive:true});
const bundle=path.join(out,'EP02_CAMERA_BLOCKER_AUDIT.bundle.mjs');
await build({
 stdin:{resolveDir:process.cwd(),loader:'ts',contents:[
  "export {SCRATCH_EDIT,stateAt} from './src/v2/episodes/in-this-town-02/timeline.ts';",
  "export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector.ts';",
  "export {CITY_BUILDINGS} from './src/v2/episodes/door-at-1111-polish/cityConfig.ts';",
  "export {STREETLIGHTS} from './src/v2/episodes/door-at-1111-polish/timeline.ts';",
  "export {FIXTURES} from './src/v2/cafe/config.ts';"
 ].join('\n')},
 outfile:bundle,bundle:true,platform:'node',format:'esm',target:'node24',external:['three']
});
const {SCRATCH_EDIT,stateAt,directEpisodeCamera,CITY_BUILDINGS,STREETLIGHTS,FIXTURES}=
 await import(pathToFileURL(bundle).href);

// Slab intersection against an actual project's axis-aligned bounds.
function segmentHit(a,b,o){
 let t0=0,t1=1;
 for(let k=0;k<3;k++){
  const min=o.center[k]-o.half[k],max=o.center[k]+o.half[k];
  const d=b[k]-a[k];
  if(Math.abs(d)<1e-8){if(a[k]<min||a[k]>max)return null;continue;}
  let lo=(min-a[k])/d,hi=(max-a[k])/d;
  if(lo>hi)[lo,hi]=[hi,lo];
  t0=Math.max(t0,lo);t1=Math.min(t1,hi);
  if(t1<t0)return null;
 }
 return t0<.97?t0:null;
}
const buildings=CITY_BUILDINGS.map(b=>({
 name:b.id,kind:'city-building',
 center:[b.position[0],b.height/2,b.position[2]],
 half:[b.width/2,b.height/2,b.depth/2]
}));
const fixtures=FIXTURES.filter(f=>f.size.every(x=>x>0)).map(f=>({
 name:f.id,kind:'cafe-fixture',
 center:f.position,half:f.size.map(x=>x/2)
}));
const streetlights=STREETLIGHTS.map((p,i)=>({
 name:'streetlight-'+(i+1),kind:'streetlight-pole',
 center:[p[0],1.6,p[2]],half:[.16,1.6,.16]
}));
const objects=[...buildings,...fixtures,...streetlights];
const shots=SCRATCH_EDIT.shots;
const frames=[...new Set(shots.flatMap(q=>{
 const sampled=[];
 for(let f=q.start;f<q.end;f+=9)sampled.push(f);
 sampled.push(q.end-1);
 return sampled;
}))].sort((a,b)=>a-b);
const issues=[],byShot={};
for(const frame of frames){
 const s=stateAt(frame,shots),c=directEpisodeCamera(s),cam=c.camera,n=s.shot.sequence;
 const actors=[['mocha',s.mocha],['essie',s.essie],['latte',s.latte],['demoCat',s.demoCat]]
  .filter(([,a])=>a.visible&&a.morph<.92);
 const boxSpecs=[
  ['latte',s.show.latte,s.latteBox],
  ['essie',s.show.essie,s.essieBox],
  ['shared',s.show.shared,s.sharedBox],
  ['demo',s.show.demo,s.demoBox]
 ];
 const focus=[...actors.map(([id,a])=>({id,target:[a.position[0],a.position[1]+.65*a.scale,a.position[2]]})),
  ...boxSpecs.filter(([,visible])=>visible).map(([id,,p])=>({id:id+'-box',target:[p[0],p[1]+.23,p[2]]}))];
 const actorOcclusionCandidates=[];
 for(const item of focus){
  for(const object of objects){
   // The cafe is an interior. City buildings are not interior set blockers;
   // exterior city objects cannot affect fully enclosed indoor framing.
   if(['latte','essie','group','shared'].includes(c.region)&&object.kind!=='cafe-fixture')continue;
   if(!['latte','essie','group','shared'].includes(c.region)&&object.kind==='cafe-fixture')continue;
   // Avoid evaluating the large fixture list for very distant targets.
   const dx=object.center[0]-cam[0],dz=object.center[2]-cam[2];
   if(Math.hypot(dx,dz)>45)continue;
   const t=segmentHit(cam,item.target,object);
   if(t!==null)actorOcclusionCandidates.push({actor:item.id,blocker:object.name,kind:object.kind,t:Number(t.toFixed(3))});
  }
 }
 const p=c.framing,unsafe=p.behind||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x>.90||p.y>.90;
 if(unsafe||actorOcclusionCandidates.length){
  const issue={shot:s.shot.id,frame,timeSeconds:Number((frame/30).toFixed(2)),
   kind:unsafe?'POSSIBLE_CROP_OR_BEHIND':'POSSIBLE_BLOCKED_CAMERA',
   xExtent:p.x,yExtent:p.y,behind:p.behind,
   camera:cam,target:c.target,
   blockers:actorOcclusionCandidates.slice(0,8)};
  issues.push(issue);byShot[s.shot.id]=(byShot[s.shot.id]??0)+1;
 }
}
const report={
 stage:'SOURCE_GEOMETRY_DIAGNOSTIC_REQUIRES_VISUAL_CONFIRMATION',
 source:'Episode02 actual timeline, cameraDirector, CITY_BUILDINGS, FIXTURES, STREETLIGHTS',
 shots:shots.length,framesSampled:frames.length,
 potentialIssueFrames:issues.length,affectedShots:Object.keys(byShot),
 countsByShot:byShot,issues:issues.slice(0,500),
 truncated:issues.length>500,
 referenceFrameReviewRequired:true,creativeApproved:false,
 noMediaApiCalls:true,
 note:'Potential occlusion uses conservative axis-aligned bounds, not real rendered pixel/mask or actual mesh-ray intersection. A zero count is not a cinematic approval. Inspect the full 60-shot MP4.'
};
const file=path.join(out,'EP02_ALL_SHOTS_CAMERA_BLOCKER_AUDIT.json');
await fs.writeFile(file,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage:report.stage,shots:report.shots,
 framesSampled:report.framesSampled,possibleOcclusionFrames:report.potentialIssueFrames,
 affectedShots:report.affectedShots,report:file},null,2));
