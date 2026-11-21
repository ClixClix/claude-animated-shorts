import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

/**
 * Actual timeline-state movement gate, not a text/metadata check.
 * Source evidence DOES NOT replace real moving-frame visual QC.
 * Critical inert actions are logged as errors even when code compiles.
 */
const root=path.resolve('src/v2/episodes/in-this-town-02');
const out=path.resolve('out/v2-episodes/in-this-town-02');
await fs.mkdir(out,{recursive:true});
const lock=JSON.parse(await fs.readFile(path.join(root,'PRODUCTION_DIRECTOR_LOCK.json'),'utf8'));
const bundle=path.join(out,'EP02_ACTION_EVIDENCE.bundle.mjs');
await build({stdin:{contents:[
 "export {SCRATCH_EDIT,stateAt} from './src/v2/episodes/in-this-town-02/timeline.ts';",
 "export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector.ts';",
 "export {catBehaviorFor} from './src/v2/episodes/in-this-town-02/catBehaviors.ts';"
].join('\n'),resolveDir:process.cwd(),loader:'ts'},
 outfile:bundle,bundle:true,platform:'node',format:'esm',target:'node24'});
const {stateAt,directEpisodeCamera,catBehaviorFor}=await import(pathToFileURL(bundle).href);
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
if(props.audioApproved!==true)throw Error('Action QA requires the actual approved narration edit');
const shots=props.shots,at=f=>stateAt(f,shots,props.captions);
const len=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const movement=(states,id)=>states.slice(1).reduce((n,s,i)=>n+len(s[id].position,states[i][id].position),0);
const range=(a)=>Math.max(...a)-Math.min(...a);
const traces=new Map();
for(let n=1;n<=60;n++){
 const parts=shots.filter(s=>s.sequence===n);if(!parts.length)throw Error('Missing beat '+n);
 const shot={...parts[0],end:parts.at(-1).end};
 const count=13,frames=Array.from({length:count},(_,i)=>Math.round(
  shot.start+(shot.end-shot.start-1)*i/(count-1)));
 const states=frames.map(at);
 const cameras=states.map(s=>directEpisodeCamera(s));
 const motions=Object.fromEntries(['mocha','essie','latte','demoCat'].map(id=>
  [id,{meters:movement(states,id),vertical:range(states.map(s=>s[id].position[1])),
       minY:Math.min(...states.map(s=>s[id].position[1])),
       visibility:states.some(s=>s[id].visible)}]));
 const boxes=Object.fromEntries(['latte','essie','shared','demo'].map(id=>
  [id,{meters:states.slice(1).reduce((distance,s,i)=>
   distance+len(s[id+'Box'],states[i][id+'Box']),0),
   flapRange:range(states.map(s=>s.flap[id]))}]));
 const morph=Object.fromEntries(['essie','latte','demo'].map(id=>
  [id,range(states.map(s=>s.morph[id]))]));
 traces.set(n,{n,shotId:shot.id,description:lock.shots[n-1].visibleAction,
  location:lock.shots[n-1].location,frames,motions,boxes,morph,states,
  behaviors:states.map(s=>catBehaviorFor(s,'mocha')),
  rooms:[...new Set(states.map(s=>s.room))],
  alleyIndices:[...new Set(states.map(s=>s.searchAlleyIndex).filter(x=>x!==null))],
  targetMeters:cameras.slice(1).reduce((d,c,i)=>d+len(c.target,cameras[i].target),0),
  cameraMeters:cameras.slice(1).reduce((d,c,i)=>d+len(c.camera,cameras[i].camera),0)});
}
const measured=[],unreviewed=[];
const check=(n,id,predicate,expectation,severity='high')=>{
 const t=traces.get(n),observed=predicate(t);
 measured.push({shot:n,id,severity,result:observed?'PASS_SOURCE_MOTION':'MISSING_REQUIRED_SOURCE_MOTION',
  expectation,trace:{motions:t.motions,boxes:t.boxes,morph:t.morph,rooms:t.rooms,alleyIndices:t.alleyIndices,
    cameraMeters:Number(t.cameraMeters.toFixed(3))}});
};
check(1,'OPENING_CRANE_MOVES',t=>t.cameraMeters>3,'Episode01-style city crane visibly travels into demo box.');
check(3,'CAT_TO_BOX_ANIMATED',t=>t.morph.demo>.65,'Cat-to-box transformation changes morph through a substantial range.','critical');
check(4,'MOCHA_WITNESSES_FIRST_TWO_BOXES',
 t=>t.motions.mocha.visibility&&t.motions.mocha.meters>.55,
 'Mocha must physically walk in the same street shot as the first two cats transforming.','critical');
check(5,'MOCHA_SNIFFS_AND_DECLINES_BOX',
 t=>t.motions.mocha.visibility&&t.motions.mocha.meters>.80&&t.behaviors.some(b=>b?.mode==='sniff'),
 'Mocha visibly sniffs the ordinary box and then walks away.','critical');
const boundary=(from,to,id)=>{
 const f=shots.filter(s=>s.sequence===from).at(-1),t=shots.find(s=>s.sequence===to);
 const a=at(f.end-1),b=at(t.start);
 return {
  distance:len(a[id].position,b[id].position),
  scale:Math.abs(a[id].scale-b[id].scale),
  sameVisibility:a[id].visible===b[id].visible
 };
};
check(49,'MOCHA_ENTRY_NO_POSITION_POP',()=>{
 const p=boundary(49,50,'mocha');
 return p.distance<.12&&p.scale<.06;
},'Mocha landing inside Essie box must be continuous across shots 49 and 50.','critical');
check(4,'MOCHA_WALK_NO_STREET_TELEPORT',()=>{
 const p=boundary(4,5,'mocha');
 return p.distance<.12&&p.scale<.06&&p.sameVisibility;
},'Mocha must walk across the 04-to-05 edit without teleporting.','critical');
check(6,'LATTE_ACTUALLY_JUMPS',t=>t.motions.latte.vertical>.25,'Latte must visibly lift off ground and land inside striped box.','critical');
check(7,'ESSIE_MOVES_TO_LEAVE_SPACE',t=>t.motions.essie.meters>.14,
 'Essie physically shifts aside inside the intact box, not only glances.');
check(17,'MOCHA_BEGS_THEN_BECOMES_SAD',t=>t.states.some(s=>s.mocha.emotion==='concerned')&&t.states.at(-1).mocha.emotion==='sad'&&t.states.every(s=>s.mocha.visible&&!s.mocha.walking),
 'Box-eye view holds Mocha as pleading gives way to sadness; no invented jump.');
check(18,'STREET_WATCHED',t=>t.rooms.includes('street')&&t.motions.essie.meters>.40,
 'Mocha watches and follows Essie outside rather than repeating café stills.');
check(19,'ESSIE_CLIMBS_IN',t=>t.motions.essie.vertical>.17,
 'Essie physically jumps/climbs over intact box rim.');
check(22,'ESSIE_RESTS_ON_CAFE_BED',t=>t.states.every(s=>s.essie.visible&&s.essie.sleeping&&!s.mocha.visible),
 'Close view shows Essie resting on her actual bed.');
check(25,'ORIGINAL_HOUSE_POV',t=>t.rooms.includes('house')&&t.targetMeters>.30&&t.states.every(s=>!s.mocha.visible),
 'Mocha searches the original house from first person.');
check(26,'HOUSE_EMPTY_BED_POV',t=>t.rooms.includes('house'),
 'Mocha sees an actually empty Essie sleeping spot in the house.');
check(27,'MOCHA_RUNS_OUT_HOUSE_DOOR',t=>t.rooms.includes('house')&&
 t.motions.mocha.meters>1.10&&t.motions.mocha.visibility,
 'Mocha visibly travels through the actual Episode01 house doorway; camera and door clearance require moving-footage QA.','high');
check(29,'MARKET_DISTINCT',t=>t.rooms.includes('market'),
 'Market beat must be set at the physical market.');
check(30,'THREE_DIFFERENT_ALLEYS',t=>t.alleyIndices.length===3,
 'Every-alley montage visits THREE separate sets.','critical');
check(32,'ESSIE_DRAGS_PHYSICAL_BOX',t=>t.boxes.essie.meters>.5,
 'Same four-sided box physically travels with Essie.','critical');
check(35,'ESSIE_JUMPS_IN_ALLEY_BOX',t=>t.motions.essie.vertical>.20,
 'Essie must visibly hop over intact cardboard rim before curling.','critical');
check(39,'ESSIE_TRANSFORMATION',t=>t.morph.essie>.20,
 'Progressive continuous visual change, not a hidden cat.','critical');
check(42,'MOCHA_WHISPERS_HER_NAME',t=>t.states.every(s=>s.mocha.visible&&!s.mocha.walking&&s.mocha.emotion==='sad')&&t.boxes.essie.meters<.01,
 'Whisper closeup is still; the box is not pulled during the name.');
check(49,'MOCHA_ENTER_RESCUE',t=>t.motions.mocha.vertical>.15,
 'Mocha must leap above carton lip with supported paws.','critical');
check(53,'BOTH_CATS_RACE_TO_CAFE',t=>t.motions.mocha.meters>.60&&t.motions.essie.meters>.60,
 'Both rescued friends run together through known street geography.');
check(54,'MOCHA_JUMPS_IN_LATTE_BOX',t=>t.motions.mocha.vertical>.20,
 'Mocha climbs over striped box rim, Essie holds actual flaps open.','critical');
check(55,'LATTE_POP_JUMPS_OUT',t=>t.motions.latte.vertical>.20,
 'Latte physically springs from box and lands on both friends.','critical');
check(56,'TOWN_ANNOUNCEMENT_STOOL',t=>t.rooms.includes('street')&&
 t.motions.mocha.visibility&&t.motions.mocha.minY>.30,'Mocha stands physically elevated on stool before live gathered cats.');
check(58,'MOCHA_PUSHES_BOX_AWAY',t=>t.rooms.includes('cafe')&&t.boxes.demo.meters>.35&&t.motions.mocha.visibility,
 'After the cure, show Mocha pushing the ordinary box away.');
check(59,'MOCHA_DRAGS_SHARED_BOX_TO_WINDOW',t=>t.rooms.includes('cafe')&&t.boxes.shared.meters>1&&t.motions.mocha.meters>1&&t.behaviors.every(b=>b?.mode==='mouth-carry'),
 'Mouth carries the same shared box across the cafe to the window.','critical');
check(55,'LATTE_POP_STARTS_FROM_PREVIOUS_CONTACT',()=>boundary(54,55,'mocha').distance<.03,
 'Mocha remains inside at the start of the pop; no pre-impact teleport.','critical');
check(60,'THREE_CAT_FINAL_JUMP',t=>['mocha','essie','latte'].every(id=>t.motions[id].vertical>.65),
 'Director lock requires ALL THREE cats to jump into the shared box in shot 60, not a static tableau.','critical');
const important=[4,8,9,12,13,16,20,24,31,33,34,37,38,40,41,44,45,46,47,48,50,51,52,57];
for(const n of important)unreviewed.push({shot:n,problem:'Requires ACTUAL rendered source/video inspection for prop interactions, legibility and action continuity; time-series pose changes are insufficient.'});
const failures=measured.filter(m=>m.result!=='PASS_SOURCE_MOTION');
const report={stage:failures.length?'STORY_MOTION_GAPS_FOUND':'SOURCE_MOTION_PRESENT_NOT_VISUALLY_APPROVED',
 shotsChecked:shots.length,assertions:measured.length,passed:measured.length-failures.length,
 failed:failures.length,failures,measured,visualReviewPending:unreviewed,
 note:'This audit samples timeline source only, not rendered frames or actual physical collision. A green result never means the show-dont-tell creative criterion is visually verified.'};
await fs.writeFile(path.join(out,'EP02_ACTION_EVIDENCE.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage:report.stage,sourceMotionChecks:measured.length,
 passed:report.passed,failed:report.failed,
 failedBeats:failures.map(f=>({shot:f.shot,id:f.id})),
 report:path.join(out,'EP02_ACTION_EVIDENCE.json')},null,2));
if(failures.length&&process.argv.includes('--strict'))process.exitCode=1;
