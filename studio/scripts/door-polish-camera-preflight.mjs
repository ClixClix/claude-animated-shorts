import {browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
// All-frame structural visibility against the actual Three.js world, without expensive GPU draws.
// This does not replace native visual/motion review or the final alpha-tested card audits.
import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {openBrowser} from '@remotion/renderer';
const out=path.resolve('out/v2-episodes/door-at-1111-polish');
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
if(process.argv.includes('--inspect'))props.inspectFrame=Number(process.argv[process.argv.indexOf('--inspect')+1]);
const script=await build({stdin:{contents:`
import * as T from 'three';
import {EpisodeWorld} from './world';
import {stateAt} from './timeline';
import {checkEpisodeCamera} from './cameraQA';
import {mouthAnchor,noseAnchor} from './contacts';
export function run(props){
 const w=new EpisodeWorld(false),camera=new T.PerspectiveCamera(48,1080/1920,.08,320),flags=[],cameraFlags=[],assets=[],contactFlags=[],occluders={};let checked=0;
 w.root.traverse(o=>{if(o instanceof T.Mesh){if(!o.geometry?.getAttribute('position')?.count||!o.material)assets.push(o.name);const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)if(m.map&&(!m.map.image?.width||!m.map.image?.height))assets.push(o.name+':texture');}});
 for(const name of ['night-stars','bus-stop-pictogram','bus-stop-platform','latte-cat-bed','home-food','home-water','latte-hiding-box','door-open-plaque','cafe-entry-threshold','planter-solid-rim','planter-soil','planter-saucer','planter-stem'])if(!w.root.getObjectByName(name))assets.push(name);
 for(let layer=0;layer<2;layer++)for(let side=0;side<4;side++){const card=w.root.getObjectByName('city-painted-horizon-'+layer+'-'+side);if(!card||card.material.alphaTest<=0||!card.material.map||card.castShadow)assets.push('invalid-painted-horizon-'+layer+'-'+side);}
 const roles=[...w.cafe.fixtures].map(([id,o])=>({id,role:o.userData.role}));
 for(let frame=0;frame<props.shots.at(-1).end;frame++){
  if(props.inspectFrame!==undefined&&frame!==props.inspectFrame)continue;checked++;
  const s=stateAt(frame,props.shots,props.cues?.taps);camera.position.set(...s.camera);camera.fov=s.fov;camera.lookAt(...s.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);w.update(s);
  const a=checkEpisodeCamera(w,s,camera);
  if(s.shot.number===58&&s.shot.variant===0&&s.t>=109.12&&s.t<=109.25){const tip=new T.Vector3(...noseAnchor(s)),plate=w.props.get('nose-plate').getWorldPosition(new T.Vector3());if(tip.distanceTo(plate)>.10)contactFlags.push({frame,issue:'nose-door-gap',distance:tip.distanceTo(plate)});}
  if(s.shot.number===59&&s.shot.variant===1&&s.u>=.35&&s.u<=.60){const tip=new T.Vector3(...noseAnchor(s)),button=w.root.getObjectByName('cafe-nose-switch').getWorldPosition(new T.Vector3());if(tip.distanceTo(button)>.10)contactFlags.push({frame,issue:'nose-switch-gap',distance:tip.distanceTo(button)});}

  if(w.blanket.visible&&s.t>=18&&s.blanketLay===0){const grip=new T.Vector3().fromBufferAttribute(w.blanket.geometry.getAttribute('position'),0),mouth=new T.Vector3(...mouthAnchor(s,'mocha'));if(grip.distanceTo(mouth)>.001)contactFlags.push({frame,issue:'cloth-mouth-gap',distance:grip.distanceTo(mouth)});}
  if(s.t>=54&&!w.homeBlanket.visible)contactFlags.push({frame,issue:'blanket-missing-before-line'});
  const passing=[0,1].map(i=>w.root.getObjectByName('passing-car-'+i));
  if(s.t>=29&&passing.some(car=>car.visible))contactFlags.push({frame,issue:'traffic-after-curfew'});
  for(const car of passing.filter(c=>c.visible))for(const other of [w.bus,...[1,2].map(i=>w.props.get('parked-car-'+i))].filter(c=>c.visible)){if(new T.Box3().setFromObject(car).intersectsBox(new T.Box3().setFromObject(other)))contactFlags.push({frame,issue:'vehicle-overlap',a:car.name,b:other.name});}

  const earlier=s.shot.number===58&&s.shot.variant===0||s.shot.number===59&&s.shot.variant===1;
  for(const id of ['latte','mocha','essie']){if(earlier&&id!=='mocha'||s.shot.number<50&&id!=='latte')continue;const p=s[id].position;if(Math.hypot(s.camera[0]-p[0],s.camera[2]-p[2])<.52&&s.camera[1]>p[1]&&s.camera[1]<p[1]+1.32)cameraFlags.push({frame,shot:s.shot.id,hits:[id+'-body']});}
  if(a.cameraHits.length)cameraFlags.push({frame,shot:s.shot.id,hits:a.cameraHits});
  for(const v of a.visibility)if(!v.inFrame||v.occluder){flags.push({frame,shot:s.shot.id,...v});if(v.occluder&&!occluders[v.occluder]){const object=w.root.getObjectByName(v.occluder),box=new T.Box3().setFromObject(object);occluders[v.occluder]={frame,camera:s.camera,target:s.target,min:box.min.toArray(),max:box.max.toArray()};}}
  if(frame%400===0)console.log('CAMERA_PREFLIGHT '+frame);
 }
 w.dispose();return {frames:checked,occluders,geometryFlags:flags,cameraFlags,contactFlags,missingAssets:assets,roles,characterAlphaOcclusionChecked:false};
}`,resolveDir:path.resolve('src/v2/episodes/door-at-1111-polish'),loader:'ts'},bundle:true,write:false,platform:'browser',format:'iife',globalName:'DoorCameraPreflight',target:'chrome120'});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
try{
 const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:l=>{if(l.text.startsWith('CAMERA_PREFLIGHT'))console.log(l.text);},onLog:()=>{}});
 await page.evaluate(code=>{(0,eval)(code);},script.outputFiles[0].text);
 const result=await page.evaluate(props=>window.DoorCameraPreflight.run(props),props);
 result.passed=!result.geometryFlags.length&&!result.cameraFlags.length&&!result.missingAssets.length&&!result.contactFlags.length;
 await fs.writeFile(path.join(out,props.inspectFrame!==undefined?'CAMERA_INSPECT_'+props.inspectFrame+'.json':'CAMERA_GEOMETRY_PREFLIGHT.json'),JSON.stringify(result,null,2)+'\n');
 const grouped={};for(const f of result.geometryFlags){const key=f.shot+':'+f.id+':'+(f.occluder??'out-of-frame');const g=grouped[key]??{firstFrame:f.frame,lastFrame:f.frame,count:0};g.lastFrame=f.frame;g.count++;grouped[key]=g;}
 console.log(JSON.stringify({frames:result.frames,passed:result.passed,missingAssets:result.missingAssets,cameraFlags:result.cameraFlags,contactFlags:result.contactFlags.slice(0,10),geometryFlags:grouped},null,2));
 if(!result.passed)process.exitCode=1;
}finally{await browser.close({silent:true});}
