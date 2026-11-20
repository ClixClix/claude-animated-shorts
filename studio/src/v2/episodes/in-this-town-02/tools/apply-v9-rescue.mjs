#!/usr/bin/env node
/**
 * Apply only the inspected V9 Episode 02 rescue repair. Scene-local changes,
 * no replacement engine, camera rig, global wrapper, narration or music.
 * Default is dry run; --apply backs up first; unknown hashes abort.
 * From studio/:
 * node src/v2/episodes/in-this-town-02/tools/apply-v9-rescue.mjs --apply
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const scene=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const studio=path.resolve(scene,'../../../..');
const out=path.join(studio,'out/v2-episodes/in-this-town-02');
const hashes={
  'Episode.tsx':'9fa8bc1e480e49dc76fe5dea080eaec9b33cbb85c0353a20851294be4c08545f',
  'boxProps.ts':'67c1dc99ab62afb9975f86f4d262f331d638d057cb8c59f7df8e28788e773976',
  'cameraDirector.ts':'81db2f6d0c005e62daea979aa221776ffd8af49c5e8144ff096bc9ea0b81964d',
  'episode1Cast.ts':'4da7103dd65ed4c19e162bbc07c2a9b9e674859cc763cd83bbcfeb7976a9348f',
  'timeline.ts':'fc2933e1a28b87abcbe4145579ec895c63b8fe5d9f6a87219ba90d3d13b27e1a'
};
const sha=s=>createHash('sha256').update(s).digest('hex');
const original={},sourceBytes={};
for(const [name,expected] of Object.entries(hashes)){
  const raw=await fs.readFile(path.join(scene,name),'utf8');
  const code=raw.replaceAll('\r\n','\n');
  if(sha(raw)!==expected&&sha(code)!==expected)throw Error('LOCAL_SOURCE_MISMATCH: '+name+
    ' has newer/different content; refusing all writes. Local files preserved.');
  sourceBytes[name]=raw;
  original[name]=code;
}
function once(code,oldText,newText,desc){
  const index=code.indexOf(oldText);
  if(index<0||code.indexOf(oldText,index+1)>=0)
    throw Error('Expected V9 anchor missing or duplicated: '+desc);
  return code.slice(0,index)+newText+code.slice(index+oldText.length);
}
function between(code,begin,end,replacement,desc){
  const a=code.indexOf(begin),b=a<0?-1:code.indexOf(end,a+begin.length);
  if(a<0||b<a||code.indexOf(begin,a+1)>=0)
    throw Error('Unexpected V9 section: '+desc);
  return code.slice(0,a)+replacement+code.slice(b);
}
const lines=arr=>arr.join('\n')+'\n';
const updated={};
let box=original['boxProps.ts'];
box=between(box,
  '  // V9 rescue exit: a true bottom-hinged front panel.',
  "  panel(root,spec.id+'-back'",
  lines([
    '  // The full four-sided box tips around its planted front-bottom edge.',
    "  panel(root,spec.id+'-front',[w,h,thick],[0,h/2+.04,d/2-thick/2]);"
  ]),'rigid front wall');
box=between(box,'  function setExitOpening(input:number){','  function dispose(){','',
  'remove fake walk-through door');
box=once(box,'return {root,spec,flaps,setOpenAmount,setExitOpening,dispose};',
  'return {root,spec,flaps,setOpenAmount,dispose};','box public API');
updated['boxProps.ts']=box;
let timeline=original['timeline.ts'];
timeline=once(timeline,
  "import type {V3} from '../../cafe/config';",
  "import type {V3} from '../../cafe/config';\nimport {BOX_SPECS} from './boxProps';",
  'shared box spec');
timeline=once(timeline,
  'export const mix=(a:V3,b:V3,t:number):V3=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];',
  lines([
    'export const mix=(a:V3,b:V3,t:number):V3=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];',
    '// Box and actors share the same front-edge tip transform.',
    'export const RESCUE_MAX_TIP=1.46;',
    'export function rescueTipAngle(beat:number,u:number){',
    ' return beat===51?RESCUE_MAX_TIP*ease((u-.10)/.43):',
    '  beat===52?RESCUE_MAX_TIP:0;',
    '}',
    'export function tippedEssieRoot(base:V3,angle:number):V3{',
    ' const front=BOX_SPECS.essie.depth/2;',
    ' return [base[0],base[1]+front*Math.sin(angle),base[2]+front*(1-Math.cos(angle))];',
    '}',
    'export function tippedEssieInterior(base:V3,local:V3,angle:number):V3{',
    ' const p=tippedEssieRoot(base,angle);',
    ' const cosine=Math.cos(angle),sine=Math.sin(angle);',
    ' return [p[0]+local[0],p[1]+local[1]*cosine-local[2]*sine,',
    '  p[2]+local[1]*sine+local[2]*cosine];',
    '}'
  ]).trimEnd(),'tip math');
timeline=between(timeline,
  '  if(n===51){\n   // V9:',
  '  cam=(n===35',
  lines([
    '  if(n===51){',
    '   // Locked rescue: intact box tips, Essie tumbles onto Mocha.',
    '   // Characters follow its rotating interior, then exit via the open top.',
    '   const angle=rescueTipAngle(n,u);',
    '   const insideMocha=tippedEssieInterior(essieBox,[-.40,.13,.12],angle);',
    '   const insideEssie=tippedEssieInterior(essieBox,[ .40,.13,-.12],angle);',
    '   const mochaFall=ease((u-.49)/.29);',
    '   const essieFall=ease((u-.57)/.29);',
    '   const mochaLand:V3=[essieBox[0]-.30,0,3.14];',
    '   const essieLand:V3=[essieBox[0]+.08,0,3.17];',
    '   mocha.position=mix(insideMocha,mochaLand,mochaFall);',
    '   essie.position=mix(insideEssie,essieLand,essieFall);',
    '   mocha.scale=.84+.16*ease((u-.67)/.20);',
    '   essie.scale=.84+.16*ease((u-.72)/.17);',
    '   mocha.walking=false;essie.walking=false;',
    "   mocha.emotion='surprised';essie.emotion='happy';",
    '  }',
    '  if(n===52){',
    '   // Contact positions exactly match the end of shot 51.',
    '   mocha.position=[essieBox[0]-.30,0,3.14];',
    '   essie.position=[essieBox[0]+.08,0,3.17];',
    '   mocha.scale=essie.scale=1;',
    '  }'
  ]),'restore locked rescue');
updated['timeline.ts']=timeline;
let cast=original['episode1Cast.ts'];
cast=once(cast,
  '       n===50?1-smooth((s.u-.42)/.55):\n       n===51?1-smooth((s.u-.32)/.22):',
  '       n===50?1:\n       n===51?1-smooth((s.u-.71)/.16):',
  'Essie pose must not pop from upright to curled at shot cut');
cast=once(cast,'      n===51?1-smooth((s.u-.64)/.22):',
  '      n===51?1-smooth((s.u-.66)/.20):',
  'Mocha pose follows physically grounded exit');
updated['episode1Cast.ts']=cast;
let episode=original['Episode.tsx'];
episode=once(episode,
  "import {SCRATCH_EDIT,stateAt,clamp,ease,type EpisodeEdit,type ActorPose,type State} from './timeline';",
  "import {SCRATCH_EDIT,stateAt,clamp,ease,rescueTipAngle,tippedEssieRoot,type EpisodeEdit,type ActorPose,type State} from './timeline';",
  'scene-local tip imports');
episode=between(episode,
  '  b.obj.root.position.set(...b.pos);',
  ' // The long right-hand flap',
  lines([
    "  const tip=b.key==='essie'?rescueTipAngle(n,s.u):0;",
    "  const planted=b.key==='essie'?tippedEssieRoot(b.pos,tip):b.pos;",
    '  b.obj.root.position.set(...planted);',
    '  b.obj.root.rotation.x=tip;',
    '  b.obj.root.visible=b.visible;',
    '  b.obj.setOpenAmount(b.flap);',
    ' }',
    ' // No box wall or front flap disappears during the rescue.',
    ' boxes.essie.flaps.front.visible=true;'
  ]),'rotate intact box instead of opening a door');
// Preserve V9's existing environment batching and scene optimization policy.
// The rescue repair must NOT modify the world constructor or global/shot batching.
updated['Episode.tsx']=episode;
for(const name of Object.keys(updated)){
  if(sourceBytes[name].includes('\r\n'))updated[name]=updated[name].replaceAll('\n','\r\n');
}
if(!process.argv.includes('--apply')){
  console.log(JSON.stringify({status:'DRY_RUN',source:'exact V9 only',
    files:Object.keys(updated),changedHashes:Object.fromEntries(
      Object.entries(updated).map(([k,v])=>[k,sha(v)])),
    renderAndVisualReviewStillRequired:true},null,2));
}else{
  await fs.mkdir(out,{recursive:true});
  const backup=path.join(out,'phase4-backup-'+new Date().toISOString().replace(/[:.]/g,'-'));
  await fs.mkdir(backup,{recursive:true});
  for(const name of Object.keys(updated))
    await fs.writeFile(path.join(backup,name),sourceBytes[name],'utf8');
  const staged=new Map(),installed=[];
  try{
    for(const [name,code] of Object.entries(updated)){
      const temp=path.join(scene,name+'.'+path.basename(backup)+'.pending');
      await fs.writeFile(temp,code,{flag:'wx'});
      staged.set(name,temp);
    }
    for(const name of Object.keys(sourceBytes)){
      const live=await fs.readFile(path.join(scene,name),'utf8');
      if(live!==sourceBytes[name])throw Error('Scene changed during repair: '+name);
    }
    for(const [name,temp] of staged){
      const target=path.join(scene,name);
      if(await fs.readFile(target,'utf8')!==sourceBytes[name])throw Error('Scene changed during repair: '+name);
      await fs.rename(temp,target);
      installed.push(name);
    }
  }catch(error){
    for(const name of installed){
      const target=path.join(scene,name);
      if(await fs.readFile(target,'utf8')===updated[name])await fs.copyFile(path.join(backup,name),target);
    }
    throw new Error('Repair interrupted. Original files saved in '+backup,{cause:error});
  }finally{
    for(const temp of staged.values())await fs.rm(temp,{force:true});
  }
  const report={
    status:'SOURCE_CHANGED__VISUAL_REVIEW_PENDING',
    files:Object.keys(updated),backup,
    hashes:Object.fromEntries(Object.entries(updated).map(([k,v])=>[k,sha(v)])),
    directorAction:'box tips, Essie tumbles onto Mocha, embrace',
    engineModified:false,voiceModified:false,musicModified:false,
    visualApproval:false,publishingAllowed:false
  };
  await fs.writeFile(path.join(out,'PHASE4_SOURCE_REPORT.json'),
    JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
