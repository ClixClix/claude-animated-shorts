import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {renderInputs,segmentMatches,requireUnchangedInputs,canonicalJSON} from './lib/episode02-render-inputs.mjs';
const out=path.resolve('out/v2-episodes/in-this-town-02');
const manifest=JSON.parse(await fs.readFile(path.join(out,'EP02_SHOT_MANIFEST.json'),'utf8'));
const mode=process.argv[2]??'render',preview=mode==='preview';
if(!['preview','render'].includes(mode))throw Error('Use preview or render.');
const dir=path.join(out,preview?'preview-segments':'segments');
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
if(canonicalJSON(manifest.shots)!==canonicalJSON(props.shots))throw Error('Manifest and live render props differ; reconcile the existing edit before assembly.');
const inputs=await renderInputs(process.cwd(),props,preview);
const files=[],stale=[];
const signatures=new Set();
for(const s of manifest.shots){
 const file=path.join(dir,s.id+'.mp4');
 const meta=await fs.readFile(file.replace(/\.mp4$/,'.json'),'utf8').then(JSON.parse).catch(()=>null);
 if(!await segmentMatches({file,metadata:meta,shot:s,inputs,preview})){
  stale.push(s.id);continue;
 }
 signatures.add(meta.propsHash+':'+meta.sourceHash);
 files.push(file);
}
if(stale.length)throw Error('Missing, corrupt or stale segments for CURRENT source/edit: '+stale.join(', ')+'. Rerun episode02-render.mjs '+mode+'; valid current segments will be reused.');
if(signatures.size!==1)throw Error('Mixed episode source hashes; refuse assembly.');
const list=path.join(out,preview?'PREVIEW_CONCAT_LIST.txt':'CONCAT_LIST.txt');
await fs.writeFile(list,files.map(f=>"file '"+f.replaceAll('\\','/').replaceAll("'","'\\''")+"'").join('\n')+'\n');
const visual=path.join(out,preview?'EP02_540p_Visual.mp4':'EP02_1080p_Visual.mp4');
const partial=visual+'.partial.mp4';
await requireUnchangedInputs(process.cwd(),inputs);
execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y',
 '-f','concat','-safe','0','-i',list,
 '-map','0:v:0','-an','-c:v','copy','-movflags','+faststart',partial]);
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',partial],{encoding:'utf8'}));
const v=probe.streams.find(s=>s.codec_type==='video');
if(!v||Number(v.nb_frames)!==manifest.durationInFrames||v.width!==(preview?540:1080)||v.height!==(preview?960:1920)||v.r_frame_rate!=='30/1'||Math.abs(Number(probe.format.duration)-manifest.durationInFrames/30)>.1)throw Error('Assembled frame count, format or duration differs from the live edit. Previous movie retained.');
await requireUnchangedInputs(process.cwd(),inputs);
await fs.rename(partial,visual);
const meta={stage:'ASSEMBLED_NOT_REVIEWED',signatureVersion:inputs.signatureVersion,sourceHash:inputs.sourceHash,propsHash:inputs.propsHash,framesExpected:manifest.durationInFrames,
 container:visual,preview,segments:files.length,sourceAndPropsHashes:[...signatures][0]};
await fs.writeFile(path.join(out,preview?'PREVIEW_ASSEMBLY.json':'VISUAL_ASSEMBLY.json'),JSON.stringify(meta,null,2)+'\n');
console.log(JSON.stringify(meta));
