import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reconcileStoryMetadata} from './story-edit-metadata.mjs';
// Synthetic metadata fixture only: no audio/provenance file is generated.
function fixture(){
 const priorLock={shots:[]},lock={shots:[]},shots=[],markers=[];
 for(let sequence=1;sequence<=60;sequence++){
  priorLock.shots.push({visibleAction:'Old action '+sequence,camera:'Old camera '+sequence});
  lock.shots.push({visibleAction:'Revised action '+sequence,camera:'Revised camera '+sequence});
  shots.push({id:String(sequence).padStart(2,'0'),sequence,start:(sequence-1)*150,end:sequence*150,sourceStart:(sequence-1)*50,sourceEnd:sequence*50,cameraAndAction:'Old action '+sequence+' | CAMERA: Old camera '+sequence});
  markers.push({sequence,editStartFrame:(sequence-1)*150,editEndFrame:sequence*150,spoken:'Word '+sequence});
 }
 const narration=markers.map(m=>m.spoken).join(' '),props={audioApproved:true,shots,captions:markers.map((m,i)=>({text:m.spoken,start:i*150,end:i*150+10}))};
 const voice={voiceId:'pNInz6obpgDQGcFmaJgB',modelId:'eleven_multilingual_v2',playback:{speed:1.35,mode:'varispeed'},assumedTiming:false,sourceHash:createHash('sha256').update(narration).digest('hex')};
 const wordTimings=props.captions.map(c=>({...c,start:c.start/30,end:c.end/30}));
 return {props,manifest:{shots:structuredClone(shots),durationInFrames:9000},narratedEdit:{shots:structuredClone(shots),durationInFrames:9000,voice,markers},lock,priorLock,narration,wordTimings};
}
test('changes direction only while preserving timing, captions, and voice provenance',()=>{
 const x=fixture(),before=structuredClone(x),r=reconcileStoryMetadata(x);
 assert.deepEqual(x,before,'Inputs mutated');
 assert.deepEqual(r.props.captions,x.props.captions);
 assert.deepEqual(r.narratedEdit.voice,x.narratedEdit.voice);
 assert.deepEqual(r.narratedEdit.markers,x.narratedEdit.markers);
 assert.equal(r.manifest.durationInFrames,9000);
 for(let i=0;i<60;i++)for(const key of ['id','sequence','start','end','sourceStart','sourceEnd'])assert.equal(r.props.shots[i][key],x.props.shots[i][key]);
 assert.match(r.props.shots[0].cameraAndAction,/Revised action 1/);
 assert.deepEqual(reconcileStoryMetadata({...x,...r}),r,'Update not idempotent');
});
test('preserves omitted zero-frame captions without deleting recorded words',()=>{
 const x=fixture();x.wordTimings[0].end=x.wordTimings[0].start;x.props.captions.shift();
 const r=reconcileStoryMetadata(x);
 assert.deepEqual(r.props.captions,x.props.captions);
 assert.equal(x.wordTimings.length,60);
});
for(const [label,mutate] of [
 ['a different local creative direction',x=>x.props.shots[0].cameraAndAction='Local newer direction'],
 ['drift between timing files',x=>x.narratedEdit.shots[3].sourceEnd+=1],
 ['scratch audio',x=>x.props.audioApproved=false],
 ['different approved narration',x=>x.props.captions[0].text='Wrong story'],
 ['different voice provenance',x=>x.narratedEdit.voice.sourceHash='wrong'],
 ['different marker timing',x=>x.narratedEdit.markers[1].editEndFrame+=1],
])test('refuses '+label,()=>{const x=fixture();mutate(x);assert.throws(()=>reconcileStoryMetadata(x));});
