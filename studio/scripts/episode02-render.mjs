import {studioRoot,browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderInputs,renderProps,requireUnchangedInputs,segmentMatches} from './lib/episode02-render-inputs.mjs';
import {openBrowser,selectComposition,renderMedia} from '@remotion/renderer';

// A final visual-asset source mismatch must stop rendering before any video work.
execFileSync(process.execPath,[path.join(studioRoot,'scripts/episode02-style-preflight.mjs')],
 {cwd:studioRoot,stdio:'inherit'});
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02');
const rawProps=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
const mode=process.argv[2]??'render',preview=mode==='preview';
if(!['render','preview'].includes(mode))throw Error('Use render or preview.');
const selected=(()=>{const i=process.argv.indexOf('--shots');if(i<0)return null;if(!process.argv[i+1]||process.argv[i+1].startsWith('--'))throw Error('Supply shot IDs after --shots.');return new Set(process.argv[i+1].split(',').map(s=>s.trim()));})();
const force=process.argv.includes('--force');
const props=renderProps(rawProps,preview);
if(selected){const unknown=[...selected].filter(id=>!props.shots.some(s=>s.id===id||String(s.sequence)===id));if(unknown.length)throw Error('Unknown shot IDs: '+unknown.join(', '));}
console.log('Inspecting composition dependencies and render inputs...');
const inputs=await renderInputs(studioRoot,rawProps,preview);
const {sourceHash,propsHash,signatureVersion}=inputs;
const hash=x=>createHash('sha256').update(x).digest('hex');
const target=path.join(out,preview?'preview-segments':'segments');
await fs.mkdir(target,{recursive:true});
console.log('Bundling current scene '+sourceHash.slice(0,12)+'...');
const serveUrl=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
await requireUnchangedInputs(studioRoot,inputs);
console.log('Launching browser for '+(preview?'540p review':'1080p native')+' render...');
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
  await requireUnchangedInputs(studioRoot,inputs);
  if(!force&&await segmentMatches({file,metadata:cached,shot,inputs,preview})){
   console.log('Cached shot '+shot.id);skipped++;continue;
  }
  console.log('Rendering shot '+shot.id+'; frames '+shot.start+'-'+(shot.end-1)+'...');
  const start=Date.now();
  const partial=file+'.partial.mp4';
  await renderMedia({overwrite:true,serveUrl,composition,inputProps:props,
   frameRange:[shot.start,shot.end-1],outputLocation:partial,
   codec:'h264',crf:18,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:95,
   scale:preview?.5:1,
   concurrency:renderConcurrency(),puppeteerInstance:browser,chromiumOptions,
   logLevel:'error',timeoutInMilliseconds:240000});
  await requireUnchangedInputs(studioRoot,inputs);
  await fs.rename(partial,file);
  const sha=hash(await fs.readFile(file));
  await fs.writeFile(meta,JSON.stringify({id:shot.id,start:shot.start,end:shot.end,
   signatureVersion,sourceHash,propsHash,sha256:sha,preview,seconds:(Date.now()-start)/1000},null,2)+'\n');
  completed++;console.log('Rendered '+shot.id+' ('+completed+' new, '+skipped+' cached)');
 }
}finally{await browser.close({silent:true});}
await fs.writeFile(path.join(out,preview?'PREVIEW_RENDER_STATUS.json':'FINAL_RENDER_STATUS.json'),
 JSON.stringify({signatureVersion,sourceHash,propsHash,sources:inputs.sources,completed,skipped,requestedShots:selected?[...selected]:null,
  allSegmentsRequested:!selected,stage:'RENDERED_NOT_QA_VERIFIED',
  paidGenerationRequests:0},null,2)+'\n');
console.log(JSON.stringify({stage:'rendered',mode,completed,skipped,allSegments:!selected}));
