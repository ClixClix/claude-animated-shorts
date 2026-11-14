import {browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
// Paid synthesis is never performed here. Run only after approving both samples and the measured plan.
import {build} from 'esbuild';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const out='out/v2-narration';const props=JSON.parse(fs.readFileSync(out+'/preview-props.json','utf8'));
if(!props.samplesApproved||!props.pacingApproved||!props.plan||props.measuredTruePeak> -1)throw new Error('Approved sample, pacing plan and mastered audio are required.');
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
try{
 const composition=await selectComposition({serveUrl,id:'InThisTownV2Narrated',inputProps:props,puppeteerInstance:browser});
 await renderMedia({serveUrl,composition,inputProps:props,puppeteerInstance:browser,codec:'h264',outputLocation:out+'/narrated-unmastered.mp4',concurrency:renderConcurrency(),crf:18,chromiumOptions,timeoutInMilliseconds:180000});
}finally{await browser.close({silent:true});}
await build({entryPoints:['src/v2/narration/server/audio.ts'],outfile:out+'/tools/audio.mjs',bundle:true,platform:'node',format:'esm',target:'node24'});
const {finalizeVideoAudio}=await import(pathToFileURL(path.resolve(out+'/tools/audio.mjs')).href);
const report=await finalizeVideoAudio(out+'/narrated-unmastered.mp4',out+'/in-this-town-narrated-test.mp4');
fs.writeFileSync(out+'/video-audio-qa.json',JSON.stringify(report,null,2));console.log('Separate narrated preview encoded and its final audio true peak verified.');
