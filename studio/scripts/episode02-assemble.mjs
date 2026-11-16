import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=path.resolve('out/v2-episodes/in-this-town-02');
const manifest=JSON.parse(await fs.readFile(path.join(out,'EP02_SHOT_MANIFEST.json'),'utf8'));
const mode=process.argv[2]??'render',preview=mode==='preview';
if(!['preview','render'].includes(mode))throw Error('Use preview or render.');
const dir=path.join(out,preview?'preview-segments':'segments');
const files=[];
const signatures=new Set();
for(const s of manifest.shots){
 const file=path.join(dir,s.id+'.mp4');
 const meta=JSON.parse(await fs.readFile(file.replace(/\.mp4$/,'.json'),'utf8'));
 const bytes=await fs.readFile(file);
 const sha=createHash('sha256').update(bytes).digest('hex');
 if(meta.sha256!==sha||meta.start!==s.start||meta.end!==s.end||meta.preview!==preview)
  throw Error('Missing or stale segment '+s.id);
 signatures.add(meta.propsHash+':'+meta.sourceHash);
 files.push(file);
}
if(signatures.size!==1)throw Error('Mixed episode source hashes; refuse assembly.');
const list=path.join(out,preview?'PREVIEW_CONCAT_LIST.txt':'CONCAT_LIST.txt');
await fs.writeFile(list,files.map(f=>"file '"+f.replaceAll('\\','/').replaceAll("'","'\\''")+"'").join('\n')+'\n');
const visual=path.join(out,preview?'EP02_540p_Visual.mp4':'EP02_1080p_Visual.mp4');
execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y',
 '-f','concat','-safe','0','-i',list,
 '-map','0:v:0','-an','-c:v','copy','-movflags','+faststart',visual]);
const meta={stage:'ASSEMBLED_NOT_REVIEWED',framesExpected:manifest.durationInFrames,
 container:visual,preview,segments:files.length,sourceAndPropsHashes:[...signatures][0]};
await fs.writeFile(path.join(out,preview?'PREVIEW_ASSEMBLY.json':'VISUAL_ASSEMBLY.json'),JSON.stringify(meta,null,2)+'\n');
console.log(JSON.stringify(meta));
