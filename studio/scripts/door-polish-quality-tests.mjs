import './lib/runtime.mjs';
import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {criticalShots,qualityErrors} from './lib/polish-quality.mjs';
const out=path.resolve('out/v2-episodes/door-at-1111-polish');
await build({stdin:{contents:"export * from './timeline';export {anatomicalHips,legCorners} from './walkingLegs';export * from './cityConfig';",resolveDir:path.resolve('src/v2/episodes/door-at-1111-polish'),loader:'ts'},outfile:path.join(out,'quality-tools.mjs'),bundle:true,platform:'node',format:'esm'});
const t=await import(pathToFileURL(path.join(out,'quality-tools.mjs')).href),{shots}=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
let checks=0,maxShear=0,maxHipX=0;
const check=(v,m)=>{assert.ok(v,m);checks++;};
const clean={frame:1,sourceShot:31,openerVisible:false,kittenVisible:false,earlyInteriorVisible:false,cameraHits:[],visibility:[{id:'latte',inFrame:true,occluder:null}]};
check(qualityErrors([clean]).length===0,'Clean local sample rejected');
// Regression: the apron and sidewalk used to occupy the same Y=.03 surface.
const cafeSource=await fs.readFile('src/v2/cafe/environment.ts','utf8');
const episodeWorldSource=await fs.readFile('src/v2/episodes/door-at-1111-polish/world.ts','utf8');
check(cafeSource.includes("apron.name='cafe-entry-apron'"),'Standalone café entrance apron lost its stable identifier');
check(episodeWorldSource.includes("cafeApron.removeFromParent();"),'Episode has reintroduced the overlapping café apron');
const constructorSequence=episodeWorldSource.slice(episodeWorldSource.indexOf('constructor(optimize=true)'),episodeWorldSource.indexOf('private prepareRainRoofs()'));
check(constructorSequence.includes('this.cityBlocks()')&&constructorSequence.indexOf('this.cityBlocks()')<constructorSequence.indexOf('batchCafe(this.cafe.root,this.door)'), 'City world setup and apron deduplication must run BEFORE static geometry batching');

for(const mutation of [{earlyInteriorVisible:true},{openerVisible:true},{kittenVisible:true},{cameraHits:['wall']},{visibility:[{id:'latte',inFrame:false}]},{visibility:[{id:'kitten',inFrame:true,occluder:'doorframe'}]}])check(qualityErrors([{...clean,...mutation}]).length>0,'Broken actual-frame audit accepted');
check(['01A','22','44','56','60C'].every(id=>criticalShots.includes(id)),'Critical review order omits a known failed beat');
check(t.CITY_BUILDINGS.length>=65,'City must have several connected districts');
check(new Set(t.CITY_BUILDINGS.map(b=>b.id)).size===t.CITY_BUILDINGS.length,'Duplicate city IDs');
check(t.CITY_BACKDROP.length>=500&&new Set(t.CITY_BACKDROP.map(b=>b.id)).size===t.CITY_BACKDROP.length,'Skyline must cover the distant city with stable IDs');
for(const x of [-1,1])for(const z of [-1,1])check(t.CITY_BACKDROP.some(b=>Math.sign(b.position[0])===x&&Math.sign(b.position[2])===z&&Math.abs(b.position[2])>140),'Empty city horizon quadrant');
// A lamp must belong to a curb row, outside every carriageway and clear of the porch.
for(const [z,count] of [[6.05,5],[11.95,4]]){
 const row=t.STREETLIGHTS.filter(p=>Math.abs(p[2]-z)<.001).sort((a,b)=>a[0]-b[0]);
 check(row.length===count,'Streetlamp row has wrong count');
 row.forEach((p,i)=>{
  if(i)check(Math.abs(p[0]-row[i-1][0]-6)<1e-9,'Streetlamps have irregular spacing');
  check(p[1]===.03,'Lamp base does not rest on pavement');
  for(const road of [...t.CITY_ROADS,{position:[0,0,8.975],size:[120,.06,5.3]}])check(!(Math.abs(p[0]-road.position[0])<road.size[0]/2+.18&&Math.abs(p[2]-road.position[2])<road.size[2]/2+.18),'Streetlamp is in a carriageway or junction');
  check(!(p[0]>2.1&&p[0]<4.2&&p[2]>11.2&&p[2]<12.4),'Streetlamp obstructs Latte porch');
 });
}
for(const b of t.CITY_BUILDINGS){
 check(b.height>5&&b.floors>=3,'Incomplete building silhouette');
 for(const r of t.CITY_ROADS)check(!(Math.abs(b.position[0]-r.position[0])<(b.width+r.size[0])/2&&Math.abs(b.position[2]-r.position[2])<(b.depth+r.size[2])/2),'Building sits in road: '+b.id+' / '+r.id);
}
for(let frame=0;frame<shots.at(-1).end;frame++){
 const s=t.stateAt(frame,shots);
 for(const id of ['latte','mocha','essie']){
  const a=s[id];if(!a.moving||!s.required.includes(id))continue;
  const hips=t.anatomicalHips(a);
  for(let i=0;i<4;i++){
   const foot=a.feet[i],hip=hips[i],corners=t.legCorners(hip,foot,s.camera),bottom=corners[0].map((v,j)=>(v+corners[1][j])/2),top=corners[2].map((v,j)=>(v+corners[3][j])/2);
   const sample=u=>bottom.map((v,j)=>v+(top[j]-v)*u);
   check(t.distance(sample(10/256),foot)<1e-9,'Toe is not at its actual world anchor');
   check(t.distance(sample(236/256),hip)<1e-9,'Hip is not attached to its actual world anchor');
   check(corners.flat().every(Number.isFinite),'Invalid leg geometry');
   check(hip[1]>foot[1],'Visible leg inverted');
   const reach=Math.hypot(hip[0]-foot[0],hip[2]-foot[2]);maxShear=Math.max(maxShear,reach);maxHipX=Math.max(maxHipX,Math.hypot(hip[0]-a.position[0],hip[2]-a.position[2]));
   check(reach<.34,'Excessive visible limb reach '+JSON.stringify({frame,shot:s.shot.id,id,reach}));
  }
 }
}
const report={checks,buildings:t.CITY_BUILDINGS.length,maximumHorizontalReach:maxShear,hipRadius:maxHipX,actualMotionApproval:'Requires actual local samples'};await fs.writeFile(path.join(out,'RIG_AND_CITY_QA.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
