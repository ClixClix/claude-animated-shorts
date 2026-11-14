import {createHash,randomUUID} from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {NarrationError} from './errors';
import {inspectAudio} from './audio';
export const sha256=(data:string|Buffer)=>createHash('sha256').update(data).digest('hex');
function stable(value:unknown):unknown{if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));return value;}
export const cacheIdentity=(request:unknown)=>sha256(JSON.stringify(stable({engineVersion:1,...request as object})));
export async function atomicJSON(file:string,value:unknown){const tmp=file+'.'+randomUUID()+'.tmp';await fs.writeFile(tmp,JSON.stringify(value,null,2)+'\n',{mode:0o600});await fs.rename(tmp,file);}
export class NarrationCache{
 constructor(readonly root:string){}
 directory(key:string){if(!/^[a-f0-9]{64}$/.test(key))throw new NarrationError('INVALID_CACHE_KEY','Invalid narration cache key.');return path.join(this.root,key);}
 async lookup<T extends {audioHash:string;duration:number;cacheKey:string;identity:unknown}>(key:string):Promise<{metadata:T;audio:string}|null>{
  const dir=this.directory(key),meta=path.join(dir,'metadata.json'),audio=path.join(dir,'master.mp3');
  try{await fs.access(dir);}catch{return null;}
  try{
   const m=JSON.parse(await fs.readFile(meta,'utf8')) as T;
   if(m.cacheKey!==key||cacheIdentity(m.identity)!==key)throw new Error();
   if(m.audioHash!==sha256(await fs.readFile(audio)))throw new Error();const info=await inspectAudio(audio);
   if(Math.abs(info.duration-m.duration)>0.08)throw new Error();return {metadata:m,audio};
  }catch{throw new NarrationError('CACHE_CORRUPT','Cached audio is missing, incomplete or corrupt. It was not regenerated automatically. Recover retained raw audio or deliberately request --regenerate after paid approval.');}
 }
 async lock<T>(key:string,work:()=>Promise<T>):Promise<T>{
  await fs.mkdir(this.root,{recursive:true});const lock=path.join(this.root,key+'.lock');
  let handle:fs.FileHandle;
  try{handle=await fs.open(lock,'wx',0o600);}catch{throw new NarrationError('CACHE_BUSY','Another generation holds this cache lock. Do not retry a potentially billable request. If a process crashed, confirm it stopped before manually removing its .lock file.');}
  try{await handle.writeFile(JSON.stringify({pid:process.pid,created:new Date().toISOString()}));return await work();}
  finally{await handle.close();await fs.rm(lock,{force:true});}
 }
 async begin(key:string){const dir=this.directory(key);await fs.mkdir(dir,{recursive:true});return dir;}
}
