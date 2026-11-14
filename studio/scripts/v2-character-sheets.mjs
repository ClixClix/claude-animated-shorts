import {browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
// Run from studio/: node scripts/v2-character-sheets.mjs
// Actual Remotion Canvas 2D output; no source photos, external fonts, or image generators.
import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderStill} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('out/v2-character-design');fs.mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
const sheets=[['V2MochaSheet','01-mocha-turnaround.png'],['V2EssieSheet','02-essie-turnaround.png'],['V2LatteSheet','03-latte-turnaround.png'],['V2ExpressionSheet','04-expression-comparison.png'],['V2CastSheet','05-cast-turnarounds.png']];
try {
  for(const [id,file] of sheets){
    const composition=await selectComposition({serveUrl,id,puppeteerInstance:browser});
    await renderStill({composition,serveUrl,frame:0,output:path.join(out,file),imageFormat:'png',puppeteerInstance:browser,
      onBrowserLog:log=>{if(log.type==='error')console.error(log.text);}});
    console.log(`${id} -> ${file}`);
  }
  fs.writeFileSync(path.join(out,'render-manifest.json'),JSON.stringify({renderer:'Remotion',command:'node scripts/v2-character-sheets.mjs',frame:0,sheets:sheets.map(([composition,file])=>({composition,file}))},null,2)+'\n');
}finally{await browser.close({silent:true});}
