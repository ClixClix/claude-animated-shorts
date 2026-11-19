/**
 * Offline Episode02 shot 49–52 regression after scene-only V9 rescue repair.
 * Run from studio/:
 * node src/v2/episodes/in-this-town-02/tools/rescue-continuity-test.mjs
 * No expensive render, audio API, or publishing.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import * as T from 'three';
const scene=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const studio=path.resolve(scene,'../../../..');
const out=path.join(studio,'out/v2-episodes/in-this-town-02');
await fs.mkdir(out,{recursive:true});
const dest=path.join(out,'phase4-rescue-regression-bundle.mjs');
await build({stdin:{
  contents:[
    "export {SCRATCH_EDIT,stateAt,rescueTipAngle,tippedEssieRoot,tippedEssieInterior} from './src/v2/episodes/in-this-town-02/timeline.ts';",
    "export {BOX_SPECS,createEpisodeBox} from './src/v2/episodes/in-this-town-02/boxProps.ts';",
    "export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector.ts';"
  ].join('\n'),resolveDir:studio,loader:'ts'},
  outfile:dest,bundle:true,format:'esm',platform:'node',target:'node24',
  external:['three']
});
const mod=await import(pathToFileURL(dest).href);
let checked=0;
const check=(cond,label)=>{assert.ok(cond,label);checked++;};
const cuts=new Map(mod.SCRATCH_EDIT.shots.map(x=>[x.sequence,x]));
const at=(n,u)=>{
  const sh=cuts.get(n);
  return mod.stateAt(sh.start+Math.floor((sh.end-sh.start-1)*u),mod.SCRATCH_EDIT.shots);
};
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
for(const [a,b,names] of [
  [49,50,['mocha']],[50,51,['mocha','essie']],[51,52,['mocha','essie']]
]){
 for(const cat of names){
  const prior=at(a,1)[cat],next=at(b,0)[cat];
  check(distance(prior.position,next.position)<.03,cat+' position jump '+a+'->'+b);
  check(Math.abs(prior.scale-next.scale)<.025,cat+' scale jump '+a+'->'+b);
 }
}
for(let i=0;i<=100;i++){
 const s=at(51,i/100),tip=mod.rescueTipAngle(51,s.u);
 const base=s.essieBox;
 const root=mod.tippedEssieRoot(base,tip);
 const depth=mod.BOX_SPECS.essie.depth;
 check(tip>=0&&tip<=1.46001,'tip out of physical range');
 // World-space front lip is invariant in height and horizontal position.
 const edgeY=root[1]-(depth/2)*Math.sin(tip);
 const edgeZ=root[2]+(depth/2)*Math.cos(tip);
 check(Math.abs(edgeY-base[1])<1e-8,'front lip sinks below ground');
 check(Math.abs(edgeZ-(base[2]+depth/2))<1e-8,'front lip slides across alley');
 for(const cat of ['mocha','essie']){
   check(s[cat].position.every(Number.isFinite),cat+' invalid position');
   check(s[cat].scale>=.83&&s[cat].scale<=1.001,cat+' implausible scale');
 }
}
check(at(51,1).essie.visible===true,'Essie never becomes visible');
check(distance(at(51,1).essie.position,at(51,1).mocha.position)<.5,
 'Restored cats are too far apart for embrace landing');
check(mod.rescueTipAngle(52,.55)>1.4,'tipped carton resets before reaction');
const box=mod.createEpisodeBox('essie');
const names=[];
box.root.traverse(obj=>{if(obj instanceof T.Mesh)names.push(obj.name)});
for(const side of ['front','back','left','right'])
 check(names.includes('ESSIE_BOX-'+side),'Missing rigid '+side+' wall');
box.root.updateMatrixWorld(true);
box.dispose();
const source=await fs.readFile(path.join(scene,'Episode.tsx'),'utf8');
const timeline=await fs.readFile(path.join(scene,'timeline.ts'),'utf8');
const geom=await fs.readFile(path.join(scene,'boxProps.ts'),'utf8');
check(!/setExitOpening|gateWalk/.test(source+timeline+geom),
 'Prohibited hinged walk-out rescue remains');
check(source.includes('boxes.essie.flaps.front.visible=true;'),
 'The physical rescue flap is being hidden');
check(source.includes('new EpisodeWorld(optimize)'),
 'Original style check is not wired to the scene');

const norm=v=>{const size=Math.hypot(...v)||1;return v.map(x=>x/size)};
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const project=(point,camera)=>{
 const forward=norm(minus(camera.target,camera.camera));
 const right=norm(cross(forward,[0,1,0]));
 const up=cross(right,forward);
 const delta=minus(point,camera.camera);
 const depth=dot(delta,forward);
 const tangent=Math.tan(camera.fov*Math.PI/360);
 return {x:dot(delta,right)/(depth*tangent*1080/1920),
  y:dot(delta,up)/(depth*tangent),depth};
};
const framing={};
for(const n of [49,50,51,52]){
 let maxNormalizedHorizontal=0;
 let maxNormalizedVertical=0;
 let frontOrBehindCamera=0;
 for(let j=0;j<=20;j++){
  const st=at(n,j/20),camera=mod.directEpisodeCamera(st);
  for(const id of ['mocha','essie']){
   if(!st[id].visible)continue;
   const cat=st[id];
   // Conservative source-space card rectangle; real curled art can be smaller.
   for(const x of [-.67,.67])for(const y of [-.16,1.35]){
    const pixel=project([cat.position[0]+x*cat.scale,
      cat.position[1]+y*cat.scale,cat.position[2]],camera);
    if(pixel.depth<=0){frontOrBehindCamera++;continue;}
    maxNormalizedHorizontal=Math.max(maxNormalizedHorizontal,Math.abs(pixel.x));
    maxNormalizedVertical=Math.max(maxNormalizedVertical,Math.abs(pixel.y));
   }
  }
 }
 framing[String(n)]={maxNormalizedHorizontal:+maxNormalizedHorizontal.toFixed(3),
  maxNormalizedVertical:+maxNormalizedVertical.toFixed(3),behindCamera:frontOrBehindCamera,
  warning:maxNormalizedHorizontal>.92?'DIRECT_PNG_REVIEW_REQUIRED__TIGHT_HORIZONTAL_FRAME':null};
 check(frontOrBehindCamera===0,'A lead actor is behind the rendering camera in '+n);
 check(maxNormalizedHorizontal<1.10,'Major predicted horizontal crop in '+n);
}
const framingWarnings=Object.entries(framing).filter(([,x])=>x.warning)
 .map(([shot,x])=>({shot,...x}));
const report={
 stage:'SOURCE_SPATIAL_REGRESSION_PASSED__MOVING_VISUAL_REVIEW_REQUIRED',
 checks:checked,shotRange:[49,50,51,52],framing,framingWarnings,
 evidence:'rigid box pivot, actor transition poses, scene source and grounded end',
 artisticApproved:false,musicRightsApproved:false,publishingAllowed:false,
 note:'These source-space tests cannot establish screen-visible action, camera occlusion, or animation quality.'
};
await fs.writeFile(path.join(out,'EP02_PHASE4_RESCUE_REGRESSION.json'),
 JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
