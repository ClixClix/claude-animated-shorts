import './lib/runtime.mjs';
import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=path.resolve('out/v2-episodes/door-at-1111-polish');
await build({entryPoints:['src/v2/episodes/door-at-1111-polish/timeline.ts'],outfile:path.join(out,'timeline-tools.mjs'),bundle:true,platform:'node',format:'esm',target:'node24'});
const t=await import(pathToFileURL(path.join(out,'timeline-tools.mjs')).href),manifest=JSON.parse(await fs.readFile(path.join(out,'The_Door_At_1111_Polish_Shot_Manifest.json'),'utf8')),shots=manifest.shots;
t.validateShots(shots);let checks=0;
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
check(shots.length>=60,'Complete storyboard');check(shots.at(-1).end===manifest.durationInFrames,'Complete coverage');check(manifest.width===1080&&manifest.height===1920&&manifest.fps===30,'Native format');
check(manifest.durationInFrames<=5400,'Maximum three minutes');check(t.STREETLIGHTS.length===9&&new Set(t.STREETLIGHTS.map(JSON.stringify)).size===9,'Nine stable lamps');
for(const shot of shots.filter(s=>s.number===58)){check(t.stateAt(shot.start,shots).t>=128,'Ending must preserve present-time layout');check(t.stateAt(shot.start,shots).door===Math.PI/2,'Shelter entrance must remain open');}
for(const id of ['20','21','22','24','44','51','53','56']){
 const shot=shots.find(s=>s.id===id),frame=shot.start+Math.floor((shot.end-shot.start)*.6),s=t.stateAt(frame,shots),before=t.stateAt(frame-1,shots),after=t.stateAt(frame+1,shots);
 for(const actor of ['latte','mocha','essie']){const a=s[actor];if(!a.moving)continue;const dx=after[actor].position[0]-before[actor].position[0],dz=after[actor].position[2]-before[actor].position[2],cx=s.camera[0]-a.position[0],cz=s.camera[2]-a.position[2];check(a.pose.yaw*(dx*cz-dz*cx)>=-1e-6,actor+' faces opposite actual travel in '+id);if(Math.abs(dx*cz-dz*cx)>1e-4)check(a.pose.yaw*(dx*cz-dz*cx)>0,actor+' has no readable travel facing in '+id);}
}
for(const [id,actor] of [['48','latte'],['50B','mocha'],['51','mocha'],['53','essie'],['56','latte']]){const shot=shots.find(s=>s.id===id),walking=t.stateAt(shot.start,shots)[actor].moving;for(let frame=shot.start;frame<shot.end;frame++)check(t.stateAt(frame,shots)[actor].moving===walking,'Abrupt seated/walking artwork swap inside shot '+id);}
{const dt=1e-4,r=109.25,left=(t.doorAngleAt(r)-t.doorAngleAt(r-dt))/dt,right=(t.doorAngleAt(r+dt)-t.doorAngleAt(r))/dt;check(Math.abs(left-right)<.002,'Door velocity jumps at paw release');let prior=Infinity;for(let u=r+.01;u<111;u+=.04){const speed=(t.doorAngleAt(u+dt)-t.doorAngleAt(u))/dt;check(speed>=0&&speed<prior,'Door accelerates after paw release');prior=speed;}check(Math.abs(t.doorAngleAt(111)-Math.PI/2)<1e-9,'Door does not settle open');}
const seenFeet=new Map(),otherFootCues=new Set(),events=[],stateRows=[];let last,stepNo=0,kittenCycles;
for(let frame=0;frame<manifest.durationInFrames;frame++){
 const s=t.stateAt(frame,shots);check(JSON.stringify(s)===JSON.stringify(t.stateAt(frame,shots)),'Non-deterministic frame '+frame);
 check([...s.camera,...s.target,...s.latte.position,...s.mocha.position,...s.essie.position,...s.kitten,...s.bowl].every(Number.isFinite),'Invalid transform');
 check(s.kitten[1]>=-.001&&s.bowl[1]>=-.0001,'Floor clipping');
 if(s.t>119.2&&!s.flashback)check(Math.abs(s.bowl[1])<1e-8,'Released bowl floats');
 if(last&&!s.flashback&&!last.flashback&&s.t>=27&&last.t>=27){
  for(const id of ['latte','mocha','essie'])check(t.distance(s[id].position,last[id].position)<.35,id+' teleports');
  check(t.distance(s.kitten,last.kitten)<.15,'Kitten teleports');
  for(let i=0;i<9;i++)check(!last.failed[i]||s.failed[i],'Streetlight resets');
 }
 if(s.latte.moving&&!s.flashback){s.latte.feet.forEach((foot,i)=>{
  const key=s.latte.footKeys[i];if(!key.endsWith('stance'))return;
  const prior=seenFeet.get(key);if(prior)check(t.distance(prior,foot)<1e-9,'Planted foot slides');else{seenFeet.set(key,foot);if(i<2&&s.t>39&&s.t<56)events.push({frame,type:'run-step',index:stepNo++});if(i===0&&(s.t>=94.5&&s.t<99||s.t>=124&&s.t<126))events.push({frame,type:'soft-step',actor:'latte',contact:key});}
 });}
 if(!s.flashback){
  for(const id of ['mocha','essie']){const a=s[id],audible=id==='mocha'?s.t>=112&&s.t<114.5:s.t>=113.5&&s.t<117;const key=id+':'+a.footKeys[0];if(a.moving&&audible&&a.footKeys[0].endsWith('stance')&&!otherFootCues.has(key)){otherFootCues.add(key);events.push({frame,type:'soft-step',actor:id,contact:a.footKeys[0]});}}
  if(s.kittenWalking){const cycles=[0,.5].map(offset=>Math.floor(s.kittenTravel/.18+offset));if(kittenCycles)cycles.forEach((step,i)=>{if(step>kittenCycles[i])events.push({frame,type:'soft-step',actor:'kitten',paw:i});});kittenCycles=cycles;}else kittenCycles=undefined;
 }
 if(frame===s.shot.start||frame===s.shot.end-1||frame===s.shot.start+Math.floor((s.shot.end-s.shot.start)/2))stateRows.push({frame,shot:s.shot.id,latte:s.latte.position,mocha:s.mocha.position,essie:s.essie.position,kitten:s.kitten,bowl:s.bowl,failed:s.failed,camera:s.camera,clock:s.clock});
 last=s;
}
const baseline=JSON.parse(await fs.readFile(path.join(out,'PRESERVATION_BASELINE.json'),'utf8'));
const portability=JSON.parse(await fs.readFile('../PORTABILITY_ADJUSTMENTS.json','utf8'));
for(const [p,sha] of Object.entries(baseline)){const actual=createHash('sha256').update(await fs.readFile(path.resolve('..',p))).digest('hex'),adjustment=portability[p];if(adjustment)check(adjustment.originalSHA256===sha,'Unrecognized portability baseline: '+p);check(actual===(adjustment?.portableSHA256??sha),'Approved asset or narrator changed: '+p);}
for(const mutation of [shots.map((s,i)=>i===0?{...s,end:s.start+121}:s),shots.map((s,i)=>i===1?{...s,start:s.start+1}:s),shots.slice(1)])assert.throws(()=>t.validateShots(mutation));
const extraTaps=[99.8,103.8,104.8].map(x=>Math.round(t.actualAt(x*30,shots)));
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));props.cues.taps=[...manifest.cues.taps.slice(0,3),...extraTaps];await fs.writeFile(path.join(out,'render-props.json'),JSON.stringify(props,null,2)+'\n');await fs.writeFile('src/v2/episodes/door-at-1111-polish/edit.json',JSON.stringify(props,null,2)+'\n');
const one=(base,type,extra={})=>{if(shots.some(s=>base*30>=s.sourceStart&&base*30<s.sourceEnd))events.push({frame:Math.round(t.actualAt(base*30,shots)),type,...extra});};
for(const base of [2.1,3.1,13.2,14.2,65.1,66.1])one(base,'clock-tick');
for(const base of [4.1,15.1,67.1]){one(base,'door-latch');one(base+.2,'door-hinge');}
for(const base of [30.5,32.5,35])one(base,'electric-buzz');
for(const base of t.BLACKOUT_TIMES)one(base,'light-fail');
for(const f of props.cues.taps)events.push({frame:f,type:'window-tap'});
for(const base of [83.0,94.0,122.7])one(base,'kitten-meow');
for(const base of [79.0,84.0,112.8])one(base,'blanket-rustle');
// No clock tick over the shelter guests; the clock is no longer this insert.
// No door hinge over the departing bus: the entrance is already open.
one(48.1,'slip');one(55.6,'door-slam');one(57.0,'switch-click');one(109.1,'door-hinge');one(118.5,'bowl-contact');one(120.5,'blanket-rustle');one(131.7,'warm-accent');
for(let base=88;base<93;base+=1.1)one(base,'blanket-rustle');
events.sort((a,b)=>a.frame-b.frame);await fs.writeFile(path.join(out,'SFX_CUES.json'),JSON.stringify({fps:30,duration:manifest.durationInFrames/30,rainStart:t.actualAt(26.5*30,shots)/30,events},null,2)+'\n');
await fs.writeFile(path.join(out,'STRUCTURAL_QA.json'),JSON.stringify({checks,passed:true,shots:shots.length,frames:manifest.durationInFrames,maximumShotFrames:Math.max(...shots.map(s=>s.end-s.start)),protectedHashes:Object.keys(baseline).length,plantedFootTargets:seenFeet.size,states:stateRows},null,2)+'\n');
console.log(`${checks} episode timing, continuity, contact, lamp and asset checks passed; ${events.length} synchronized sound cues.`);
