// Non-billable integration exercise. All audio here is clearly labeled synthetic test tone, not narration.
import {build} from 'esbuild';import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
const out=path.resolve('out/v2-narration/offline-qa');await fs.mkdir(out,{recursive:true});
for(const [name,entry] of [['audio','server/audio.ts'],['timing','timing.ts'],['config','config.ts']])await build({entryPoints:['src/v2/narration/'+entry],outfile:out+'/'+name+'.mjs',bundle:true,platform:'node',format:'esm',target:'node24'});
const audio=await import(pathToFileURL(out+'/audio.mjs').href),timing=await import(pathToFileURL(out+'/timing.mjs').href),{TEST_SCRIPTS}=await import(pathToFileURL(out+'/config.mjs').href);
const raw=out+'/offline-fixture-tone.wav',master=out+'/offline-fixture-master.mp3';
execFileSync('ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','sine=frequency=660:duration=6:sample_rate=48000',raw]);
const mastering=await audio.masterAudio(raw,master);
const script=TEST_SCRIPTS.in_this_town,chars=[...script],alignment={characters:chars,character_start_times_seconds:chars.map((_,i)=>0.1+i*0.033),character_end_times_seconds:chars.map((_,i)=>0.1+(i+1)*0.033)};
const metadata=timing.alignText(alignment,script,mastering.info.duration),plan=timing.planTown(metadata,mastering.info.duration);
await fs.mkdir('public/v2-narration',{recursive:true});await fs.copyFile(master,'public/v2-narration/offline-fixture.mp3');
const props={audioFile:'v2-narration/offline-fixture.mp3',plan,samplesApproved:true,pacingApproved:true,measuredTruePeak:mastering.after.truePeakDBTP,fixtureLabel:'OFFLINE TEST TONE — NOT A NARRATOR'};
await fs.writeFile(out+'/offline-preview-props.json',JSON.stringify(props,null,2));
// Exercise final-container true-peak verification using a tiny, deliberately non-story test video.
execFileSync('ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','color=c=black:s=16x16:r=30:d=6','-i',master,'-c:v','libx264','-c:a','aac','-shortest',out+'/offline-fixture-unmastered.mp4']);
const encoded=await audio.finalizeVideoAudio(out+'/offline-fixture-unmastered.mp4',out+'/offline-fixture-encoded.mp4');
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
const errors=[];
try{
 const composition=await selectComposition({serveUrl,id:'InThisTownV2Narrated',inputProps:props,puppeteerInstance:browser,logLevel:'error',onBrowserLog:()=>{}});
 if(composition.durationInFrames!==plan.durationInFrames)throw new Error('Narration duration not propagated to Remotion.');
 await renderStill({serveUrl,composition,inputProps:props,frame:Math.min(30,composition.durationInFrames-1),output:out+'/offline-remotion-smoke.png',imageFormat:'png',puppeteerInstance:browser,logLevel:'error',timeoutInMilliseconds:180000,onBrowserLog:l=>{if(l.type==='error')errors.push(l.text);}});
 await renderMedia({serveUrl,composition,inputProps:props,frameRange:[15,20],codec:'h264',outputLocation:out+'/offline-remotion-audio-smoke.mp4',scale:0.5,concurrency:2,puppeteerInstance:browser,logLevel:'error',chromiumOptions:{gl:'swangle'},timeoutInMilliseconds:180000,onBrowserLog:l=>{if(l.type==='error')errors.push(l.text);}});
 const silent=await selectComposition({serveUrl,id:'InThisTownV2ALittleLight',puppeteerInstance:browser,logLevel:'error',onBrowserLog:()=>{}});
 if(silent.durationInFrames!==240||silent.fps!==30)throw new Error('Original silent composition changed.');
 if(errors.length)throw new Error('Offline browser smoke test failed.');
 const files=await fs.readdir(serveUrl);const bundles=await Promise.all(files.filter(f=>f.endsWith('.js')).map(f=>fs.readFile(path.join(serveUrl,f),'utf8')));
 if(bundles.some(text=>text.includes('ELEVENLABS_API_KEY')||text.includes('xi-api-key')))throw new Error('Server credential-handling code entered browser bundle.');
 const report={fixture:'Synthetic 660 Hz engineering test tone; no human voice, music, API call or narrator approval',mastering,encoded,remotion:{durationInFrames:composition.durationInFrames,expectedFrames:plan.durationInFrames,originalSilentFrames:silent.durationInFrames,audioSmokeFrames:6,errors},browserSecretCodeAbsent:true};
 await fs.writeFile(out+'/offline-qa-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close({silent:true});}
