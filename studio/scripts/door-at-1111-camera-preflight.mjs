// All-frame structural visibility against the actual Three.js world, without expensive GPU draws.
// This does not replace native visual/motion review or the final alpha-tested card audits.
import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {openBrowser} from '@remotion/renderer';
const out=path.resolve('out/v2-episodes/door-at-1111');
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
const script=await build({stdin:{contents:`
import * as T from 'three';
import {EpisodeWorld} from './world';
import {stateAt} from './timeline';
import {checkEpisodeCamera} from './cameraQA';
export function run(props){
 const w=new EpisodeWorld(false),camera=new T.PerspectiveCamera(48,1080/1920,.08,120),flags=[],cameraFlags=[],assets=[];
 w.root.traverse(o=>{if(o instanceof T.Mesh){if(!o.geometry?.getAttribute('position')?.count||!o.material)assets.push(o.name);const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)if(m.map&&(!m.map.image?.width||!m.map.image?.height))assets.push(o.name+':texture');}});
 const roles=[...w.cafe.fixtures].map(([id,o])=>({id,role:o.userData.role}));
 for(let frame=0;frame<props.shots.at(-1).end;frame++){
  const s=stateAt(frame,props.shots);camera.position.set(...s.camera);camera.fov=s.fov;camera.lookAt(...s.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);w.update(s);
  const a=checkEpisodeCamera(w,s,camera);
  if(a.cameraHits.length)cameraFlags.push({frame,shot:s.shot.id,hits:a.cameraHits});
  for(const v of a.visibility)if(!v.inFrame||v.occluder)flags.push({frame,shot:s.shot.id,...v});
  if(frame%400===0)console.log('CAMERA_PREFLIGHT '+frame);
 }
 w.dispose();return {frames:props.shots.at(-1).end,geometryFlags:flags,cameraFlags,missingAssets:assets,roles,characterAlphaOcclusionChecked:false};
}`,resolveDir:path.resolve('src/v2/episodes/door-at-1111'),loader:'ts'},bundle:true,write:false,platform:'browser',format:'iife',globalName:'DoorCameraPreflight',target:'chrome120'});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
try{
 const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:l=>{if(l.text.startsWith('CAMERA_PREFLIGHT'))console.log(l.text);},onLog:()=>{}});
 await page.evaluate(code=>{(0,eval)(code);},script.outputFiles[0].text);
 const result=await page.evaluate(props=>window.DoorCameraPreflight.run(props),props);
 result.passed=!result.geometryFlags.length&&!result.cameraFlags.length&&!result.missingAssets.length;
 await fs.writeFile(path.join(out,'CAMERA_GEOMETRY_PREFLIGHT.json'),JSON.stringify(result,null,2)+'\n');
 const grouped={};for(const f of result.geometryFlags){const key=f.shot+':'+f.id+':'+(f.occluder??'out-of-frame');const g=grouped[key]??{firstFrame:f.frame,lastFrame:f.frame,count:0};g.lastFrame=f.frame;g.count++;grouped[key]=g;}
 console.log(JSON.stringify({frames:result.frames,passed:result.passed,missingAssets:result.missingAssets,cameraFlags:result.cameraFlags,geometryFlags:grouped},null,2));
 if(!result.passed)process.exitCode=1;
}finally{await browser.close({silent:true});}
