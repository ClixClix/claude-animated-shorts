/**
 * Episode 02 stills-first gate for Codex. Scene-local tooling only:
 * no core engine, renderer, camera rigs or global wrapper modifications.
 *
 * Run from studio/: node src/v2/episodes/in-this-town-02/tools/three-frame-gate.mjs
 * Or for selected shots: .../three-frame-gate.mjs --shots 06,07B,51
 *
 * Produces exactly three real, low-resolution Remotion PNGs per selected
 * narration-driven shot (first, middle and last frames). Does NOT approve them.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderStill} from '@remotion/renderer';
import {readProps,selectReviewShots,reviewFingerprint} from './review-inputs.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const studioRoot=path.resolve(here,'../../../../..');
const {browserExecutable,chromiumOptions}=await import(
  pathToFileURL(path.join(studioRoot,'scripts/lib/runtime.mjs')).href
);
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02');
const argIndex=process.argv.indexOf('--shots');
if(argIndex>=0&&(!process.argv[argIndex+1]||process.argv[argIndex+1].startsWith('--')))
  throw Error('Supply comma-separated shot IDs after --shots, e.g. --shots 06,07B,51.');
const props=await readProps();
const shots=selectReviewShots(props.shots,argIndex<0?undefined:process.argv[argIndex+1]);
for(const shot of shots){
  if(!Number.isInteger(shot.start)||!Number.isInteger(shot.end)||
    shot.start<0||shot.end<=shot.start)
    throw Error('Invalid start/end frame for '+String(shot.id));
}
// Confirm the 60 user-directed beats and the actual Adam-driven split edit
// agree before spending time rendering even the three-frame proofs.
execFileSync(process.execPath,[path.join(here,'locked-edit-gate.mjs')],
  {cwd:studioRoot,stdio:'inherit'});
// Never bypass style preflight to get a picture.
execFileSync(process.execPath,[path.join(studioRoot,'scripts/episode02-style-preflight.mjs')],
  {cwd:studioRoot,stdio:'inherit'});
props.previewScale=.5;
props.optimize=true; // mirrors the existing episode02-render.mjs setting
const dest=path.join(out,'three-frame-review');
await fs.mkdir(dest,{recursive:true});
const sourceFingerprint=await reviewFingerprint();
const results=[];
let browser;
try{
  const serveUrl=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
  browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
  const composition=await selectComposition({
    serveUrl,id:'InThisTownEpisode02Box',inputProps:props,
    puppeteerInstance:browser,logLevel:'error'
  });
  for(const shot of shots){
    const id=String(shot.id);
    const duration=shot.end-shot.start;
    const frames=[
      ['start',shot.start],
      ['middle',shot.start+Math.floor((duration-1)/2)],
      ['end',shot.end-1]
    ];
    const safeId=id.replace(/[^\w-]/g,'_');
    for(const [point,frame] of frames){
      const filename='shot_'+safeId+'_'+point+'_'+String(frame).padStart(5,'0')+'.png';
      await renderStill({
        serveUrl,composition,inputProps:props,frame,
        output:path.join(dest,filename),imageFormat:'png',scale:.5,
        puppeteerInstance:browser,logLevel:'error'
      });
      results.push({shot:id,point,frame,file:filename,visuallyApproved:false});
      console.log('Rendered still '+id+' '+point+' frame '+frame);
    }
  }
}finally{
  if(browser)await browser.close({silent:true});
}
if(sourceFingerprint!==await reviewFingerprint())throw Error('Source changed during the still render. Run Stills again.');
const packet={
  stage:'RENDERED_PNGS__REQUIRES_DIRECT_VISUAL_INSPECTION',
  approved:false,publishingAllowed:false,
  sourceFingerprint,
  shotCount:shots.length,expectedPngCount:shots.length*3,
  pngCount:results.length,frames:results,
  inspectionCriteria:[
    '2D-in-3D card depth layering: correct occlusion and no camera-facing flattening',
    'Camera composition: subject, action, faces and boxes visible at all three points',
    'Geometry: no body/box/rim/furniture/floor intersection or cat scale jump',
    'Continuity: correct character, prop identity, action and shot-to-shot staging',
    'After the PNG gate, inspect moving clips too: three stills do not prove motion quality'
  ],
  note:'An image has not passed merely because its render command succeeded. A visual agent or human must open all PNGs and log concrete issues before moving to moving-video previews or full MP4.'
};
await fs.writeFile(path.join(dest,'THREE_FRAME_REVIEW.json'),
  JSON.stringify(packet,null,2)+'\n');
console.log(JSON.stringify({
  stage:packet.stage,shots:packet.shotCount,pngs:packet.pngCount,
  reviewDirectory:dest,approved:false
},null,2));
