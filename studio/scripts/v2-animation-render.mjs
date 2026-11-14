import {browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
// From studio/: node scripts/v2-animation-render.mjs storyboard|motion|full|frames [frames...]
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {openBrowser,renderStill,selectComposition,renderMedia} from '@remotion/renderer';
const sourceHash=crypto.createHash('sha256').update(fs.readdirSync('src/v2/animation').filter(x=>/\.tsx?$/.test(x)).sort().map(x=>fs.readFileSync('src/v2/animation/'+x,'utf8')).join('\n')).digest('hex');
const mode=process.argv[2]||'storyboard';const out=path.resolve('out/v2-animation-test');fs.mkdirSync(out,{recursive:true});
const gate=path.join(out,mode==='storyboard'?'gate-a':mode==='motion'?'gate-b':'frames');fs.mkdirSync(gate,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
const composition=await selectComposition({serveUrl,id:'InThisTownV2ALittleLight',puppeteerInstance:browser,logLevel:'error',onBrowserLog:()=>{}});
try{
 if(mode==='motion'){
   const samples=[['first-step',19,38],['head-turn',49,82],['arrival',81,104],['contact-slide-release',117,164],['emotional-change',174,239]];
   for(const [name,a,b] of samples){
     const audits=[],errors=[];
     await renderMedia({serveUrl,composition,codec:'h264',outputLocation:path.join(gate,name+'.mp4'),frameRange:[a,b],scale:0.5,concurrency:renderConcurrency(),puppeteerInstance:browser,chromiumOptions,imageFormat:'png',crf:18,timeoutInMilliseconds:180000,logLevel:'error',
       onBrowserLog:l=>{if(l.text.startsWith('ANIM_AUDIT '))audits.push(JSON.parse(l.text.slice(11)));else if(l.type==='error')errors.push(l.text);}});
     fs.writeFileSync(path.join(gate,name+'.json'),JSON.stringify({sourceHash,start:a,end:b,audits,errors},null,2));
     if(errors.length)throw new Error(JSON.stringify(errors));console.log(`Motion sample ${name}: frames ${a}-${b}`);
   }
 }else if(mode==='full'){
   for(const name of ['GATE_A_APPROVED.json','GATE_B_APPROVED.json']){if(!fs.existsSync(path.join(out,name))||JSON.parse(fs.readFileSync(path.join(out,name),'utf8')).sourceHash!==sourceHash)throw new Error('Current gate review missing: '+name);}
   const audits=[],errors=[];let last=0;
   await renderMedia({serveUrl,composition,codec:'h264',outputLocation:path.join(out,'InThisTown_V2_8Second_Test.mp4'),fps:30,imageFormat:'png',crf:18,pixelFormat:'yuv420p',concurrency:renderConcurrency(),puppeteerInstance:browser,chromiumOptions,timeoutInMilliseconds:180000,logLevel:'error',
     onBrowserLog:l=>{if(l.text.startsWith('ANIM_AUDIT '))audits.push(JSON.parse(l.text.slice(11)));else if(l.type==='error')errors.push(l.text);},
     onProgress:p=>{if(p.renderedFrames-last>=15){console.log(`Rendered ${p.renderedFrames}/240 frames`);last=p.renderedFrames;}}});
   fs.writeFileSync(path.join(out,'full-render-audits.json'),JSON.stringify({sourceHash,audits,errors},null,2));
   if(errors.length)throw new Error('Browser errors: '+errors.join('\n'));
 }else{
   const frames=mode==='storyboard'?[27,79,143,230]:mode==='motion'?[19,23,27,31,35,53,57,61,65,69,73,77,81,87,93,99,104,113,119,123,125,126,127,128,129,130,132,135,138,141,144,147,149,151,153,154,155,158,161,164,174,180,186,192,198,204,210,216,222,230]:process.argv.slice(3).map(Number);
   for(const frame of frames){
     let audit;const errors=[];const output=path.join(gate,`frame-${String(frame).padStart(3,'0')}.png`);
     await renderStill({serveUrl,composition,frame,output,imageFormat:'png',scale:mode==='motion'?0.5:1,puppeteerInstance:browser,timeoutInMilliseconds:180000,logLevel:'error',onBrowserLog:l=>{if(l.text.startsWith('ANIM_AUDIT '))audit=JSON.parse(l.text.slice(11));else if(l.type==='error')errors.push(l.text);}});
     if(!audit||errors.length)throw new Error(JSON.stringify({frame,audit,errors}));
     fs.writeFileSync(output.replace('.png','.json'),JSON.stringify({sourceHash,...audit,errors},null,2));
     console.log(JSON.stringify({frame,visibility:audit.visibility,cameraHits:audit.cameraHits}));
   }
 }
}finally{await browser.close({silent:true});}
