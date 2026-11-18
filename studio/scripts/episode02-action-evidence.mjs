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
 "export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector.ts';"
].join('\n'),resolveDir:process.cwd(),loader:'ts'},
 outfile:bundle,bundle:true,platform:'node',format:'esm',target:'node24'});
const {SCRATCH_EDIT,stateAt,directEpisodeCamera}=await import(pathToFileURL(bundle).href);
const len=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const movement=(states,id)=>states.slice(1).reduce((n,s,i)=>n+len(s[id].position,states[i][id].position),0);
const range=(a)=>Math.max(...a)-Math.min(...a);
const traces=new Map();
for(const shot of SCRATCH_EDIT.shots){
 const n=shot.sequence;
 const count=13,frames=Array.from({length:count},(_,i)=>Math.round(
  shot.start+(shot.end-shot.start-1)*i/(count-1)));
 const states=frames.map(f=>stateAt(f,SCRATCH_EDIT.shots));
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
  location:lock.shots[n-1].location,frames,motions,boxes,morph,
  rooms:[...new Set(states.map(s=>s.room))],
  alleyIndices:[...new Set(states.map(s=>s.searchAlleyIndex).filter(x=>x!==null))],
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
check(6,'LATTE_ACTUALLY_JUMPS',t=>t.motions.latte.vertical>.25,'Latte must visibly lift off ground and land inside striped box.','critical');
check(7,'ESSIE_MOVES_TO_LEAVE_SPACE',t=>t.motions.essie.meters>.14,
 'Essie physically shifts aside inside the intact box, not only glances.');
check(17,'MOCHA_BEGS_TO_MOVE',t=>t.motions.mocha.vertical>.10,
 'Mocha visibly pleads/jumps before settling sadly.');
check(18,'STREET_WATCHED',t=>t.rooms.includes('street')&&t.motions.essie.meters>.40,
 'Mocha watches and follows Essie outside rather than repeating café stills.');
check(19,'ESSIE_CLIMBS_IN',t=>t.motions.essie.vertical>.17,
 'Essie physically jumps/climbs over intact box rim.');
check(22,'ESSIE_GOES_TO_BED',t=>t.motions.essie.meters>.40,
 'Essie moves from the box to her real cat bed.');
check(25,'ORIGINAL_HOUSE_USED',t=>t.rooms.includes('house')&&t.motions.mocha.meters>.30,
 'Mocha searches the Episode01 house, not café.');
check(26,'HOUSE_EMPTY_BED_POV',t=>t.rooms.includes('house'),
 'Mocha sees an actually empty Essie sleeping spot in the house.');
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
check(42,'MOCHA_PULLS_ESSIE_BOX_CLOSER',t=>t.boxes.essie.meters>.10,
 'Mocha pulls physically closer; mouth pose alone cannot count as moving the object.');
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
check(58,'MOCHA_NOW_WALKS_OUTSIDE',t=>t.rooms.includes('street')&&
 t.motions.mocha.meters>.45,'Mocha walks down the town street, smiling at cats near boxes.');
check(59,'MOCHA_HESITANT_APPROACH',t=>t.rooms.includes('cafe')&&
 t.motions.mocha.meters>.28&&t.motions.mocha.vertical<.08,
 'Director lock: Mocha walks hesitantly toward the shared box in shot 59; no jump until shot 60.','critical');
check(60,'THREE_CAT_FINAL_JUMP',t=>['mocha','essie','latte'].every(id=>t.motions[id].vertical>.65),
 'Director lock requires ALL THREE cats to jump into the shared box in shot 60, not a static tableau.','critical');
const important=[4,8,9,12,13,16,20,24,31,33,34,37,38,40,41,44,45,46,47,48,50,51,52,57];
for(const n of important)unreviewed.push({shot:n,problem:'Requires ACTUAL rendered source/video inspection for prop interactions, legibility and action continuity; time-series pose changes are insufficient.'});
const failures=measured.filter(m=>m.result!=='PASS_SOURCE_MOTION');
const report={stage:failures.length?'STORY_MOTION_GAPS_FOUND':'SOURCE_MOTION_PRESENT_NOT_VISUALLY_APPROVED',
 shotsChecked:SCRATCH_EDIT.shots.length,assertions:measured.length,passed:measured.length-failures.length,
 failed:failures.length,failures,measured,visualReviewPending:unreviewed,
 note:'This audit samples timeline source only, not rendered frames or actual physical collision. A green result never means the show-dont-tell creative criterion is visually verified.'};
await fs.writeFile(path.join(out,'EP02_ACTION_EVIDENCE.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage:report.stage,sourceMotionChecks:measured.length,
 passed:report.passed,failed:report.failed,
 failedBeats:failures.map(f=>({shot:f.shot,id:f.id})),
 report:path.join(out,'EP02_ACTION_EVIDENCE.json')},null,2));
if(failures.length&&process.argv.includes('--strict'))process.exitCode=1;
