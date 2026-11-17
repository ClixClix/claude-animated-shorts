import {studioRoot,browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia} from '@remotion/renderer';

const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02');
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
const mode=process.argv[2]??'render',preview=mode==='preview';
if(!['render','preview'].includes(mode))throw Error('Use render or preview.');
const selected=(()=>{const i=process.argv.indexOf('--shots');return i<0?null:new Set(process.argv[i+1].split(','));})();
const force=process.argv.includes('--force');
props.previewScale=preview?.5:1;
props.optimize=true;
const sourceFiles=[
 'src/v2/episodes/in-this-town-02/Episode.tsx',
 'src/v2/episodes/in-this-town-02/timeline.ts',
 'src/v2/episodes/in-this-town-02/boxProps.ts',
 'src/v2/episodes/in-this-town-02/cameraDirector.ts',
 'src/v2/episodes/in-this-town-02/EDITORIAL_SCRATCH_PLAN.json',
 'src/v2/episodes/door-at-1111-polish/world.ts',
 'src/v2/episodes/door-at-1111-polish/city.ts',
 'src/v2/episodes/door-at-1111-polish/cityConfig.ts',
 'src/v2/episodes/door-at-1111-polish/actors.ts',
 'src/v2/cafe/config.ts','src/v2/cafe/environment.ts',
 'src/v2/cats/Cat.tsx','src/v2/cats/drawCat.ts','src/v2/cats/designs.ts',
 'src/videos/bridge/cardshade.ts','src/videos/bridge/ink.ts',
];
const hash=x=>createHash('sha256').update(x).digest('hex');
const sourceHash=hash((await Promise.all(sourceFiles.map(f=>fs.readFile(path.join(studioRoot,f))))).map(b=>hash(b)).join(':'));
const propsHash=hash(JSON.stringify(props));
const target=path.join(out,preview?'preview-segments':'segments');
await fs.mkdir(target,{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
const composition=await selectComposition({serveUrl,id:'InThisTownEpisode02Box',inputProps:props,
 puppeteerInstance:browser,logLevel:'error'});
let completed=0,skipped=0;
try{
 for(const shot of props.shots){
  if(selected&&!selected.has(shot.id)&&!selected.has(String(shot.sequence)))continue;
  const file=path.join(target,shot.id+'.mp4');
  const meta=file.replace(/\.mp4$/,'.json');
  let cached=null;try{cached=JSON.parse(await fs.readFile(meta,'utf8'));}catch{}
  if(!force&&cached&&cached.sourceHash===sourceHash&&cached.propsHash===propsHash&&
    cached.start===shot.start&&cached.end===shot.end&&await fs.access(file).then(()=>true,()=>false)){
   console.log('Cached shot '+shot.id);skipped++;continue;
  }
  const start=Date.now();
  const partial=file+'.partial.mp4';
  await renderMedia({overwrite:true,serveUrl,composition,inputProps:props,
   frameRange:[shot.start,shot.end-1],outputLocation:partial,
   codec:'h264',crf:18,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:95,
   scale:preview?.5:1,
   concurrency:renderConcurrency(),puppeteerInstance:browser,chromiumOptions,
   logLevel:'error',timeoutInMilliseconds:240000});
  await fs.rename(partial,file);
  const sha=hash(await fs.readFile(file));
  await fs.writeFile(meta,JSON.stringify({id:shot.id,start:shot.start,end:shot.end,
   sourceHash,propsHash,sha256:sha,preview,seconds:(Date.now()-start)/1000},null,2)+'\n');
  completed++;console.log('Rendered '+shot.id+' ('+completed+' new, '+skipped+' cached)');
 }
}finally{await browser.close({silent:true});}
await fs.writeFile(path.join(out,preview?'PREVIEW_RENDER_STATUS.json':'FINAL_RENDER_STATUS.json'),
 JSON.stringify({sourceHash,propsHash,completed,skipped,requestedShots:selected?[...selected]:null,
  allSegmentsRequested:!selected,stage:'RENDERED_NOT_QA_VERIFIED',
  paidGenerationRequests:0},null,2)+'\n');
console.log(JSON.stringify({stage:'rendered',mode,completed,skipped,allSegments:!selected}));
