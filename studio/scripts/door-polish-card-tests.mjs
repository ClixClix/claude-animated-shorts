import {browserExecutable,chromiumOptions} from './lib/runtime.mjs';
import {build} from 'esbuild';
import {openBrowser} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
// Offscreen Canvas API/determinism test only: no WebGL scene, still, or video render.
const props=JSON.parse(await fs.readFile('src/v2/episodes/door-at-1111-polish/edit.json','utf8'));
const source=await build({stdin:{contents:`
import {createEpisodeCat} from './actors';
import {stateAt} from './timeline';
import * as T from 'three';
import {EpisodeWorld} from './world';
import {checkEpisodeCamera} from './cameraQA';
import {TownPopulation} from './population';
import {createKitten} from '../../animation/kitten';
import {storyAt} from '../../animation/timeline';
export function run(props){
 const frames=['21','22','30','44','53','60C'].map(id=>{const s=props.shots.find(s=>s.id===id);return s.start+Math.floor((s.end-s.start)*.6);});let checks=0;const issues={};
 const check=(v,m)=>{if(!v)throw Error(m);checks++;};
 const hash=bytes=>{let h=2166136261;for(const n of bytes)h=Math.imul(h^n,16777619);return h>>>0;};
 for(const id of ['latte','mocha','essie']){
  const card=createEpisodeCat(id),saved=new Map();
  for(const frame of [...frames,...frames.toReversed()]){
   const s=stateAt(frame,props.shots),a=s[id];card.updateActor(a,s);
   const cv=card.texture.image,bytes=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
   check(bytes.some((v,i)=>i%4===3&&v>200),'Blank approved body drawing');
   const digest=hash(bytes);if(saved.has(frame))check(saved.get(frame)===digest,'Drawing depends on frame order: '+id+' frame '+frame+' old '+saved.get(frame)+' new '+digest);else saved.set(frame,digest);
   check(card.legs.visible===a.moving,'Walking leg visibility disagrees with pose');
   check(card.legs.children.filter(o=>o.name.startsWith(id+'-leg-')).length===4,'Missing walking leg');
   card.legs.traverse(o=>{if(o.isMesh){const p=o.geometry.getAttribute('position');check([...p.array].every(Number.isFinite),'Non-finite rig vertex');}});
  }
  card.dispose();
 }
 const world=new EpisodeWorld(false),latte=createEpisodeCat('latte'),shot=props.shots.find(s=>s.id==='46'),camera=new T.PerspectiveCamera(70,1080/1920,.08,220);
 for(let frame=shot.start;frame<shot.end;frame++){const s=stateAt(frame,props.shots);latte.updateActor(s.latte,s);latte.mesh.updateMatrixWorld(true);camera.position.set(...s.camera);camera.fov=s.fov;camera.lookAt(...s.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);world.update(s);const a=checkEpisodeCamera(world,s,camera,[{id:'latte',mesh:latte.mesh}]);check(a.visibility.every(v=>v.inFrame&&!v.occluder),'Kitten reveal blocked at '+frame+' '+JSON.stringify(a.visibility));}
 const population=new TownPopulation(),cast=['latte','mocha','essie'].map(id=>({id,card:createEpisodeCat(id)})),kitten=createKitten();
 for(let frame=0;frame<props.shots.at(-1).end;frame++){
  const s=stateAt(frame,props.shots);population.update(s);population.root.updateMatrixWorld(true);
  for(const actor of population.actors){
   const mesh=actor.mesh,p=mesh.position,inside=Math.abs(p.x)<3.75&&p.z>-3.8&&p.z<3.8;
   if(mesh.visible&&inside){
    check(mesh.material.customProgramCacheKey()==='card9','Interior supporting cat lacks illustrated bright-floor shading');
    check(mesh.material.color.r>=.99&&mesh.material.color.g>=.95&&mesh.material.color.b>=.88,'Interior supporting kitten remains dark: '+actor.id+' frame '+frame);
    check(mesh.material.emissiveIntensity===0,'Interior kitten is emissive instead of using character shading');
   }
   if(mesh.visible&&['supporting-cat-6','supporting-cat-7'].includes(actor.id)&&p.x>4.2)check(mesh.material.color.g<.45,'Alley kitten receives interior lighting through the cafe side wall');
  }
  const earlier=s.shot.number===58&&s.shot.variant===0||s.shot.number===59&&s.shot.variant===1;population.root.visible=!earlier;
  cast.forEach(c=>{c.card.updateActor(s[c.id],s);c.card.mesh.visible=(!earlier||c.id==='mocha')&&(c.id==='latte'||s.shot.number>=50)&&!(c.id==='latte'&&[39,40,41].includes(s.shot.number))&&!(s.shot.number===59&&s.shot.variant===0);c.card.mesh.updateMatrixWorld(true);});
  kitten.update({...storyAt(0),kitten:s.kitten,kittenFear:s.kittenFear,kittenSmile:s.kittenSmile,camera:s.camera,target:s.target},s.t*30);kitten.mesh.visible=s.shot.number>=46&&!earlier;kitten.mesh.position.set(...s.kitten);kitten.mesh.rotation.y=Math.atan2(s.camera[0]-s.kitten[0],s.camera[2]-s.kitten[2]);kitten.mesh.updateMatrixWorld(true);
  camera.position.set(...s.camera);camera.fov=s.fov;camera.lookAt(...s.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);world.update(s);
  const a=checkEpisodeCamera(world,s,camera,[...cast.map(c=>({id:c.id,mesh:c.card.mesh})),{id:'kitten',mesh:kitten.mesh},...population.actors]);
  const important=new Set(['latte','mocha','essie','kitten','mouse','door','clock','sign','light-9','shadow','shadow-top','cloth-silhouette','confused-cat','other-buildings']);for(const v of a.visibility.filter(v=>important.has(v.id)&&(!v.inFrame||v.occluder))){const key=s.shot.id+':'+v.id+':'+(v.occluder??'out-of-frame'),prior=issues[key]??{first:frame,last:frame,count:0};prior.last=frame;prior.count++;issues[key]=prior;}checks++;
 }
 population.dispose();cast.forEach(c=>c.card.dispose());kitten.dispose();latte.dispose();world.dispose();
 return {checks,passed:!Object.keys(issues).length,alphaFramesChecked:props.shots.at(-1).end,issues,sceneFramesRendered:0};
}`,resolveDir:path.resolve('src/v2/episodes/door-at-1111-polish'),loader:'ts'},bundle:true,write:false,platform:'browser',format:'iife',globalName:'CardTest'});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
try{const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:()=>{},onLog:()=>{}});await page.evaluate(code=>{(0,eval)(code);},source.outputFiles[0].text);const result=await page.evaluate(props=>window.CardTest.run(props),props);console.log(JSON.stringify(result));await fs.writeFile('out/v2-episodes/door-at-1111-polish/CARD_ALPHA_QA.json',JSON.stringify(result,null,2)+'\n');if(!result.passed)process.exitCode=1;}finally{await browser.close({silent:true});}
