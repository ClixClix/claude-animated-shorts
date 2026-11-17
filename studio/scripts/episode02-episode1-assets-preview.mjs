import {studioRoot,browserExecutable,chromiumOptions} from './lib/runtime.mjs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';

/**
 * One-command, source-authentic Episode 02 test.
 * Renders selected frames only, NOT the 60-shot draft or old puppet pilot.
 * The same createEpisodeCat() and createKitten() used by EP01 must be wired
 * into Episode 02 or this command refuses to render.
 */
const check=(ok,message)=>{if(!ok)throw Error('EP01 ASSET CONTRACT: '+message);};
const assetPaths=[
 'src/v2/episodes/in-this-town-02/Episode.tsx',
 'src/v2/episodes/in-this-town-02/episode1Cast.ts',
 'src/v2/episodes/in-this-town-02/timeline.ts',
 'src/v2/episodes/in-this-town-02/cameraDirector.ts',
 'src/v2/episodes/in-this-town-02/boxProps.ts',
 'src/v2/episodes/in-this-town-02/EDITORIAL_SCRATCH_PLAN.json',
 'src/v2/episodes/door-at-1111-polish/Episode.tsx',
 'src/v2/episodes/door-at-1111-polish/actors.ts',
 'src/v2/episodes/door-at-1111-polish/walkingLegs.ts',
 'src/v2/episodes/door-at-1111-polish/population.ts',
 'src/v2/episodes/door-at-1111-polish/world.ts',
 'src/v2/animation/kitten.ts',
 'src/v2/cats/drawCat.ts',
 'src/v2/cats/designs.ts',
 'src/v2/cafe/config.ts',
 'src/v2/cafe/environment.ts',
 'src/videos/bridge/lensblur.ts',
 'src/videos/bridge/cardshade.ts',
 'src/videos/bridge/ink.ts'
];
const read=async p=>fs.readFile(path.join(studioRoot,p),'utf8');
const [ep2,adapter,ep1]=await Promise.all([
 read(assetPaths[0]),read(assetPaths[1]),read('src/v2/episodes/door-at-1111-polish/Episode.tsx')
]);
check(ep1.includes('createEpisodeCat(id)'),'Episode 01 expected lead rig not found.');
check(adapter.includes("createEpisodeCat(id)"),'Episode 02 not reusing exact Episode 01 lead rig.');
check(ep2.includes("createEpisode1CastCat('mocha')")&&
 ep2.includes("createEpisode1CastCat('essie')")&&
 ep2.includes("createEpisode1CastCat('latte')"),'One or more approved lead designs not wired directly.');
check(ep2.includes('createKitten()'),'Episode 01 kitten asset missing in demo.');
check(ep2.includes('new TownPopulation()'),'Episode 01 town extra asset missing.');
check(!ep2.includes('makeCharacter(')&&
 !ep2.includes('createArticulatedGuest('),'Failed paper-puppet renderer is still active.');
const selected=[5,6,7,12,19,37,49,50,54,55,59,60];
const scratch=JSON.parse(await read('src/v2/episodes/in-this-town-02/EDITORIAL_SCRATCH_PLAN.json'));
const shots=scratch.shots.map(s=>({
 id:s.id,sequence:s.sequence,act:s.act,start:s.estimateStartFrame,
 end:s.estimateEndFrame,cameraAndAction:s.cameraAndAction,
 narrationAnchor:s.narrationAnchor,soundCue:s.soundCue
}));
check(shots.length===60,'Expected locked sixty-shot creative outline.');
check(shots[0].start===0&&shots.at(-1).end===3876,'Locked timeline changed unexpectedly.');
console.log('EP01-asset re-use contract passed (Mocha/Essie/Latte + kitten + real town).');
console.log('TypeScript preflight before any render...');
execFileSync(process.execPath,
 [path.join(studioRoot,'node_modules/typescript/bin/tsc'),'--noEmit'],
 {cwd:studioRoot,stdio:'inherit'});
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02/ep1-asset-reuse-proof');
await fs.mkdir(out,{recursive:true});
const sourceHash=createHash('sha256').update(
 (await Promise.all(assetPaths.map(read))).join('\n')).digest('hex');
const browserErrors=[],frames=[];
const onBrowserLog=(log)=>{
 if(log.type==='error'){browserErrors.push(log.text);console.error(log.text);}
};
let browser;
try{
 const serveUrl=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
 browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
 const props={shots,captions:[],previewScale:.5,optimize:true,audioApproved:false};
 const composition=await selectComposition({
  serveUrl,id:'InThisTownEpisode02Box',inputProps:props,
  puppeteerInstance:browser,logLevel:'error',onBrowserLog
 });
 for(const n of selected){
  const shot=shots.find(s=>s.sequence===n);
  check(!!shot,'Missing story shot '+n);
  const middle=shot.start+Math.floor((shot.end-shot.start)*.50);
  const filename=path.join(out,'EP2_EP1_assets_shot_'+String(n).padStart(2,'0')+'.png');
  console.log('EP01-equivalent assets: shot '+n+', actual frame '+middle);
  await renderStill({
   serveUrl,composition,inputProps:props,frame:middle,
   output:filename,imageFormat:'png',scale:.5,
   puppeteerInstance:browser,logLevel:'error',
   onBrowserLog,timeoutInMilliseconds:240000
  });
  frames.push({shot:n,frame:middle,file:filename});
 }
}finally{if(browser)await browser.close({silent:true});}
const status={
 id:'episode02-ep01-authentic-asset-preview',
 stage:'SOURCE_CONTRACT_PASSED_VISUAL_REVIEW_REQUIRED',
 imageSize:[540,960],sourceHash,
 ep1Sources:[
  'door-at-1111-polish/actors.ts:createEpisodeCat',
  'door-at-1111-polish/walkingLegs.ts:createWalkingLegs',
  'door-at-1111-polish/world.ts:EpisodeWorld',
  'door-at-1111-polish/population.ts:TownPopulation',
  'animation/kitten.ts:createKitten',
  'videos/bridge/lensblur.ts:LensBlur'
 ],
 oldPuppetIgnored:true,leadCatsUnmodified:true,
 sampleFrames:frames,browserErrors,
 rendersWholeEpisode:false,publishingAllowed:false,
 paidVoiceRequests:0,audioApproved:false,creativeScriptLocked:true,
 notes:[
  'The three leads are the actual Episode 01 complete drawings and separate planted walking-leg system.',
  'This asset proof does not certify episode 02 camera staging, box contacts or cat-to-cardboard transformation.',
  'No new 60-shot video was rendered; this is a quick comparison sheet.'
 ]
};
await fs.writeFile(path.join(out,'EP2_EP1_ASSET_PROOF.json'),
 JSON.stringify(status,null,2)+'\n');
console.log(JSON.stringify({
 stage:status.stage,output:out,frameCount:frames.length,
 browserErrors:browserErrors.length
},null,2));
if(browserErrors.length)process.exitCode=2;
