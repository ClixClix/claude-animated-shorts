// Checks the real Canvas output in Chromium, without creating an animation or altering sheets.
import fs from 'node:fs';
import ts from 'typescript';
import {openBrowser} from '@remotion/renderer';
const files=['src/videos/bridge/toon.ts','src/v2/cats/designs.ts','src/v2/cats/pose.ts','src/v2/cats/drawCat.ts'];
const sources=Object.fromEntries(files.map(file=>[file.replace(/.*\//,'').replace('.ts',''),ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText]));
const browser=await openBrowser('chrome',{browserExecutable:process.env.CHROME||'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
try{
 const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:null,onLog:()=>{}});
 const result=await page.evaluate((sources)=>{
   const cache={};const req=(name)=>{
     const key=name.split('/').pop();if(cache[key])return cache[key].exports;
     const m={exports:{}};cache[key]=m;new Function('require','module','exports',sources[key])(req,m,m.exports);return m.exports;
   };
   const {drawCat}=req('drawCat'),{catMotion,EXPRESSIONS}=req('pose');
   const cv=document.createElement('canvas');cv.width=500;cv.height=550;const g=cv.getContext('2d',{willReadFrequently:true});
   const raster=(cat,pose)=>{g.clearRect(0,0,500,550);drawCat(g,cat,pose);const pixels=g.getImageData(0,0,500,550).data;
     let ink=0;for(let y=0;y<550;y++)for(let x=0;x<500;x++){const a=pixels[(y*500+x)*4+3];if(a){ink++;if(x<2||x>497||y<2||y>547)throw new Error(`${cat}: clipped artwork`);}}
     if(ink<15000)throw new Error('Missing character');return cv.toDataURL();};
   let checked=0;
   for(const cat of ['mocha','essie','latte']){
     const rest=raster(cat,{});checked++;
     const variants=[{yaw:1},{yaw:0.58},{yaw:-1},{blink:1},{gazeX:1},{gazeY:1},{earLeft:0.8},{earRight:0.8},{tail:0.8},{headTilt:0.2},{headTurn:0.6},{headTurn:-0.6},catMotion(0.2),catMotion(0.2,'walk'),catMotion(0.6,'walk')];
     for(const pose of variants){if(raster(cat,pose)===rest)throw new Error(`${cat}: no visible response to ${JSON.stringify(pose)}`);checked++;}
     if(raster(cat,catMotion(0.2,'walk'))===raster(cat,catMotion(0.6,'walk')))throw new Error('Gait is frozen');
     const expressions=EXPRESSIONS.map(expression=>raster(cat,{expression}));if(new Set(expressions).size!==6)throw new Error('Duplicate expression drawings');checked+=6;
     if(raster(cat,{})!==rest)throw new Error('Non-deterministic renderer');
   }
   if(catMotion(3.4).blink<0.99)throw new Error('Automatic blink not closing');
   return {checked,checks:'Visible pose controls, distinct expressions, moving gait, deterministic rerender, unclipped transparent sprites, automatic blink'};
 },sources);
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close({silent:true});}
