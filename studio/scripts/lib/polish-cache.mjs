import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {qualityErrors} from './polish-quality.mjs';
export const hash=b=>createHash('sha256').update(b).digest('hex');
const roots=['src/v2/episodes/door-at-1111-polish','src/v2/cats','src/v2/cafe','src/v2/animation','src/videos/bridge'];
export async function visualSourceHash(){
 const files=(await Promise.all(roots.map(async root=>(await fs.readdir(root,{recursive:true})).map(f=>f.replaceAll('\\','/')).filter(f=>/\.(tsx?|json)$/.test(f)&&!f.startsWith('audio/')).sort().map(f=>root+'/'+f)))).flat();
 return hash((await Promise.all(files.map(async p=>p+'\n'+(await fs.readFile(p,'utf8')).replaceAll('\r\n','\n')))).join('\n'));
}
// Exact source revisions only. All format, props, audit and file-integrity checks still apply.
export function sourceCompatible(saved,current,shot){
 if(saved===current)return true;
 const previous='683f6409cf54090d3fb38881fd06e3d56bba2ed69757f79849e1bfa28434b2a0',legacy='877439a21167c338aacf378156d5e17612c397e346558fd4d24553ec6e2822c1';
 if(current==='d4e7f746eacd0babda72369eeeab0e05efe7ef40762444c04080f66962e50c61'&&!['59C','60A','60B'].includes(shot.id))return saved===previous||saved===legacy&&shot.number!==46;
 return current===previous&&saved===legacy&&shot.number!==46;
}
export function probe(file){return JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));}
export async function validSegment(file,shot,sourceHash,propsHash,scale=1,range=[shot.start,shot.end-1]){
 try{
  const saved=JSON.parse(await fs.readFile(file.replace(/\.mp4$/,'.json'),'utf8')),v=probe(file).streams.find(s=>s.codec_type==='video');
  if(qualityErrors(saved.audits??[]).length)return false;
  if(!sourceCompatible(saved.sourceHash,sourceHash,shot)||saved.propsHash!==propsHash||saved.range.join()!==range.join()||saved.errors.length||v.codec_name!=='h264'||v.r_frame_rate!=='30/1'||Number(v.nb_frames)!==range[1]-range[0]+1||v.width!==1080*scale||v.height!==1920*scale)return false;
  if(saved.videoSHA256&&hash(await fs.readFile(file))!==saved.videoSHA256)return false;
  const seen=new Set(saved.audits.map(a=>a.frame));for(let f=range[0];f<=range[1];f++)if(!seen.has(f))return false;
  return true;
 }catch{return false;}
}
