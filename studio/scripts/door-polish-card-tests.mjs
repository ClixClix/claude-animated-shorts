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
export function run(props){
 const frames=['21','22','30','44','53','60C'].map(id=>{const s=props.shots.find(s=>s.id===id);return s.start+Math.floor((s.end-s.start)*.6);});let checks=0;
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
 return {checks,passed:true,sceneFramesRendered:0};
}`,resolveDir:path.resolve('src/v2/episodes/door-at-1111-polish'),loader:'ts'},bundle:true,write:false,platform:'browser',format:'iife',globalName:'CardTest'});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
try{const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:()=>{},onLog:()=>{}});await page.evaluate(code=>{(0,eval)(code);},source.outputFiles[0].text);console.log(JSON.stringify(await page.evaluate(props=>window.CardTest.run(props),props)));}finally{await browser.close({silent:true});}
