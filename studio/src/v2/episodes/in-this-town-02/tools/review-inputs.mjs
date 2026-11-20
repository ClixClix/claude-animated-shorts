import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const studioRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../..');
export const output=path.join(studioRoot,'out/v2-episodes/in-this-town-02');
export async function readProps(){
  const file=path.join(output,'render-props.json');
  try{return JSON.parse(await fs.readFile(file,'utf8'));}
  catch(error){
    if(error.code==='ENOENT')throw Error('Missing live Episode 02 render-props.json in '+output+'. Restore the existing Adam-aligned edit first.');
    throw error;
  }
}

export function selectReviewShots(shots,requested){
  if(!Array.isArray(shots)||!shots.length)throw Error('The live edit has no shots.');
  if(requested===undefined)return shots;
  const tokens=requested.split(',').map(token=>token.trim().toUpperCase());
  const matched=new Set();
  for(const token of tokens){
    if(!/^\d{1,2}[A-Z]*$/.test(token))throw Error('Invalid shot selection: '+token);
    const [,number,suffix]=token.match(/^(\d{1,2})([A-Z]*)$/);
    const exactId=number.padStart(2,'0')+suffix;
    const hits=suffix
      ?shots.filter(shot=>shot.id===exactId)
      :shots.filter(shot=>shot.sequence===Number(number));
    if(!hits.length)throw Error('Shot not found in the live edit: '+token);
    for(const shot of hits)matched.add(shot.id);
  }
  return shots.filter(shot=>matched.has(shot.id));
}

export async function reviewFingerprint(){
  const hash=createHash('sha256');
  hash.update(await fs.readFile(path.join(output,'render-props.json')));
  const files=(await fs.readdir(path.join(studioRoot,'src'),{recursive:true}))
    .map(file=>file.replaceAll('\\','/')).filter(file=>/\.(tsx?|json)$/.test(file)).sort();
  for(const file of files){
    hash.update('\0'+file+'\0');
    hash.update(await fs.readFile(path.join(studioRoot,'src',file)));
  }
  return hash.digest('hex');
}

export async function requireReviewStills(requested){
  const shots=selectReviewShots((await readProps()).shots,requested);
  const directory=path.join(output,'three-frame-review');
  const report=await fs.readFile(path.join(directory,'THREE_FRAME_REVIEW.json'),'utf8').then(JSON.parse)
    .catch(()=>{throw Error('Run the Stills stage for these shots first.');});
  if(report.sourceFingerprint!==await reviewFingerprint())throw Error('Source or edit changed since the stills. Run Stills again for these shots.');
  for(const shot of shots){
    for(const [point,frame] of [['start',shot.start],['middle',shot.start+Math.floor((shot.end-shot.start-1)/2)],['end',shot.end-1]]){
      const match=report.frames?.find(item=>item.shot===shot.id&&item.point===point&&item.frame===frame);
      if(!match||!/^shot_\w+_(start|middle|end)_\d+\.png$/.test(match.file))throw Error('Missing '+point+' PNG for '+shot.id+'. Run Stills for the same shot list.');
      await fs.access(path.join(directory,match.file));
    }
  }
  return shots.map(shot=>shot.id).join(',');
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  console.log(await requireReviewStills(process.argv[2]));
}
