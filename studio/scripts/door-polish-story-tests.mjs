// Narration drives the edit; all tests run offline and never render or call a voice provider.
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const out=path.resolve('out/v2-episodes/door-at-1111-polish');
await build({stdin:{contents:"export * from './timeline';export * from './shelter';export * from './contacts';export {FIXTURES} from '../../cafe/config';",resolveDir:path.resolve('src/v2/episodes/door-at-1111-polish'),loader:'ts'},outfile:path.join(out,'story-tools.mjs'),bundle:true,platform:'node',format:'esm'});
const t=await import(pathToFileURL(path.join(out,'story-tools.mjs')).href);
const plan=JSON.parse(await fs.readFile(path.join(out,'The_Door_At_1111_Polish_Shot_Manifest.json'),'utf8')),shots=plan.shots;
const captions=JSON.parse(await fs.readFile('src/v2/episodes/door-at-1111-polish/captions.json','utf8'));
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};
check(plan.narration.pauses.every(p=>p.at===plan.narration.sourceDuration),'Added a pause between narration lines');
check(plan.narration.pauses.reduce((n,p)=>n+p.seconds,0)<1/30,'Narration tail longer than one frame');
check(captions.every((c,i)=>!(/\s/.test(c.text.trim()))&&c.end>c.start&&c.end<=(captions[i+1]?.start??plan.durationInFrames)),'Captions must be one word, readable, non-overlapping');
for(const p of plan.narration.placements)check(Math.abs(p.targetStart-p.sourceStart)<1e-9&&Math.abs(p.targetEnd-p.sourceEnd)<1e-9,'Voice was delayed to accommodate a picture');
const shot=id=>{const q=shots.find(s=>s.id===id);check(!!q,'Missing new acting beat '+id);return q;};
const first=t.stateAt(shot('50A').start,shots),last=t.stateAt(shot('50A').end-1,shots);
check(first.required.includes('latte')&&first.latte.pose.blink>.95&&last.latte.pose.blink<.05,'Latte must visibly reopen eyes before Mocha');
check(t.stateAt(shot('50B').start,shots).required.includes('mocha'),'Mocha reveal must follow eyes opening');
check(t.stateAt(shot('57B').end-1,shots).latte.pose.gazeX<-.8,'Latte must look off screen toward the sign');
check(t.stateAt(shot('57C').start,shots).required.includes('sign'),'Show sign after Latte notices it');
const decode=file=>execFileSync('ffmpeg',['-nostdin','-v','error','-i',file,'-ar','48000','-ac','1','-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
const original=decode(plan.narration.source),stem=decode(path.join(out,'Narration_Stem.wav'));
check(stem.subarray(0,original.length).equals(original),'Narration contains changed, repeated or interrupted samples');
check(stem.length>=original.length&&(stem.length-original.length)/4/48000<.05,'Excessive final padding after decoded MP3');
check((await fs.readFile(path.join(out,'Polish_Narration_Flow.mp3'))).equals(await fs.readFile(plan.narration.source)),'Listening copy differs from approved cache');
for(let frame=0;frame<plan.durationInFrames;frame++){
 const s=t.stateAt(frame,shots);
 check(t.kittenRevealed(s)===(s.shot.number>=46),'Mystery kitten appears before its reveal');
 if(s.t>=29)check(!t.streetActivity(s),'Crowds remain out after curfew');
 if(s.shot.number===41){check(s.camera[2]>4.5,'Window-to-door move stays outside');if(s.u<.3)check(s.required.includes('cloth-silhouette'),'Begin with the shape through glass');if(s.u>.85)check(s.required.includes('door'),'Finish the pan on the door');}
 if(s.shot.number===47)check(s.door===0,'Door must be closed during failed handle attempts');
 if(s.shot.number===47)check(s.kittenTap===0,'Kitten must jump rather than stretch a paw');
 if(s.shot.number===47&&s.u>.35&&s.u<.45)check(s.kitten[1]>.10&&s.target[1]>1.0,'Handle pan must coincide with kitten jump');
 if(s.bowlContact){const mouth=t.mouthAnchor(s,'essie');check(Math.abs(s.bowl[1]+.115-mouth[1])<1e-9,'Bowl rim must meet mouth while carried');check(Math.abs(Math.hypot(s.bowl[0]-mouth[0],s.bowl[2]-mouth[2])-.17)<1e-9,'Bowl must be held at the rim, not through its center');}
}
for(const start of [4,15,67])check(t.doorAngleAt(start+.45)>1.1&&t.doorAngleAt(start)===0,'Door swing must be fast and begin closed');
check(t.stateAt(shot('57A').start,shots).required.includes('flowerpot'),'Flowerpot must precede Latte and the sign');
check(t.stateAt(shot('57D').start,shots).required.includes('sign'),'Invitation text must remain visible while it is read');
const beforePlace=shots.find(s=>s.number===53);const placementStates=Array.from({length:beforePlace.end-beforePlace.start},(_,i)=>t.stateAt(beforePlace.start+i,shots));const heldLast=placementStates.filter(s=>s.bowlContact).at(-1),releasedFirst=placementStates.find(s=>!s.bowlContact);check(t.distance(heldLast.bowl,releasedFirst.bowl)<.001,'Bowl jumps after mouth releases it');
const lights=shots.filter(s=>s.number===11);check(lights.length===3,'Light geography uses one continuous pan then the house');check(t.stateAt(lights[2].start,shots).required.includes('home-door'),'Follow the lamps to Latte home before returning to him');
const prior=new Map();
for(let frame=shot('58A').start;frame<plan.durationInFrames;frame++){
 const s=t.stateAt(frame,shots);
 for(let i=0;i<4;i++){
  const a=t.shelterState(s,i),previous=prior.get(i);
  check(JSON.stringify(a)===JSON.stringify(t.shelterState(s,i)),'Non-deterministic supporting actor');
  if(previous)check(t.distance(a.position,previous.position)<.16,'Shelter guest teleported across a cut');
  check(a.position[1]>=0&&a.position[1]<=(i===2?.76:.031),'Supporting cat floats or clips floor');
  if(Math.abs(a.position[2]-4.2)<.15&&Math.abs(a.position[0])<4.1)check(a.position[0]>1.8&&a.position[0]<2.8,'Supporting cat crosses a wall instead of entrance');
  for(const f of t.FIXTURES.filter(f=>['serving-counter','preparation-counter','customer-table','chair','bench'].includes(f.role))){
   check(!(Math.abs(a.position[0]-f.position[0])<f.size[0]/2+.10&&Math.abs(a.position[2]-f.position[2])<f.size[2]/2+.10),'Supporting cat intersects '+f.id);
  }
  prior.set(i,a);
 }
}
const shyStart=t.shelterState(t.stateAt(shot('58D').start,shots),2),shyEnd=t.shelterState(t.stateAt(plan.durationInFrames-1,shots),2);
check(shyStart.progress===0&&shyEnd.progress===1,'Same hesitant cat must emerge and reach shelter');
check(t.stateAt(shot('59B').start,shots).mocha.pose.expression==='happy','Mocha must offer a smile');
console.log(checks+' narration-led story, caption and shelter-route checks passed.');
