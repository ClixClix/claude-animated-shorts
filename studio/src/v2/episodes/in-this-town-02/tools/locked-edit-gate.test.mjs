import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateLockedEdit} from './locked-edit-gate.mjs';

function fixture(){
  const lock={shots:[]},plan={shots:[]},props={shots:[],audioApproved:true};
  let cursor=0;
  for(let seq=1;seq<=60;seq++){
    const id=String(seq).padStart(2,'0');
    const action='User locked action '+id;
    const camera='User locked camera '+id;
    lock.shots.push({sequence:seq,visibleAction:action,camera,location:['cafe']});
    plan.shots.push({sequence:seq,id,spoken:'Narrated words '+seq+'.'});
    for(const suffix of (seq===7||seq===49?['A','B']:[''])){
      const start=cursor,end=cursor+20;cursor=end;
      props.shots.push({id:id+suffix,sequence:seq,start,end,
        cameraAndAction:action+' | CAMERA: '+camera});
    }
  }
  const manifest={shots:structuredClone(props.shots),durationInFrames:cursor,
    width:1080,height:1920,fps:30};
  const narratedEdit={durationInFrames:cursor,markers:plan.shots.map(s=>{
    const related=props.shots.filter(x=>x.sequence===s.sequence);
    return {sequence:s.sequence,sourceId:s.id,
      editStartFrame:related[0].start,editEndFrame:related.at(-1).end};
  })};
  return {lock,plan,props,manifest,narratedEdit,
    narration:plan.shots.map(s=>s.spoken).join(' ')};
}
const ids=r=>r.errors.map(x=>x.id);
test('60 director beats and 62 narration-split segments are valid',()=>{
  const r=validateLockedEdit(fixture());
  assert.deepEqual(r.errors,[]);
  assert.equal(r.beats,60);
  assert.equal(r.renderSegments,62);
  assert.equal(r.frames,1240);
});
test('rejects unauthorized replacement of shot 51 action',()=>{
  const x=fixture();
  x.props.shots.find(s=>s.sequence===51).cameraAndAction='Hinged box door and simple walk-out';
  assert.ok(ids(validateLockedEdit(x)).some(id=>id.startsWith('DIRECTOR_OVERRIDE_51')));
});
test('rejects missing story beat',()=>{
  const x=fixture();
  x.props.shots=x.props.shots.filter(s=>s.sequence!==37);
  assert.ok(ids(validateLockedEdit(x)).includes('MISSING_BEAT_37'));
});
test('rejects broken frame order',()=>{
  const x=fixture();
  x.props.shots[1].start+=1;
  assert.ok(ids(validateLockedEdit(x)).includes('FRAME_CONTINUITY_1'));
});
test('rejects scratch edit replacing the Adam voice',()=>{
  const x=fixture();
  x.props.audioApproved=false;
  assert.ok(ids(validateLockedEdit(x)).includes('APPROVED_ADAM_REQUIRED'));
});
test('rejects stale manifest frame count',()=>{
  const x=fixture();
  x.manifest.durationInFrames=3876;
  assert.ok(ids(validateLockedEdit(x)).includes('MANIFEST_FRAME_COUNT'));
});
test('rejects changed narrator text',()=>{
  const x=fixture();
  x.narration='An unrelated story.';
  assert.ok(ids(validateLockedEdit(x)).includes('NARRATION_TEXT_DRIFT'));
});
test('rejects missing verified spoken word edit',()=>{
  const x=fixture();
  x.narratedEdit=null;
  assert.ok(ids(validateLockedEdit(x)).includes('MISSING_ADAM_EDIT'));
});
test('rejects duplicate shot ID and incorrect format',()=>{
  const x=fixture();
  x.props.shots[1].id=x.props.shots[0].id;
  x.manifest.width=720;
  const failures=ids(validateLockedEdit(x));
  assert.ok(failures.includes('DUPLICATE_SEGMENT_IDS'));
  assert.ok(failures.includes('MANIFEST_FORMAT'));
});
