// From studio/: node scripts/v2-cafe-render.mjs [--draft] [Exterior|Wide|Counter|Closeup]
import {bundle} from '@remotion/bundler';
import {openBrowser,renderStill,selectComposition} from '@remotion/renderer';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const draft=process.argv.includes('--draft');const pick=process.argv.find(x=>['Exterior','Wide','Counter','Closeup'].includes(x));
const output=path.resolve('out/v2-cafe'+(draft?'/draft':''));fs.mkdirSync(output,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable:process.env.CHROME||'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
const shots=[['Exterior','01-exterior.png'],['Wide','02-interior-wide.png'],['Counter','03-counter-interaction.png'],['Closeup','04-essie-closeup.png']];
const sceneSourceHashes=Object.fromEntries(fs.readdirSync('src/v2/cafe').filter(x=>/\.tsx?$/.test(x)).map(x=>[x,crypto.createHash('sha256').update(fs.readFileSync('src/v2/cafe/'+x)).digest('hex')]));
const sourceHashes=Object.fromEntries(fs.readdirSync('src/v2/cats').filter(x=>/\.tsx?$/.test(x)).map(x=>[x,crypto.createHash('sha256').update(fs.readFileSync('src/v2/cats/'+x)).digest('hex')]));
try{
 for(const [shot,file] of shots){if(pick&&shot!==pick)continue;
  let audit;const errors=[];const composition=await selectComposition({serveUrl,id:'V2Cafe'+shot,puppeteerInstance:browser,logLevel:'error',onBrowserLog:()=>{}});
  const start=Date.now();
  await renderStill({serveUrl,composition,frame:0,output:path.join(output,file),imageFormat:'png',scale:draft?0.5:1,puppeteerInstance:browser,timeoutInMilliseconds:180000,logLevel:'error',
   onBrowserLog:log=>{if(log.text.startsWith('CAFE_AUDIT '))audit=JSON.parse(log.text.slice(11));else if(log.type==='error'){errors.push(log.text);console.error(log.text.slice(0,500));}}});
  if(!audit)throw new Error('Missing runtime scene audit for '+shot);
  const bad=audit.visibility.filter(v=>!v.inFrame||v.occluder);
  if(bad.length||audit.assets.length||audit.cameraHits.length||errors.length)throw new Error(JSON.stringify({shot,bad,assets:audit.assets,cameraHits:audit.cameraHits,errors}));
  fs.writeFileSync(path.join(output,file.replace('.png','.audit.json')),JSON.stringify({...audit,render:{composition:'V2Cafe'+shot,file,width:draft?540:1080,height:draft?960:1920,elapsedSeconds:(Date.now()-start)/1000,errors},sceneSourceHashes,approvedCatSourceHashes:sourceHashes},null,2)+'\n');
  console.log(file+' '+JSON.stringify({seconds:(Date.now()-start)/1000,visibility:audit.visibility,assets:audit.assets,cameraHits:audit.cameraHits}));
 }
}finally{await browser.close({silent:true});}
