// Offline only. This renderer imports no TTS client and never calls ElevenLabs.
// From studio/: node scripts/v2-narrated-test.mjs prepare|stills|render|audio
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';

const mode=process.argv[2]??'prepare';
if(!['prepare','stills','render','audio'].includes(mode))throw new Error('Use prepare, stills, render or audio.');
const out=path.resolve('out/v2-animation-test'),work=path.join(out,'narrated');
await fs.mkdir(work,{recursive:true});
for(const [name,entry] of [['audio','src/v2/narration/server/audio.ts'],['timing','src/v2/narration/townAudition.ts']]) {
  await build({entryPoints:[entry],outfile:path.join(work,name+'.mjs'),bundle:true,platform:'node',format:'esm',target:'node24'});
}
const audio=await import(pathToFileURL(path.join(work,'audio.mjs')).href);
const timing=await import(pathToFileURL(path.join(work,'timing.mjs')).href);
const approved='out/v2-narration/Sawyer_Test.mp3';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytes=await fs.readFile(approved);
if(hash(bytes)!=='0d38bf2aabbde18b77485a7cbaa0314e14a58f8fc0793779d58d83185b5babf5')throw new Error('Approved Sawyer recording changed.');
const metadata=JSON.parse(await fs.readFile('out/v2-narration/Sawyer_Test-timestamps.json','utf8'));
if(metadata.narrator.voiceId!=='8dEUmyPMdDdK91vboYih'||metadata.narrator.settings.speed!==1)throw new Error('Unexpected narrator or speed.');
const info=await audio.inspectAudio(approved),loudness=await audio.measureLoudness(approved);
if(loudness.truePeakDBTP> -1||Math.abs(info.duration-metadata.duration)>0.02)throw new Error('Approved audio failed integrity/peak verification.');
const {plan,visualTiming}=timing.planTownAudition(metadata.timing,info.duration);
const props={audioFile:'v2-narration/approved-sawyer.mp3',plan,visualTiming,samplesApproved:true,pacingApproved:true,measuredTruePeak:loudness.truePeakDBTP};
await fs.mkdir('public/v2-narration',{recursive:true});
await fs.writeFile('public/v2-narration/approved-sawyer.mp3',bytes);
await fs.writeFile(path.join(work,'preview-props.json'),JSON.stringify(props,null,2));
const summary={approvedAudio:approved,audioSHA256:hash(bytes),audio:info,loudness,plan,visualTiming,paidRequests:0};
await fs.writeFile(path.join(work,'timing-plan.json'),JSON.stringify(summary,null,2));
if(mode==='prepare'){console.log(JSON.stringify({audioDuration:info.duration,videoDuration:plan.durationInFrames/30,frames:plan.durationInFrames,shots:plan.shots},null,2));process.exit(0);}

async function muxApprovedAudio() {
  const intermediate=path.join(work,'narrated-unmastered.mp4');
  const sourceMux=path.join(work,'approved-source-mux.mp4');
  // Decode the approved source directly. This avoids the render engine's AAC priming offset.
  // The complete source is retained, followed by quiet padding; rendered video is copied unchanged.
  const duration=String(plan.durationInFrames/30);
  execFileSync('ffmpeg',['-nostdin','-v','error','-y','-i',intermediate,'-i',approved,
    '-map','0:v:0','-map','1:a:0','-c:v','copy','-af',`apad=whole_dur=${duration}`,
    '-ar','48000','-ac','2','-c:a','aac','-b:a','192k','-t',duration,'-movflags','+faststart',sourceMux]);
  const final=path.join(out,'InThisTown_V2_Narrated_Test.mp4');
  const mastering=await audio.finalizeVideoAudio(sourceMux,final);
  await fs.writeFile(path.join(work,'encoded-audio-qa.json'),JSON.stringify({...mastering,approvedSourceMux:true,sourceAudioSHA256:hash(bytes),videoStreamCopied:true},null,2));
  console.log('Completed full native narrated render and encoded audio verification: '+final);
}
if(mode==='audio'){await muxApprovedAudio();process.exit(0);}

const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable:process.env.CHROME||'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
try {
  const composition=await selectComposition({serveUrl,id:'InThisTownV2Narrated',inputProps:props,puppeteerInstance:browser,logLevel:'error',onBrowserLog:()=>{}});
  const silent=await selectComposition({serveUrl,id:'InThisTownV2ALittleLight',puppeteerInstance:browser,logLevel:'error',onBrowserLog:()=>{}});
  if(silent.durationInFrames!==240||composition.durationInFrames!==plan.durationInFrames)throw new Error('Composition duration regression.');
  if(mode==='stills') {
    await fs.mkdir(path.join(work,'keyframes'),{recursive:true});
    for(const frame of [202,258,322,410]){
      const audits=[],errors=[];
      await renderStill({serveUrl,composition,inputProps:props,frame,output:path.join(work,'keyframes',`frame-${frame}.png`),imageFormat:'png',puppeteerInstance:browser,logLevel:'error',timeoutInMilliseconds:180000,
        onBrowserLog:l=>{if(l.text.startsWith('ANIM_AUDIT '))audits.push(JSON.parse(l.text.slice(11)));else if(l.type==='error')errors.push(l.text);}});
      if(!audits.length||errors.length)throw new Error('Storyboard initialization failed.');
      await fs.writeFile(path.join(work,'keyframes',`frame-${frame}.json`),JSON.stringify({audits,errors},null,2));
      console.log('Rendered narrated keyframe '+frame);
    }
    await renderStill({serveUrl,composition:silent,frame:143,output:path.join(work,'silent-regression-143.png'),imageFormat:'png',puppeteerInstance:browser,logLevel:'error',timeoutInMilliseconds:180000,onBrowserLog:()=>{}});
    console.log('Rendered original silent composition regression frame.');
  } else {
    const audits=[],errors=[];let last=0;
    const intermediate=path.join(work,'narrated-unmastered.mp4');
    await renderMedia({serveUrl,composition,inputProps:props,codec:'h264',outputLocation:intermediate,concurrency:3,imageFormat:'png',crf:18,pixelFormat:'yuv420p',puppeteerInstance:browser,chromiumOptions:{gl:'swangle'},timeoutInMilliseconds:180000,logLevel:'error',
      onBrowserLog:l=>{if(l.text.startsWith('ANIM_AUDIT '))audits.push(JSON.parse(l.text.slice(11)));else if(l.type==='error')errors.push(l.text);},
      onProgress:p=>{if(p.renderedFrames-last>=12){last=p.renderedFrames;console.log(`Rendered ${last}/${composition.durationInFrames} frames`);}}});
    await fs.writeFile(path.join(work,'render-audits.json'),JSON.stringify({audits,errors},null,2));
    if(errors.length)throw new Error('Browser errors during narrated render.');
    await muxApprovedAudio();
  }
} finally {await browser.close({silent:true});}
