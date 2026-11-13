// From studio/: node src/v2/animation/timeline.test.mjs
import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';import * as THREE from 'three';import {execFileSync} from 'node:child_process';
const source=ts.transpileModule(fs.readFileSync('src/v2/animation/timeline.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const module={exports:{}};new Function('module','exports',source)(module,module.exports);
const {storyAt,CUP_START,CUP_END,CUP_RADIUS,PAW_RADIUS}=module.exports;
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;};
const states=Array.from({length:240},(_,f)=>storyAt(f));
check(states.filter(s=>s.shot===1).length===45,'Shot one must contain 45 frames');
check(states.filter(s=>s.shot===2).length===60,'Shot two must contain 60 frames');
check(states.filter(s=>s.shot===3).length===60,'Shot three must contain 60 frames');
check(states.filter(s=>s.shot===4).length===75,'Shot four must contain 75 frames');
for(const s of states){
 check(JSON.stringify(s)===JSON.stringify(storyAt(s.frame)),`Non-deterministic frame ${s.frame}`);
 check([...s.camera,...s.kitten,...s.cup,...s.paw,...s.essie].every(Number.isFinite),'Nonfinite transform');
 check(s.cup[1]===1.12,'Cup leaves the worktop');
 check(s.cup[0]-0.15>=-3.55&&s.cup[0]+0.15<=0.85&&s.cup[2]-0.15>=-1.4&&s.cup[2]+0.15<=-0.5,'Cup/saucer overhangs worktop');
 if(s.contact){check(Math.abs(Math.hypot(s.paw[0]-s.cup[0],s.paw[2]-s.cup[2])-(CUP_RADIUS+PAW_RADIUS))<1e-8,'Paw disconnects from cup');check(s.reach===1,'Contact without full reach');}
 if(s.frame>0){const previous=states[s.frame-1];check(dist(previous.kitten,s.kitten)<0.20,'Kitten teleport');check(dist(previous.essie,s.essie)<0.045,'Essie teleport');
   const moving=dist(previous.cup,s.cup)>1e-6;check(!moving||(s.contact&&previous.contact),'Cup moves without continuous paw contact');}
 if(s.frame>=105)check(dist(s.kitten,[0.64,1.12,-0.79])===0,'Kitten slides during idle/emotional hold');
 if(s.frame>=164)check(dist(s.cup,CUP_END)===0,'Cup drifts after release');
 if(s.frame>=45&&s.frame<81){
   const tables=[[1.95,2.13,0.525],[2.38,-1.14,0.525]];
   for(const [x,z,r] of tables)check(Math.hypot(s.kitten[0]-x,s.kitten[2]-z)>r+0.12,'Kitten clips a customer table');
   const chairs=[[.96,2.13],[2.94,2.13],[2.38,-2.14],[2.38,-.14]];
   for(const [x,z] of chairs)check(Math.abs(s.kitten[0]-x)>.42||Math.abs(s.kitten[2]-z)>.42,'Kitten clips a chair');
 }
}
check(dist(storyAt(44).kitten,storyAt(45).kitten)<0.01,'Discontinuity at first cut');
check(dist(storyAt(104).kitten,storyAt(105).kitten)<0.001,'Discontinuity at counter arrival');
check(storyAt(27).kittenFear===1&&storyAt(230).kittenSmile===1,'Emotional arc incomplete');
// Explicit immutable checkpoint: no permanent asset, approved drawing or Bridge source is modified.
execFileSync('git',['diff','--exit-code','08b67e6','--','src/v2/cafe','src/v2/cats','src/videos/bridge'],{stdio:'pipe'});
console.log(`${checks} animation timeline/contact/continuity checks passed; locked assets match 08b67e6`);
