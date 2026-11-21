import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const tokens=s=>(String(s).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).map(w=>w.toLowerCase().replaceAll('’',"'"));

/** Change direction descriptions only. The approved audio clock is immutable. */
export function reconcileStoryMetadata({props,manifest,narratedEdit,lock,priorLock,narration,wordTimings}){
 assert(props.audioApproved===true,'Restore the existing approved Adam edit first');
 const shots=props.shots;
 assert(Array.isArray(shots)&&new Set(shots.map(s=>s.sequence)).size===60,'Missing narrated beats');
 assert(lock.shots.length===60&&priorLock.shots.length===60,'Invalid director lock');
 const frames=shots.at(-1).end;
 assert(shots.every((s,i)=>s.start===(i?shots[i-1].end:0)&&s.end>s.start&&Number.isFinite(s.sourceStart)&&s.sourceEnd>s.sourceStart),'Invalid approved edit coverage');
 assert(Array.isArray(wordTimings)&&tokens(wordTimings.map(c=>c.text).join(' ')).join('|')===tokens(narration).join('|'),'Approved word timings differ from the script');
 // The existing preparer omits zero-frame words from captions. Compare with
 // that exact rule; captions alone are not the complete recorded transcript.
 const expectedCaptions=wordTimings.map(w=>({start:Math.round(Number(w.start)*30),end:Math.round(Number(w.end)*30),text:String(w.text).trim()})).filter(c=>c.text&&c.end>c.start);
 assert.deepEqual(props.captions,expectedCaptions,'Captions differ from the actual approved word timings');
 const voice=narratedEdit.voice;
 assert(voice?.voiceId==='pNInz6obpgDQGcFmaJgB'&&voice.modelId==='eleven_multilingual_v2'&&voice.playback?.speed===1.35&&voice.playback.mode==='varispeed'&&voice.assumedTiming===false,'Approved Adam provenance differs');
 assert([narration.trim(),narration.trim().replaceAll('\r\n','\n'),narration.trim().replace(/\r?\n/g,'\r\n')].map(hash).includes(voice.sourceHash),'Approved narration script hash differs');
 for(const doc of [manifest,narratedEdit]){
  assert(doc.durationInFrames===frames&&doc.shots.length===shots.length,'Live production manifests differ');
  assert(doc.shots.every((s,i)=>['id','sequence','start','end','sourceStart','sourceEnd'].every(k=>s[k]===shots[i][k])),'Live frame/source timing differs');
 }
 assert(narratedEdit.markers.length===60,'Actual narration markers required');
 assert(tokens(narratedEdit.markers.map(m=>m.spoken).join(' ')).join('|')===tokens(narration).join('|'),'Narration markers differ from the approved script');
 for(let n=1;n<=60;n++){
  const group=shots.filter(s=>s.sequence===n),mark=narratedEdit.markers[n-1];
  assert(mark.sequence===n&&mark.editStartFrame===group[0].start&&mark.editEndFrame===group.at(-1).end,'Narration marker timing differs at beat '+n);
 }
 const updated=shots.map(s=>{
  const before=priorLock.shots[s.sequence-1],after=lock.shots[s.sequence-1];
  const allowed=[before,after].some(d=>s.cameraAndAction.includes(d.visibleAction)&&s.cameraAndAction.includes(d.camera));
  assert(allowed,'Local creative direction differs at '+s.id+'; preserve it before installing');
  return {...s,cameraAndAction:after.visibleAction+' | CAMERA: '+after.camera};
 });
 const nextProps={...props,shots:updated};
 const signature=hash([narration.trim(),JSON.stringify(nextProps)].join('\n'));
 return {
  props:nextProps,
  manifest:{...manifest,shots:updated,sourceSignature:signature},
  narratedEdit:{...narratedEdit,shots:updated},
 };
}
