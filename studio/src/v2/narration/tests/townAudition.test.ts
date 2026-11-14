import test from 'node:test';
import assert from 'node:assert/strict';
import {planTownAudition,sourceFrameAt,townAuditionStateAt,validateTownAuditionTiming} from '../townAudition';
import {Timing} from '../timing';
import {CUP_RADIUS,PAW_RADIUS} from '../../animation/timeline';

const timing:Timing={characters:{characters:['x'],character_start_times_seconds:[0],character_end_times_seconds:[0.1]},
  sentences:[{text:'In this town, every café closed at midnight.',start:0.035,end:3.46},{text:'Except ours.',start:3.738,end:4.76},{text:'One night, a frightened kitten appeared at the door.',start:5.573,end:8.499}],
  words:[{text:'appeared',start:7.465,end:7.825},{text:'door',start:8.081,end:8.382}]};
const duration=8.777143;

test('arrival cut follows real speech; later actions have their own unvoiced time',()=>{
  const {plan,visualTiming}=planTownAudition(timing,duration);
  assert.equal(plan.shots[1].startFrame,Math.round(7.465*30));
  assert.ok(plan.shots[2].startFrame/30>duration);
  assert.equal(plan.shots[2].endFrame-plan.shots[2].startFrame,60);
  assert.ok(plan.durationInFrames/30>duration+4);
  for(const s of plan.shots){assert.equal(sourceFrameAt(s.startFrame,visualTiming),s.sourceStart);assert.equal(sourceFrameAt(s.endFrame-1,visualTiming),s.sourceEnd);}
  assert.ok(!Number.isInteger(sourceFrameAt(100,visualTiming)),'Extended camera movement must not quantize to old frames.');
});

test('every narrated frame preserves contact, surfaces, idle positions and shot continuity',()=>{
  const {plan,visualTiming}=planTownAudition(timing,duration);
  let previous=townAuditionStateAt(0,visualTiming);
  const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
  for(let frame=0;frame<plan.durationInFrames;frame++){
    const s=townAuditionStateAt(frame,visualTiming);
    assert.deepEqual(s,townAuditionStateAt(frame,visualTiming));
    assert.equal(s.cup[1],1.12);
    if(s.contact)assert.ok(Math.abs(Math.hypot(s.paw[0]-s.cup[0],s.paw[2]-s.cup[2])-CUP_RADIUS-PAW_RADIUS)<1e-8);
    if(frame){
      if(distance(s.cup,previous.cup)>1e-8)assert.ok(s.contact&&previous.contact);
      if(s.shot===previous.shot)assert.ok(distance(s.camera,previous.camera)<0.025,'Unmotivated camera jump');
      assert.ok(distance(s.kitten,previous.kitten)<0.20,'Kitten teleports');
    }
    if(s.shot>=3)assert.deepEqual(s.kitten,[0.64,1.12,-0.79]);
    previous=s;
  }
  const a=townAuditionStateAt(110,visualTiming),b=townAuditionStateAt(116,visualTiming);
  assert.equal(a.kittenBlink,1);assert.equal(b.kittenBlink,0,'Blink must run at real-time speed.');
  const end=townAuditionStateAt(plan.durationInFrames-1,visualTiming);
  assert.equal(end.kittenSmile,1);assert.equal(end.kittenFear,0);
});

test('incomplete and non-monotone narration maps are rejected',()=>{
  const {plan,visualTiming}=planTownAudition(timing,duration);
  const invalid=structuredClone(visualTiming);invalid.sourceFrames[2].frame=0;
  assert.throws(()=>validateTownAuditionTiming(invalid,plan));
  assert.throws(()=>planTownAudition({...timing,words:[]},duration));
  assert.throws(()=>planTownAudition(timing,7));
});
