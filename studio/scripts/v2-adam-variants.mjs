// Offline audio processing only. No provider client, credentials or synthesis requests.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const ff=args=>execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error',...args],{maxBuffer:32*1024*1024});
export function variantFilter(speed,semitones){
  if(!Number.isFinite(speed)||speed<0.5||speed>2||!Number.isFinite(semitones)||Math.abs(semitones)>12)throw new Error('Invalid independent speed/pitch controls.');
  const pitch=2**(semitones/12);
  return `rubberband=tempo=${speed}:pitch=${pitch}:formant=preserved:pitchq=consistency:window=long`;
}
function pcm(file){return ff(['-i',file,'-vn','-ac','1','-ar','48000','-f','f32le','-c:a','pcm_f32le','pipe:1']);}
function frequency(bytes){
  const samples=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4),crossings=[];
  for(let i=Math.floor(samples.length*.2)+1;i<Math.floor(samples.length*.8);i++){
    if(samples[i-1]<=0&&samples[i]>0)crossings.push(i-1-samples[i-1]/(samples[i]-samples[i-1]));
  }
  if(crossings.length<20)throw new Error('Engineering tone has too few measurable periods.');
  return 48000*(crossings.length-1)/(crossings.at(-1)-crossings[0]);
}
async function audioTools(out){
  const file=path.join(out,'audio-tools.mjs');
  await build({entryPoints:['src/v2/narration/server/audio.ts'],outfile:file,bundle:true,platform:'node',format:'esm',target:'node24'});
  return import(pathToFileURL(path.resolve(file)).href);
}
async function processVariant(input,output,speed,semitones,tools,targetLUFS){
  const prepared=output+'.float.wav';
  ff(['-y','-i',input,'-vn','-af',variantFilter(speed,semitones),'-ar','48000','-ac','1','-c:a','pcm_f32le',prepared]);
  const decodedSeconds=pcm(prepared).length/(4*48000);
  const mastered=await tools.masterAudio(prepared,output,targetLUFS);
  return {speed,semitones,pitchRatio:2**(semitones/12),filter:variantFilter(speed,semitones),decodedSeconds,mastered};
}
async function selftest(){
  const out=path.resolve('out/v2-narration/adam-audition/engineering-qa');await fs.mkdir(out,{recursive:true});
  const tools=await audioTools(out),input=path.join(out,'engineering-440Hz.wav');
  ff(['-y','-f','lavfi','-i','sine=frequency=440:duration=4:sample_rate=48000','-c:a','pcm_f32le',input]);
  const results=[];
  for(const [speed,semitones] of [[1,1],[1.15,0],[1.15,1],[1.2,2]]){
    const output=path.join(out,`engineering-${speed}x-${semitones}st.mp3`);
    const result=await processVariant(input,output,speed,semitones,tools,-21);
    const decoded=pcm(output),measuredHz=frequency(decoded),decodedSeconds=decoded.length/(4*48000);
    const expectedHz=440*2**(semitones/12),expectedSeconds=4/speed;
    if(Math.abs(measuredHz-expectedHz)>1||Math.abs(decodedSeconds-expectedSeconds)>0.08||result.mastered.after.truePeakDBTP> -1)throw new Error('Independent pitch/speed engineering check failed.');
    results.push({speed,semitones,measuredHz,expectedHz,decodedSeconds,expectedSeconds,truePeakDBTP:result.mastered.after.truePeakDBTP});
  }
  const report={fixture:'Synthetic engineering tone, not Adam or any narrator; no API calls',results};
  await fs.writeFile(path.join(out,'DSP_SELFTEST.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
async function variants(input,metadataFile,out){
  if(!input||!metadataFile||!out)throw new Error('Use variants INPUT.mp3 METADATA.json OUTPUT_DIRECTORY.');
  out=path.resolve(out);await fs.mkdir(out,{recursive:true});
  const bytes=await fs.readFile(input),metadata=JSON.parse(await fs.readFile(metadataFile,'utf8'));
  if(metadata.narrator?.voiceId!=='pNInz6obpgDQGcFmaJgB'||metadata.narrator.settings.speed!==1||metadata.audioHash!==sha(bytes))throw new Error('Input is not the verified natural-speed Adam recording.');
  const tools=await audioTools(out),info=await tools.inspectAudio(input),sourceLoudness=await tools.measureLoudness(input);
  if(sourceLoudness.truePeakDBTP> -1)throw new Error('Source requires safe mastering before comparison.');
  const targetLUFS=Math.max(-24,Math.min(-14,sourceLoudness.integratedLUFS)),sourceSeconds=pcm(input).length/(4*48000);
  const specs=[['Adam_Original_1.00x_0st.mp3',1,0],['Adam_1.15x_plus1st.mp3',1.15,1],['Adam_1.20x_plus2st.mp3',1.2,2]],results=[];
  for(const [name,speed,semitones] of specs){
    const output=path.join(out,name);if(path.resolve(input)===output)throw new Error('Comparison output would overwrite its source.');
    if(speed===1&&semitones===0){await fs.copyFile(input,output);results.push({name,speed,semitones,unchangedSourceCopy:true,info,loudness:sourceLoudness,sha256:sha(bytes)});continue;}
    const result=await processVariant(input,output,speed,semitones,tools,targetLUFS);
    if(Math.abs(result.decodedSeconds-sourceSeconds/speed)>0.1)throw new Error('Offline variant duration differs from requested tempo; inspect before delivery.');
    results.push({name,...result,sha256:sha(await fs.readFile(output))});
  }
  await fs.writeFile(path.join(out,'ADAM_VARIANTS_QA.json'),JSON.stringify({source:path.resolve(input),sourceSHA256:sha(bytes),voiceId:metadata.narrator.voiceId,script:metadata.script,paidGenerationRequests:0,formants:'preserved',results},null,2)+'\n');
  console.log(JSON.stringify({offlineOnly:true,results},null,2));
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  try{
    if(process.argv[2]==='selftest')await selftest();
    else if(process.argv[2]==='variants')await variants(...process.argv.slice(3));
    else throw new Error('Use selftest or variants INPUT.mp3 METADATA.json OUTPUT_DIRECTORY.');
  }catch(error){console.error(error instanceof Error?error.message:'Offline audio processing failed.');process.exitCode=1;}
}
