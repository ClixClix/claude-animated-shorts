import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hash,visualSourceHash,validSegment,probe} from './lib/polish-cache.mjs';
// Run only after real local half-resolution renders. Never substitutes stills or generates speech.
const out=path.resolve('out/v2-episodes/door-at-1111-polish');
const plan=JSON.parse(await fs.readFile(path.join(out,'The_Door_At_1111_Polish_Shot_Manifest.json'),'utf8'));
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));props.optimize=true;props.previewScale=.5;
const sourceHash=await visualSourceHash(),propsHash=hash(JSON.stringify(props)),files=[],visibilityFlags=[];
for(const shot of plan.shots){
 const file=path.join(out,'motion',shot.id+'.mp4');
 if(!await validSegment(file,shot,sourceHash,propsHash,.5))throw Error('Missing, partial or stale preview shot '+shot.id+'. Run Preview-Polish.cmd again to resume.');
 const saved=JSON.parse(await fs.readFile(file.replace(/\.mp4$/,'.json'),'utf8'));
 if(saved.audits.some(a=>a.sourceShot<50&&a.openerVisible))throw Error('Opener exposed before mystery reveal in '+shot.id);
 if(saved.audits.some(a=>a.sourceShot<46&&(a.kittenVisible||a.kittenPawVisible)))throw Error('Early kitten reveal in preview '+shot.id);
 if(saved.audits.some(a=>a.baseFrame>=29*30&&a.streetResidentsVisible))throw Error('Street crowd remains after curfew in '+shot.id);
 if(saved.audits.some(a=>a.cameraHits.length))throw Error('Camera collision in preview '+shot.id);
 saved.audits.forEach(a=>a.visibility.filter(v=>!v.inFrame||v.occluder).forEach(v=>visibilityFlags.push({frame:a.frame,shot:shot.id,...v})));
 files.push(file);
}
const list=path.join(out,'preview-segments.txt');
await fs.writeFile(list,files.map(file=>"file '"+file.replaceAll('\\','/').replaceAll("'","'\\''")+"'").join('\n')+'\n');
const audio=await import(pathToFileURL(path.join(out,'audio-tools.mjs')).href),stem=path.join(out,'Narration_Stem.wav');
const loudness=await audio.measureLoudness(stem),gain=Math.min(-16-loudness.integratedLUFS,-1.8-loudness.truePeakDBTP),duration=plan.durationInFrames/30;
const final=path.join(out,`Polish_Review_${sourceHash.slice(0,8)}_540p.mp4`),pending=path.join(out,'Polish_Narrated_Review_540p.partial.mp4');
const ff=args=>execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error',...args],{maxBuffer:8*1024*1024});
ff(['-y','-f','concat','-safe','0','-i',list,'-i',stem,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',`volume=${gain}dB,apad=whole_dur=${duration},atrim=end=${duration}`,'-c:a','aac','-b:a','160k','-ar','48000','-t',String(duration),'-metadata',`comment=What If Cats V2 source=${sourceHash} props=${propsHash}`,'-movflags','+faststart',pending]);
let encoded=await audio.measureLoudness(pending);
if(encoded.truePeakDBTP> -1){const safe=path.join(out,'Polish_Narrated_Review_540p.safe.mp4');await audio.finalizeVideoAudio(pending,safe);await fs.rename(safe,pending);encoded=await audio.measureLoudness(pending);}
if(encoded.truePeakDBTP> -1)throw Error('Preview encoded audio peak exceeds -1 dBTP.');
const video=probe(pending).streams.find(s=>s.codec_type==='video');
if(video.width!==540||video.height!==960||video.r_frame_rate!=='30/1'||Number(video.nb_frames)!==plan.durationInFrames)throw Error('Preview format/duration mismatch.');
ff(['-i',pending,'-f','null','-']);await fs.rename(pending,final);await fs.copyFile(final,path.join(out,'Polish_Narrated_Review_540p.mp4'));
await fs.writeFile(path.join(out,'PREVIEW_QA.json'),JSON.stringify({file:final,sourceHash,propsHash,frames:Number(video.nb_frames),width:540,height:960,fps:30,duration,encoded,visibilityFlags,narration:'Existing continuous cached take; no synthesis',visualApproval:'Pending actual local review against reference shorts',musicAndSFX:'Native final finishing remains a separate stage'},null,2)+'\n');
console.log('Full narrated preview: '+final);console.log('Review visibility notes in PREVIEW_QA.json. Native rendering/music finishing remain separate.');
