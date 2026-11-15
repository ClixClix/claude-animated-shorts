import {hash,visualSourceHash,validSegment} from './lib/polish-cache.mjs';
import {criticalShots,qualityErrors} from './lib/polish-quality.mjs';
import {browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
// Actual Remotion/Three.js renders, resumable by shot; no audio service requests.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
const mode=process.argv[2]??'stills',draft=process.argv.includes('--draft');
const after=k=>{const i=process.argv.indexOf(k);return i<0?undefined:process.argv[i+1];};
const unbatched=process.argv.includes('--unbatched');
const out=path.resolve('out/v2-episodes/door-at-1111-polish'),props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
props.optimize=!unbatched;props.previewScale=draft||mode==='motion'?.5:1;
const pick=after('--shots')?.split(',');const selected=props.shots.filter(s=>!pick||pick.includes(s.id)||pick.includes(String(s.number)));
if(mode==='motion')selected.sort((a,b)=>{const rank=id=>criticalShots.includes(id)?criticalShots.indexOf(id):criticalShots.length;return rank(a.id)-rank(b.id)||a.start-b.start;});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
const sourceHash=await visualSourceHash();
const propsHash=hash(JSON.stringify(props));
const audits=[],errors=[];const log=l=>{if(l.text.startsWith('EPISODE_AUDIT '))audits.push(JSON.parse(l.text.slice(14)));else if(l.type==='error'){errors.push(l.text);console.error(l.text.slice(0,350));}};
try{
 const composition=await selectComposition({serveUrl,id:'InThisTownTheDoorAt1111Polish',inputProps:props,puppeteerInstance:browser,logLevel:'error',onBrowserLog:log});
 if(mode==='stills'){
  const dir=path.join(out,(draft?'draft-storyboard':'storyboard')+(unbatched?'-unbatched':''));await fs.mkdir(dir,{recursive:true});
  for(const shot of selected){
   const frame=shot.start+Math.floor((shot.end-shot.start)*.60),start=Date.now(),file=path.join(dir,shot.id+'.png');
   await renderStill({serveUrl,composition,inputProps:props,frame,output:file,imageFormat:'png',scale:draft?.5:1,puppeteerInstance:browser,logLevel:'error',timeoutInMilliseconds:240000,onBrowserLog:log});
   const audit=audits.filter(a=>a.frame===frame).at(-1);await fs.writeFile(path.join(dir,shot.id+'.json'),JSON.stringify({shot,frame,audit,errors},null,2));
   console.log(JSON.stringify({shot:shot.id,frame,seconds:(Date.now()-start)/1000,visibility:audit?.visibility,cameraHits:audit?.cameraHits}));
  }
 }else if(mode==='motion'||mode==='render'){
  const dir=path.join(out,mode==='motion'?'motion':after('--sample')?'native-samples':'segments');await fs.mkdir(dir,{recursive:true});
  for(const shot of selected){
   const file=path.join(dir,shot.id+'.mp4');
   const sample=Number(after('--sample')??0),middle=shot.start+Math.round((shot.end-shot.start)*Number(after('--at')??.55));
   const range=sample?[Math.max(shot.start,middle-Math.floor(sample/2)),Math.min(shot.end-1,middle+Math.ceil(sample/2)-1)]:[shot.start,shot.end-1];
   if(!process.argv.includes('--force')&&await validSegment(file,shot,sourceHash,propsHash,mode==='motion'?.5:1,range)){console.log('Verified cached segment '+shot.id);continue;}
   let last=0;const start=Date.now(),before=audits.length;
   await renderMedia({overwrite:true,serveUrl,composition,inputProps:props,frameRange:range,outputLocation:file+'.partial.mp4',codec:'h264',crf:18,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:95,scale:mode==='motion'?.5:1,concurrency:renderConcurrency(after('--concurrency')),puppeteerInstance:browser,chromiumOptions,logLevel:'error',timeoutInMilliseconds:240000,onBrowserLog:log,onProgress:p=>{if(p.renderedFrames-last>=15){last=p.renderedFrames;console.log(`${shot.id}: ${last}/${shot.end-shot.start} frames`);}}});
   await fs.rename(file+'.partial.mp4',file);
   const shotAudits=audits.slice(before),quality=qualityErrors(shotAudits);
   await fs.writeFile(file.replace('.mp4','.json'),JSON.stringify({shot,range,sourceHash,propsHash,videoSHA256:hash(await fs.readFile(file)),seconds:(Date.now()-start)/1000,audits:shotAudits,qualityErrors:quality,errors},null,2));console.log(JSON.stringify({completed:shot.id,seconds:(Date.now()-start)/1000}));
   if(quality.length)throw Error('Actual rendered-frame QA failed in '+shot.id+': '+JSON.stringify(quality.slice(0,4))+'. Completed clips are preserved; full preview stopped.');
  }
 }else throw Error('Use stills, motion or render.');
 await fs.writeFile(path.join(out,`${mode}${draft?'-draft':''}-render-log.json`),JSON.stringify({audits,errors},null,2));
 if(errors.length)throw Error('Browser render errors were recorded.');
}finally{await browser.close({silent:true});}
