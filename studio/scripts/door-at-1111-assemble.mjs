// Offline assembly of independently rendered, native-resolution Remotion shot segments.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const out=path.resolve('out/v2-episodes/door-at-1111');
const manifest=JSON.parse(await fs.readFile(path.join(out,'The_Door_At_1111_Shot_Manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
props.optimize=true;props.previewScale=1;
const propsHash=hash(JSON.stringify(props));
const roots=['src/v2/episodes/door-at-1111','src/v2/cats','src/v2/cafe','src/v2/animation','src/videos/bridge'];
const sources=(await Promise.all(roots.map(async root=>(await fs.readdir(root,{recursive:true})).filter(f=>/\.tsx?$/.test(f)&&!f.startsWith('audio/')).sort().map(f=>path.join(root,f))))).flat();
const sourceHash=hash((await Promise.all(sources.map(async p=>p+'\n'+await fs.readFile(p,'utf8')))).join('\n'));
const probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
const report={sourceHash,propsHash,durationInFrames:manifest.durationInFrames,segments:[],visibilityFlags:[],cameraFlags:[],browserErrors:[]};
let cursor=0;
for(const shot of manifest.shots){
 const file=path.join(out,'segments',shot.id+'.mp4'),saved=JSON.parse(await fs.readFile(file.replace('.mp4','.json'),'utf8')),media=probe(file),v=media.streams.find(s=>s.codec_type==='video');
 if(shot.start!==cursor||shot.end-shot.start>120)throw Error('Invalid cut boundary '+shot.id);
 if(saved.sourceHash!==sourceHash||saved.propsHash!==propsHash)throw Error('Stale render '+shot.id);
 if(saved.range.join()!==[shot.start,shot.end-1].join())throw Error('Partial render '+shot.id);
 if(v.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1'||Number(v.nb_frames)!==shot.end-shot.start||v.codec_name!=='h264')throw Error('Incorrect native segment '+shot.id);
 const seen=new Set(saved.audits.map(a=>a.frame));
 for(let f=shot.start;f<shot.end;f++)if(!seen.has(f))throw Error('Missing per-frame scene audit '+shot.id+' '+f);
 for(const a of saved.audits){
  if(a.cameraHits.length)report.cameraFlags.push({frame:a.frame,shot:shot.id,hits:a.cameraHits});
  for(const p of a.visibility)if(!p.inFrame||p.occluder)report.visibilityFlags.push({frame:a.frame,shot:shot.id,...p});
 }
 report.browserErrors.push(...saved.errors);
 report.segments.push({id:shot.id,file,frames:Number(v.nb_frames),seconds:saved.seconds,sha256:hash(await fs.readFile(file))});cursor=shot.end;
}
if(cursor!==manifest.durationInFrames||report.browserErrors.length)throw Error('Incomplete episode or browser errors.');
const list=path.join(out,'native-segments.txt');
await fs.writeFile(list,report.segments.map(s=>"file '"+s.file.replaceAll("'","'\\''")+"'").join('\n')+'\n');
const master=path.join(out,'The_Door_At_1111_Visual_Master.mp4');
execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-f','concat','-safe','0','-i',list,'-map','0:v:0','-c:v','copy','-an','-movflags','+faststart',master]);
const media=probe(master),video=media.streams.find(s=>s.codec_type==='video');
if(Number(video.nb_frames)!==cursor||Math.abs(Number(media.format.duration)-cursor/30)>.04)throw Error('Assembly duration mismatch.');
report.master={file:master,frames:Number(video.nb_frames),duration:Number(media.format.duration),width:video.width,height:video.height,fps:video.r_frame_rate,sha256:hash(await fs.readFile(master))};
await fs.mkdir(path.join(out,'storyboard'),{recursive:true});
for(const shot of manifest.shots){
 const f=shot.start+Math.floor((shot.end-shot.start)*.60);
 execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-i',path.join(out,'segments',shot.id+'.mp4'),'-vf',`select=eq(n\\,${f-shot.start})`,'-frames:v','1','-update','1',path.join(out,'storyboard',shot.id+'.png')]);
}
await fs.writeFile(path.join(out,'NATIVE_RENDER_QA.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({master:report.master,shots:report.segments.length,visibilityFlags:report.visibilityFlags.length,cameraFlags:report.cameraFlags.length}));
