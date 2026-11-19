/**
 * Cloud visual evidence from existing Episode 02 Remotion composition.
 * Render START/MIDDLE/END PNG for requested beats, then STOP for inspection.
 * This tool does not render, stitch or approve a full video.
 *
 * Existing pipeline must first prepare out/v2-episodes/in-this-town-02/render-props.json
 * on the cloud runner (normally a clearly labeled SILENT SCRATCH manifest
 * because approved Adam WAV and exact word timings are local/private).
 *
 * From studio/: node src/v2/episodes/in-this-town-02/tools/cloud-scratch-stills.mjs --shots 06,07,49,50,51,52
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
const here=path.dirname(fileURLToPath(import.meta.url));
const studio=path.resolve(here,'../../../../..');
const out=path.join(studio,'out/v2-episodes/in-this-town-02');
const shotsArg=process.argv.indexOf('--shots');
if(shotsArg<0||!process.argv[shotsArg+1])throw Error('Pass --shots with comma-separated locked beat numbers.');
const wanted=new Set(process.argv[shotsArg+1].split(',').map(x=>x.trim()).filter(Boolean));
const lock=JSON.parse(await fs.readFile(path.join(studio,'src/v2/episodes/in-this-town-02/PRODUCTION_DIRECTOR_LOCK.json'),'utf8'));
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
if(lock.shots?.length!==60||!Array.isArray(props.shots))
  throw Error('Missing authoritative 60-beat director or render-props manifest');
if(props.audioApproved)throw Error('Expected silent cloud-preview only; do not mix approved local audio into this evidence job.');
const selected=props.shots.filter(s=>wanted.has(String(s.sequence))||wanted.has(String(s.id)));
if(!selected.length||selected.some(s=>s.sequence<1||s.sequence>60))throw Error('Invalid selected shots');
for(const n of wanted)if(!selected.some(s=>String(s.sequence)===n||String(s.id)===n))
 throw Error('Shot not found: '+n);
for(const s of selected){
 const d=lock.shots[s.sequence-1];
 if(d.sequence!==s.sequence||!s.cameraAndAction.includes(d.visibleAction)||
    !s.cameraAndAction.includes(d.camera))
  throw Error('Locked director action/camera mismatch: '+s.id);
 if(!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.end<=s.start)
  throw Error('Invalid render frame range: '+s.id);
}
execFileSync(process.execPath,['scripts/episode02-style-preflight.mjs'],{cwd:studio,stdio:'inherit'});
props.previewScale=.5;props.optimize=true;
const dest=path.join(out,'cloud-three-frame-proof');
await fs.mkdir(dest,{recursive:true});
const evidence=[];
let browser;
try{
 const serveUrl=await bundle({entryPoint:path.join(studio,'src/index.ts')});
 const {browserExecutable,chromiumOptions}=await import(
   new URL('file://'+path.join(studio,'scripts/lib/runtime.mjs').replaceAll('\\','/'))
 );
 browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
 const composition=await selectComposition({serveUrl,id:'InThisTownEpisode02Box',
  inputProps:props,puppeteerInstance:browser,logLevel:'error'});
 for(const s of selected){
  const picks=[['start',s.start],['middle',s.start+Math.floor((s.end-s.start-1)/2)],['end',s.end-1]];
  for(const [phase,frame] of picks){
   const png='beat_'+String(s.id).replace(/[^A-Za-z0-9_-]/g,'_')+'_'+phase+'_'+String(frame).padStart(5,'0')+'.png';
   await renderStill({serveUrl,composition,inputProps:props,frame,
    output:path.join(dest,png),imageFormat:'png',scale:.5,
    puppeteerInstance:browser,logLevel:'error'});
   evidence.push({beat:s.sequence,segmentId:s.id,phase,frame,png,approved:false});
   console.log('PNG',s.id,phase,frame);
  }
 }
}finally{if(browser)await browser.close({silent:true});}
const report={
 status:'CLOUD_SCRATCH_PNGS_RENDERED__VISUAL_INSPECTION_REQUIRED',
 source:'GITHUB_BRANCH_SOURCE__NOT_LOCAL_V9',
 timing:'HISTORICAL_SILENT_SCRATCH__NOT_APPROVED_ADAM_EDIT',
 approved:false,publishingAllowed:false,frames:evidence,
 inspection:'Open every rendered image. Camera, billboard depth, wall occlusion, scale and box clipping must be evaluated directly. Still images do NOT prove continuous motion.',
 note:'Do not compare frame numbers to the 3,737-frame approved-narration V9; this is only a cheap preliminary visual diagnosis of GitHub source.'
};
await fs.writeFile(path.join(dest,'CLOUD_STILLS_REVIEW.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,count:evidence.length,dest},null,2));
