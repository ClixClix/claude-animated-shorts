/**
 * Episode 02: authoritative director/narration/live-edit consistency gate.
 * Scene-local QA only. No scene, engine, audio, or camera source is modified.
 *
 * From studio/: node src/v2/episodes/in-this-town-02/tools/locked-edit-gate.mjs
 * Tests: node --test src/v2/episodes/in-this-town-02/tools/locked-edit-gate.test.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const currentFile=fileURLToPath(import.meta.url);
const studioRoot=path.resolve(path.dirname(currentFile),'../../../../..');

export const words=s=>(String(s??'').match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[])
  .map(w=>w.toLowerCase().replaceAll('’',"'"));

export function validateLockedEdit({lock,plan,narration,props,manifest=null,narratedEdit=null}){
  const errors=[];
  const check=(ok,id,detail)=>{if(!ok)errors.push({id,detail});};
  const director=lock?.shots, lines=plan?.shots, edit=props?.shots;
  check(Array.isArray(director)&&director.length===60,
    'DIRECTOR_60_BEATS','Locked director must contain exactly 60 creative beats.');
  check(Array.isArray(lines)&&lines.length===60,
    'NARRATION_60_BEATS','Approved narration map must contain exactly 60 spoken beats.');
  check(Array.isArray(edit)&&edit.length>=60,
    'LIVE_EDIT_PRESENT','Real narration-driven manifest must cover every beat (with optional A/B split segments).');
  if(!Array.isArray(director)||!Array.isArray(lines)||!Array.isArray(edit))return {errors};
  for(let i=0;i<60;i++){
    const d=director[i],n=lines[i],seq=i+1;
    check(d?.sequence===seq&&typeof d.visibleAction==='string'&&d.visibleAction.trim().length>0&&
      typeof d.camera==='string'&&d.camera.trim().length>0&&Array.isArray(d.location)&&d.location.length>0,
      'DIRECTOR_BEAT_'+seq,'Director beat '+seq+' lacks its locked action, camera or location.');
    check(n?.sequence===seq&&n?.id===String(seq).padStart(2,'0')&&
      typeof n.spoken==='string'&&n.spoken.trim().length>0,
      'NARRATION_BEAT_'+seq,'Narration beat '+seq+' is missing, renamed or out of order.');
  }
  check(words(lines.map(s=>s?.spoken??'').join(' ')).join('|')===words(narration).join('|'),
    'NARRATION_TEXT_DRIFT','Spoken map differs from the approved full narration text.');
  check(props?.audioApproved===true,
    'APPROVED_ADAM_REQUIRED','This release/visual QA gate requires live approved Adam voice; silent scratch is not production.');
  const seen=new Map(); let lastEnd=0, lastSeq=0;
  for(const [i,s] of edit.entries()){
    const id=String(s?.id??'');
    const seq=s?.sequence;
    const goodSeq=Number.isInteger(seq)&&seq>=1&&seq<=60;
    const expectedId=goodSeq?String(seq).padStart(2,'0'):'';
    check(goodSeq,'INVALID_RENDER_SEQUENCE_'+i,'Render segment '+id+' has invalid sequence '+String(seq)+'.');
    if(!goodSeq)continue;
    check(seq>=lastSeq&&seq<=lastSeq+1,
      'SEQUENCE_ORDER_'+i,'Render sequence jumps from '+lastSeq+' to '+seq+' at segment '+id+'.');
    check(id===expectedId||new RegExp('^'+expectedId+'[A-Z]+$').test(id),
      'SEGMENT_ID_'+i,'Render segment '+id+' does not map to locked beat '+seq+'.');
    const count=(seen.get(seq)||0)+1;seen.set(seq,count);
    check(Number.isInteger(s.start)&&Number.isInteger(s.end)&&s.start===lastEnd&&s.end>s.start&&s.end-s.start<=120,
      'FRAME_CONTINUITY_'+i,'Segment '+id+' must immediately follow the previous segment and be 1–120 frames.');
    if(Number.isInteger(s.end))lastEnd=s.end;
    const d=director[seq-1];
    if(typeof s.cameraAndAction==='string'&&d){
      check(s.cameraAndAction.includes(d.visibleAction)&&s.cameraAndAction.includes(d.camera),
        'DIRECTOR_OVERRIDE_'+id,'Live segment '+id+' uses camera/action text that is not from PRODUCTION_DIRECTOR_LOCK.json.');
    }else{
      check(false,'MISSING_DIRECTOR_INTENT_'+id,'Live segment '+id+' lacks its locked camera/action description.');
    }
    lastSeq=seq;
  }
  for(let seq=1;seq<=60;seq++){
    check((seen.get(seq)||0)>=1,'MISSING_BEAT_'+seq,
      'No live segment renders locked story beat '+seq+'.');
  }
  check(lastSeq===60,'INCOMPLETE_END','Edit never reaches locked beat 60.');
  check(edit[0]?.start===0,'NONZERO_START','The live edit must start at frame 0.');
  const ids=edit.map(s=>s?.id);
  check(new Set(ids).size===ids.length,'DUPLICATE_SEGMENT_IDS','Render segment IDs must be unique.');
  if(manifest){
    check(Number.isInteger(manifest.durationInFrames)&&manifest.durationInFrames===lastEnd,
      'MANIFEST_FRAME_COUNT','Shot manifest frame count differs from render-props.json.');
    check(Array.isArray(manifest.shots)&&manifest.shots.length===edit.length&&
      manifest.shots.every((s,i)=>s.id===edit[i]?.id&&s.sequence===edit[i]?.sequence&&
        s.start===edit[i]?.start&&s.end===edit[i]?.end),
      'MANIFEST_SHOT_DRIFT','The published manifest and render props do not describe the same edit.');
    check(manifest.width===1080&&manifest.height===1920&&manifest.fps===30,
      'MANIFEST_FORMAT','The native production manifest must be 1080x1920, 30 fps.');
  }else{
    check(false,'MISSING_SHOT_MANIFEST','EP02_SHOT_MANIFEST.json is required to reconcile the live edit.');
  }
  if(narratedEdit){
    check(narratedEdit.durationInFrames===lastEnd&&Array.isArray(narratedEdit.markers)&&
      narratedEdit.markers.length===60,
      'NARRATED_EDIT_DRIFT','Approved Adam edit has different frame count or missing narration markers.');
    if(Array.isArray(narratedEdit.markers)){
      for(let seq=1;seq<=60;seq++){
        const m=narratedEdit.markers[seq-1], related=edit.filter(s=>s.sequence===seq);
        check(m?.sequence===seq&&m?.sourceId===String(seq).padStart(2,'0')&&
          m?.editStartFrame===related[0]?.start&&
          m?.editEndFrame===related.at(-1)?.end,
          'WORD_TIMING_BEAT_'+seq,'Adam marker does not bound the edited segments for beat '+seq+'.');
      }
    }
  }else{
    check(false,'MISSING_ADAM_EDIT','EP02_ADAM_NARRATED_EDIT.json is required; no scratch timeline substitution.');
  }
  return {errors,beats:60,renderSegments:edit.length,frames:lastEnd};
}

async function main(){
  const root=studioRoot;
  const scene=path.join(root,'src/v2/episodes/in-this-town-02');
  const out=path.join(root,'out/v2-episodes/in-this-town-02');
  const readJson=async(file)=>JSON.parse(await fs.readFile(file,'utf8'));
  // Never create an alternative timeline. Read the existing production files.
  const paths={
    lock:path.join(scene,'PRODUCTION_DIRECTOR_LOCK.json'),
    plan:path.join(scene,'NARRATION_SHOT_ALIGNMENT_PLAN.json'),
    narration:path.join(scene,'DRAFT_BOX_NARRATION.txt'),
    props:path.join(out,'render-props.json'),
    manifest:path.join(out,'EP02_SHOT_MANIFEST.json'),
    narratedEdit:path.join(out,'EP02_ADAM_NARRATED_EDIT.json')
  };
  const failures=[],data={};
  for(const [key,file] of Object.entries(paths)){
    try{data[key]=key==='narration'?await fs.readFile(file,'utf8'):await readJson(file);}
    catch(e){failures.push({id:'FILE_MISSING_'+key,detail:file+' ('+e.message+')'});}
  }
  const evaluated=failures.length?{errors:failures}:validateLockedEdit(data);
  const result={
    stage:evaluated.errors.length?'BLOCKED_LOCKED_EDIT_MISMATCH':'LOCKED_EDIT_RECONCILED__NOT_VISUALLY_APPROVED',
    passed:evaluated.errors.length===0,
    beats:evaluated.beats??60,
    renderSegments:evaluated.renderSegments??null,
    frames:evaluated.frames??null,
    errors:evaluated.errors,
    visualReviewComplete:false,publishingAllowed:false,
    note:'Only story/word/manifest consistency is tested. Rendered motion, framing, audio, and rights still require direct review.'
  };
  await fs.mkdir(out,{recursive:true});
  await fs.writeFile(path.join(out,'EP02_LOCKED_EDIT_GATE.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
  if(!result.passed)process.exitCode=2;
}
if(process.argv[1]&&path.resolve(process.argv[1])===currentFile){
  await main();
}
