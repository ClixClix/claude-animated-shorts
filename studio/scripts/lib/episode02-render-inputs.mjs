import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

export const SIGNATURE_VERSION=2;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const slash=s=>s.replaceAll('\\','/');
const exists=async p=>fs.access(p).then(()=>true,()=>false);
export function canonicalJSON(value){
 if(Array.isArray(value))return '['+value.map(canonicalJSON).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonicalJSON(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export const renderProps=(props,preview)=>({...props,previewScale:preview?.5:1,optimize:true});

/** Follow the actual composition entry's imports; never maintain a manual list. */
export async function renderInputs(studio,props,preview){
 const graph=await build({absWorkingDir:studio,entryPoints:['src/index.ts'],bundle:true,
  write:false,metafile:true,packages:'external',platform:'browser',format:'esm',
  outdir:path.join(studio,'out/v2-episodes/in-this-town-02/.dependency-probe'),
  loader:{'.glsl':'text','.png':'dataurl','.jpg':'dataurl','.jpeg':'dataurl','.svg':'dataurl','.glb':'binary'},logLevel:'silent'});
 const files=new Set(Object.keys(graph.metafile.inputs).map(p=>path.resolve(studio,p)));
 for(const rel of ['package.json','package-lock.json','tsconfig.json','remotion.config.ts',
  'scripts/episode02-render.mjs','scripts/lib/episode02-render-inputs.mjs',
  ...['three','remotion','@remotion/renderer','@remotion/bundler'].map(p=>'node_modules/'+p+'/package.json')]){
  const p=path.join(studio,rel);if(await exists(p))files.add(p);
 }
 const sources=await Promise.all([...files].sort().map(async file=>({file:slash(path.relative(studio,file)),sha256:hash(await fs.readFile(file))})));
 return {signatureVersion:SIGNATURE_VERSION,sourceHash:hash(JSON.stringify({version:SIGNATURE_VERSION,sources})),
  propsHash:hash(canonicalJSON(renderProps(props,preview))),sources};
}

/** Recheck the captured dependency set against concurrent source edits. */
export async function requireUnchangedInputs(studio,snapshot){
 const changed=[];
 for(const item of snapshot.sources){
  const current=await fs.readFile(path.resolve(studio,item.file)).catch(()=>null);
  if(current===null||hash(current)!==item.sha256)changed.push(item.file);
 }
 if(changed.length)throw Error('Source changed during rendering: '+changed.join(', ')+'. Completed source-matched work is retained; rerun after finishing edits.');
}

export async function segmentMatches({file,metadata,shot,inputs,preview}){
 if(!metadata||metadata.signatureVersion!==SIGNATURE_VERSION||metadata.preview!==preview||
   metadata.sourceHash!==inputs.sourceHash||metadata.propsHash!==inputs.propsHash||
   metadata.start!==shot.start||metadata.end!==shot.end)return false;
 const bytes=await fs.readFile(file).catch(()=>null);
 return bytes!==null&&hash(bytes)===metadata.sha256;
}
