// Restore encrypted private narration files. No API access, synthesis or video rendering.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,scryptSync,createDecipheriv,timingSafeEqual,randomUUID} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const studio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),at=args.indexOf('--unlock');
const password=at>=0?args[at+1]:process.env.V2_STORY_AUDIO_PASSWORD;
if(!password)throw Error('Supply --unlock with the transfer code from chat, or V2_STORY_AUDIO_PASSWORD. This is not an API key.');
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await fs.readFile(path.join(studio,'assets/story-polish-audio.json'),'utf8'));
const sealed=await fs.readFile(path.join(studio,'assets/story-polish-audio.payload'));
if(hash(sealed)!==manifest.sha256)throw Error('Transfer payload integrity failed. Update the source files again.');
const magic=Buffer.from('WhatIfCatsV2StoryAudioV1\n'),offset=magic.length;
if(!sealed.subarray(0,offset).equals(magic))throw Error('Unsupported audio transfer format.');
const salt=sealed.subarray(offset,offset+16),iv=sealed.subarray(offset+16,offset+28),tag=sealed.subarray(offset+28,offset+44);
let bundle;
try{
 const decipher=createDecipheriv('aes-256-gcm',scryptSync(password,salt,32,{maxmem:64*1024*1024}),iv);decipher.setAuthTag(tag);
 const compressed=Buffer.concat([decipher.update(sealed.subarray(offset+44)),decipher.final()]);
 bundle=JSON.parse(gunzipSync(compressed,{maxOutputLength:64*1024*1024}).toString('utf8'));
}catch{throw Error('Unable to unlock the private audio. Check the transfer code; existing files were not changed.');}
if(bundle.version!==1||!Array.isArray(bundle.files)||bundle.files.length!==manifest.fileCount)throw Error('Invalid transfer manifest.');
const seen=new Set(),files=[];
for(const f of bundle.files){
 const rel=f.path;
 if(typeof rel!=='string'||path.isAbsolute(rel)||rel.includes('\\')||rel.split('/').some(p=>p==='..'||p==='.'||!p)||!/^out\/v2-(narration\/story-polish|episodes\/door-at-1111-story-polish)\//.test(rel)||! /\.(mp3|json)$/.test(rel)||seen.has(rel))throw Error('Invalid private audio destination.');
 seen.add(rel);const bytes=Buffer.from(f.base64,'base64');if(hash(bytes)!==f.sha256)throw Error('Private file integrity failed.');
 const target=path.join(studio,rel);
 // Refuse replacement of a different local file; preserve every approved recording.
 let exists=false;try{const old=await fs.readFile(target);exists=true;if(!timingSafeEqual(Buffer.from(hash(old)),Buffer.from(f.sha256)))throw Error('Existing private file differs: '+rel);}catch(e){if(e.code!=='ENOENT')throw e;}
 files.push({rel,bytes,target,exists});
}
for(const f of files){
 if(!f.exists){await fs.mkdir(path.dirname(f.target),{recursive:true});const tmp=f.target+'.'+randomUUID()+'.tmp';await fs.writeFile(tmp,f.bytes,{mode:0o600});await fs.rename(tmp,f.target);}
}
console.log('Verified '+files.length+' private audio files. No provider requests or renders were made.');
console.log('Listen: '+path.join(studio,'out/v2-episodes/door-at-1111-story-polish/Narration_Story_Polish.mp3'));
console.log('The existing movie/edit is preserved. New visual synchronization is still pending.');
