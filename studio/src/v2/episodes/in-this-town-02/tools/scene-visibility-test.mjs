/** Real mesh/ray regression only. No WebGL, browser, image/video or paid audio. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import * as T from 'three';
const here=path.dirname(fileURLToPath(import.meta.url)),studio=path.resolve(here,'../../../../..');
const out=path.join(studio,'out/v2-episodes/in-this-town-02/story-visibility-review');await fs.mkdir(out,{recursive:true});
// Canvas drawing is deliberately stubbed: only actual constructed 3D geometry
// is tested. No new visual evidence or native-pixel approval is manufactured.
globalThis.document={createElement(){const canvas={width:1,height:1};const ctx=new Proxy({canvas},{get(o,k){if(k in o)return o[k];if(String(k).includes('Gradient'))return ()=>({addColorStop(){}});if(k==='measureText')return ()=>({width:100});if(k==='createPattern')return ()=>({setTransform(){}});return ()=>{};}});canvas.getContext=()=>ctx;return canvas;}};
const file=path.join(out,'geometry-qa-bundle.mjs');
await build({stdin:{resolveDir:studio,loader:'ts',contents:[
 "export {EpisodeWorld} from './src/v2/episodes/door-at-1111-polish/world';",
 "export {stateAt as ep1State,DRAFT_SHOTS} from './src/v2/episodes/door-at-1111-polish/timeline';",
 "export {stateAt} from './src/v2/episodes/in-this-town-02/timeline';",
 "export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector';",
 "export {createEpisodeBox,BOX_SPECS} from './src/v2/episodes/in-this-town-02/boxProps';",
 "export {stageEpisodeBox,demoIdentity} from './src/v2/episodes/in-this-town-02/boxStaging';",
 "export {stageEpisodeWorld} from './src/v2/episodes/in-this-town-02/worldStaging';",
 "export {createDirectedSet} from './src/v2/episodes/in-this-town-02/directedSet';",
 ].join('\n')},outfile:file,bundle:true,platform:'node',format:'esm',external:['three']});
const m=await import(pathToFileURL(file).href);
const props=JSON.parse(await fs.readFile(path.join(studio,'out/v2-episodes/in-this-town-02/render-props.json'),'utf8'));
const world=new m.EpisodeWorld(false);world.update(m.ep1State(0,m.DRAFT_SHOTS));
for(const name of ['chased-mouse','home-blanket','blanket','fresh-water-bowl','last-bus','latte-hiding-box','welcome-sign','alley-motion','opening-setting-sun','rain-outside-only','door-open-plaque','episode-clock','city-clock-tower','backup-lantern','home-cat-tower'])world.root.getObjectByName(name)?.traverse(o=>o.visible=false);
const set=m.createDirectedSet(),boxes=Object.fromEntries(['latte','essie','shared','demo','lesson'].map(k=>[k,m.createEpisodeBox(k)]));
const roots=[world.root,set.root,...Object.values(boxes).map(b=>b.root)];
const failures=[],samples=[];let checks=0;
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
function meshes(){const list=[];for(const root of roots)root.traverse(o=>{if(o instanceof T.Mesh&&!o.isInstancedMesh&&visible(o)){const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.some(mat=>mat.visible&&(!mat.transparent||mat.opacity>=.98)))list.push(o);}});return list;}
function blocked(a,b,list){const delta=b.clone().sub(a),length=delta.length(),ray=new T.Raycaster(a,delta.normalize(),.08,length-.035);ray.layers.enableAll();const hit=ray.intersectObjects(list,false)[0];return hit?{object:hit.object.name,parent:hit.object.parent?.name,distance:+hit.distance.toFixed(3)}:null;}
function stage(s){
 const n=s.story?.displayBeat??s.shot.sequence;m.stageEpisodeWorld(world,s,n);set.update(s);
 boxes.demo.root.visible=boxes.lesson.root.visible=false;
 for(const k of ['latte','essie','shared','demo'])m.stageEpisodeBox(boxes[k==='demo'?m.demoIdentity(s):k],k,s,n);
 roots.forEach(r=>r.updateMatrixWorld(true));return meshes();
}
const wanted=[4,5,6,7,8,9,12,16,17,19,20,21,22,23,24,28,29,32,35,36,37,38,39,40,41,42,45,46,47,48,49,50,51,52,53,54,55,57,58,59,60];
for(const shot of props.shots.filter(s=>wanted.includes(s.sequence))){
 for(const u of [0,.25,.5,.75,1]){
  const frame=shot.start+Math.round((shot.end-shot.start-1)*u),s=m.stateAt(frame,props.shots,props.captions),c=m.directEpisodeCamera(s),list=stage(s),camera=new T.PerspectiveCamera(c.fov,9/16,.08,320);camera.position.set(...c.camera);camera.lookAt(...c.target);camera.updateMatrixWorld(true);
  const n=s.shot.sequence;
  for(const id of ['mocha','essie','latte']){
   const actor=s[id];if(!actor.visible||actor.morph>.7)continue;
   // A distant observer is intentionally outside the lens in 31/34; not in this queue.
   // Ears-only closeup in 50 is checked at the revealed ear level.
   const heights=id==='essie'&&n===50&&s.story.ears<.55?[1.22]:[.78,1.10];
   const probes=heights.map(y=>({y,x:0}));
   if([22,23].includes(n))for(const y of [.10,.40])for(const x of [-.18,0,.18])probes.push({y,x});
   const right=new T.Vector3(camera.position.z-actor.position[2],0,-(camera.position.x-actor.position[0])).normalize();
   const rays=probes.map(({y,x})=>{const p=new T.Vector3(actor.position[0],actor.position[1]+y,actor.position[2]).addScaledVector(right,x),screen=p.clone().project(camera);const hit=blocked(camera.position,p,list);return {y,x,screen:screen.toArray().map(x=>+x.toFixed(3)),hit};});
   checks+=rays.length;
   const leaving=n===7&&id==='mocha'&&s.u>.88;
   const bad=rays.filter(r=>r.hit||(!leaving&&(Math.abs(r.screen[0])>1||Math.abs(r.screen[1])>1||r.screen[2]>1)));
   samples.push({shot:shot.id,frame,id,rays});if(bad.length)failures.push({shot:shot.id,frame,id,rays:bad});
  }
 }
}
// Negative control: the rejected shot55 camera was behind the opaque facade.
const shot55=props.shots.find(s=>s.sequence===55),s55=m.stateAt(Math.round((shot55.start+shot55.end)/2),props.shots,props.captions);
const list=stage(s55),knownBad=blocked(new T.Vector3(-1.9,1.5,5.65),new T.Vector3(...s55.latte.position).add(new T.Vector3(0,.9,0)),list);checks++;
if(!knownBad)failures.push({id:'NEGATIVE_CONTROL_FAILED_TO_CATCH_OLD_FACADE'});
const report={stage:failures.length?'NUMERICAL_VISIBILITY_FAILED':'NUMERICAL_VISIBILITY_PASSED__LOCAL_PNG_REVIEW_PENDING',checks,failures,samples,knownBadCameraHit:knownBad,visualApproval:false,method:'Actual Three.js world and hero box geometry; no renderer; canvas painting stubbed; face rays plus torso/paw rays in full-bed views. Not painted-silhouette or motion approval.'};
await fs.writeFile(path.join(out,'SCENE_VISIBILITY_QA.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage:report.stage,checks,failures:failures.slice(0,16),totalFailures:failures.length,knownBadCameraHit:knownBad},null,2));
set.dispose();Object.values(boxes).forEach(b=>b.dispose());world.dispose();
if(failures.length)process.exitCode=1;
