// Narration-first Episode02 edit, using the same verified Adam word-timing
// approach as Episode01's door-polish-prepare.mjs. Pure; no network / TTS.
import {createHash} from 'node:crypto';
const words=s=>(String(s).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[])
 .map(w=>w.toLowerCase().replaceAll('’',"'"));
const sha256=s=>createHash('sha256').update(s).digest('hex');
const assert=(cond,msg)=>{if(!cond)throw Error('EP02 narration edit: '+msg);};
// A coherent narrated action may exceed four seconds (creator direction).
// Keep each beat whole; scene-local choreography determines motivated cuts.
const FPS=30,MAX=Number.MAX_SAFE_INTEGER;
export function createNarratedEpisodeEdit({script,plan,draft,alignment,voiceSeconds,provenance}){
 assert(plan?.shots?.length===60&&draft?.shots?.length===60,'Exactly 60 story beats required');
 assert(plan.narrator?.provider==='ElevenLabs'&&plan.narrator.voiceName==='Adam'&&
  plan.narrator.voiceId==='pNInz6obpgDQGcFmaJgB'&&
  plan.narrator.modelId==='eleven_multilingual_v2','Only the original Episode01 Adam voice is allowed');
 assert(provenance?.voiceId===plan.narrator.voiceId&&
  provenance.modelId===plan.narrator.modelId&&
  provenance.scriptSHA256===sha256(script),'Adam take provenance is missing or mismatched');
 assert(provenance?.pitchAndTempo?.speed===1.35&&
  provenance?.pitchAndTempo?.mode==='varispeed',
  'Must use original Episode01 Adam 1.35x varispeed preset');
 assert(Number.isFinite(voiceSeconds)&&voiceSeconds>30&&voiceSeconds<=240,'Invalid Adam narration duration');
 assert(Math.abs(Number(provenance.duration)-voiceSeconds)<.12,'Voice length and provenance disagree');
 assert(Array.isArray(alignment)&&alignment.length>200,'Actual Adam word timestamps required; no estimated timings');
 assert(alignment.every((w,i)=>typeof w.text==='string'&&
   Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.start>=0&&w.end>=w.start&&
   w.end<=voiceSeconds+.12&&(i===0||w.start>=alignment[i-1].start)),
  'Invalid or out-of-range word alignment');
 const scriptWords=words(script),mappedWords=words(plan.shots.map(s=>s.spoken).join(' ')),
   actual=alignment.flatMap(w=>words(w.text));
 assert(scriptWords.join('|')===mappedWords.join('|'),'Shot narration does not equal full spoken script');
 assert(scriptWords.join('|')===actual.join('|'),'Adam recording does not cover EXACT script in correct word order');
 const limits=[],scored=[];let cursor=0;
 for(let i=0;i<60;i++){
  const beat=plan.shots[i],src=draft.shots[i],tokens=words(beat.spoken);
  assert(beat.sequence===i+1&&src.sequence===i+1&&beat.id===src.id,
   'Narration/source shot mismatch at '+(i+1));
  const first=cursor,last=cursor+tokens.length-1;
  assert(last<alignment.length,'Missing timed dialogue at shot '+beat.id);
  const lineStart=alignment[first].start,lineEnd=alignment[last].end;
  if(i>0){
   const prior=alignment[first-1].end;
   const midpoint=(prior+lineStart)*.5;
   limits.push(Math.round(midpoint*FPS));
  }
  scored.push({shot:src,spoken:beat.spoken,wordStart:first,wordEnd:last,
   speechStart:lineStart,speechEnd:lineEnd});
  cursor=last+1;
 }
 assert(cursor===alignment.length,'Unassigned recorded words');
 const frames=Math.ceil(voiceSeconds*FPS);
 const cuts=[0,...limits,frames];
 assert(cuts.every((n,i)=>i===0||n>cuts[i-1]),'A spoken beat has no usable frames');
 const shots=[];
 for(let i=0;i<60;i++){
  const {shot,spoken,speechStart,speechEnd,wordStart,wordEnd}=scored[i];
  const start=cuts[i],end=cuts[i+1],span=end-start;
  assert(span>=9,'Shot '+shot.id+' is too short (<9 frames); manual editorial split required');
  const pieces=Math.ceil(span/MAX),oldStart=shot.estimateStartFrame,oldEnd=shot.estimateEndFrame;
  for(let j=0;j<pieces;j++){
   const a=start+Math.round(span*j/pieces);
   const b=start+Math.round(span*(j+1)/pieces);
   assert(b>a&&b-a<=MAX,'Invalid insert span for '+shot.id);
   const suffix=pieces===1?'':String.fromCharCode(65+j);
   shots.push({
    id:shot.id+suffix,sequence:shot.sequence,act:shot.act,start:a,end:b,
    sourceStart:oldStart+(oldEnd-oldStart)*j/pieces,
    sourceEnd:oldStart+(oldEnd-oldStart)*(j+1)/pieces,
    narrationAnchor:shot.narrationAnchor,cameraAndAction:shot.cameraAndAction,
    soundCue:shot.soundCue,
    editorialPurpose:pieces===1?spoken:
     'Continuous performance detail '+(j+1)+'/'+pieces+' within: '+spoken
   });
  }
 }
 assert(shots[0].start===0&&shots.at(-1).end===frames&&
   shots.every((s,i)=>s.end>s.start&&s.end-s.start<=MAX&&
     (i===0||shots[i-1].end===s.start)),
  'Incomplete or overlapping editorial coverage');
 const markers=scored.map((x,i)=>({
  sequence:i+1,sourceId:x.shot.id,spoken:x.spoken,
  speechStart:x.speechStart,speechEnd:x.speechEnd,
  editStartFrame:cuts[i],editEndFrame:cuts[i+1],
  cuts:shots.filter(y=>y.sequence===i+1).map(y=>y.id)
 }));
 assert(shots.filter(x=>x.sequence<=2).every(x=>x.sourceStart>=0&&x.sourceEnd<=105),
  'Approved 01–02 crane source footage changed');
 const flags=markers.filter(x=>x.speechStart<x.editStartFrame/FPS-.09||
  x.speechEnd>x.editEndFrame/FPS+.09);
 assert(!flags.length,'Spoken text falls outside its visual beat: '+flags.map(x=>x.sourceId).join(', '));
 return {shots,durationInFrames:frames,markers,voice:{
  voiceId:provenance.voiceId,modelId:provenance.modelId,
  audioDuration:voiceSeconds,wordCount:alignment.length,
  sourceHash:provenance.scriptSHA256,playback:provenance.pitchAndTempo,
  untouchedContinuousRecording:true,assumedTiming:false}};
}
