export type Alignment={characters:string[];character_start_times_seconds:number[];character_end_times_seconds:number[]};
export type TimedText={text:string;start:number;end:number};
export type Pause={afterSentence:number;seconds:number};
export type Timing={characters:Alignment;words:TimedText[];sentences:TimedText[]};
const canonical=(s:string)=>s.normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
export function alignText(a:Alignment,script:string,duration:number):Timing{
 if(!a||!Array.isArray(a.characters)||!a.characters.length||a.characters.length!==a.character_start_times_seconds?.length||a.characters.length!==a.character_end_times_seconds?.length)throw new Error('Invalid character alignment lengths.');
 const text=a.characters.join('');if(canonical(text)!==canonical(script))throw new Error('Alignment does not cover the full requested script.');
 let previous=-1;const offsets:number[]=[];let offset=0;
 a.characters.forEach((c,i)=>{const s=a.character_start_times_seconds[i],e=a.character_end_times_seconds[i];
   if(typeof c!=='string'||!c.length||!Number.isFinite(s)||!Number.isFinite(e)||s<0||e<s||s<previous||e>duration+0.12)throw new Error('Invalid or out-of-range character timestamps.');
   offsets.push(offset);offset+=c.length;previous=s;
 });
 const timed=(start:number,end:number):TimedText=>{
  const first=offsets.findIndex((o,i)=>o+a.characters[i].length>start);let last=first;
  while(last+1<offsets.length&&offsets[last+1]<end)last++;
  return {text:text.slice(start,end),start:a.character_start_times_seconds[first],end:a.character_end_times_seconds[last]};
 };
 const words=[...text.matchAll(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)].map(m=>timed(m.index!,m.index!+m[0].length));
 const sentences:TimedText[]=[];let start=0;
 // Ellipses inside a sentence do not split a lowercase continuation ("somehow... they").
 const boundary=/[.!?]+["”']*(?=\s+[\p{Lu}]|\s*$)/gu;
 for(const m of text.matchAll(boundary)){const end=m.index!+m[0].length;while(/\s/.test(text[start]??'')&&start<end)start++;if(end>start)sentences.push(timed(start,end));start=end;}
 while(start<text.length&&/\s/.test(text[start]))start++;if(start<text.length)sentences.push(timed(start,text.length));
 if(!words.length||!sentences.length)throw new Error('Alignment has no usable words or sentences.');
 return {characters:structuredClone(a),words,sentences};
}
export function validatePauses(pauses:Pause[],timing:Timing):{at:number;seconds:number}[]{
 const seen=new Set<number>();return pauses.map(p=>{
  if(!Number.isInteger(p.afterSentence)||p.afterSentence<0||p.afterSentence>=timing.sentences.length||seen.has(p.afterSentence)||!Number.isFinite(p.seconds)||p.seconds<0||p.seconds>5)throw new Error('Invalid or duplicate pause.');
  seen.add(p.afterSentence);return {at:timing.sentences[p.afterSentence].end,seconds:p.seconds};
 }).filter(p=>p.seconds>0).sort((a,b)=>a.at-b.at);
}
export function shiftTiming(t:Timing,pauses:{at:number;seconds:number}[]):Timing{
 const shift=(v:number,end=false)=>v+pauses.filter(p=>end?v>p.at+1e-7:v>=p.at-1e-7).reduce((s,p)=>s+p.seconds,0);
 return {characters:{characters:[...t.characters.characters],character_start_times_seconds:t.characters.character_start_times_seconds.map(v=>shift(v)),character_end_times_seconds:t.characters.character_end_times_seconds.map(v=>shift(v,true))},words:t.words.map(w=>({...w,start:shift(w.start),end:shift(w.end,true)})),sentences:t.sentences.map(w=>({...w,start:shift(w.start),end:shift(w.end,true)}))};
}
export const secondsToFrame=(seconds:number,fps=30)=>{if(!Number.isFinite(seconds)||seconds<0||!Number.isFinite(fps)||fps<=0)throw new Error('Invalid time/frame rate.');return Math.round(seconds*fps);};
export type ShotTiming={name:string;startFrame:number;endFrame:number;sourceStart:number;sourceEnd:number;actionStartFrame:number;actionEndFrame:number};
export type NarrationPlan={fps:number;durationInFrames:number;audioDuration:number;shots:ShotTiming[];markers:Record<string,number>;sentences:TimedText[];words:TimedText[]};
export type BeatSpec={name:string;fromSentence:number;toSentence:number;sourceStart:number;sourceEnd:number};
export function planFromBeats(timing:Timing,duration:number,beats:BeatSpec[],fps=30,tailHold=0.65):NarrationPlan{
 if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(fps)||fps<=0||!Number.isFinite(tailHold)||tailHold<0||tailHold>5||!timing.sentences.length||duration<timing.sentences[timing.sentences.length-1].end-0.12)throw new Error('Invalid narration duration/hold.');
 if(!beats.length||beats[0].fromSentence!==0||beats[beats.length-1].toSentence!==timing.sentences.length-1)throw new Error('Beat map must cover all narration sentences.');
 beats.forEach((b,i)=>{if(!Number.isInteger(b.fromSentence)||!Number.isInteger(b.toSentence)||b.toSentence<b.fromSentence||b.toSentence>=timing.sentences.length||i>0&&b.fromSentence!==beats[i-1].toSentence+1||!Number.isInteger(b.sourceStart)||!Number.isInteger(b.sourceEnd)||b.sourceStart<0||b.sourceEnd<b.sourceStart)throw new Error('Invalid, overlapping or incomplete story beat map.');});
 const total=Math.ceil((duration+tailHold)*fps),starts=beats.map((b,i)=>i===0?0:secondsToFrame(timing.sentences[b.fromSentence].start,fps));
 const shots=beats.map((b,i)=>{
   const start=starts[i],end=i===beats.length-1?total:starts[i+1];if(end-start<8)throw new Error('Narration beat is too short for a readable shot.');
   return {name:b.name,startFrame:start,endFrame:end,sourceStart:b.sourceStart,sourceEnd:b.sourceEnd,actionStartFrame:Math.max(start,secondsToFrame(timing.sentences[b.fromSentence].start,fps)),actionEndFrame:Math.min(end-1,secondsToFrame(timing.sentences[b.toSentence].end,fps))};
 });
 return {fps,durationInFrames:total,audioDuration:duration,shots,markers:Object.fromEntries(shots.map(s=>[s.name,s.startFrame])),sentences:timing.sentences,words:timing.words};
}
export function planTown(timing:Timing,duration:number,fps=30,tailHold=0.65):NarrationPlan{
 if(timing.sentences.length!==5)throw new Error('A Little Light requires the five approved test sentences; other scripts can use planFromBeats.');
 const p=planFromBeats(timing,duration,[{name:'The lonely kitten',fromSentence:0,toSentence:1,sourceStart:0,sourceEnd:44},{name:'Essie notices',fromSentence:2,toSentence:2,sourceStart:45,sourceEnd:104},{name:'The warm drink',fromSentence:3,toSentence:3,sourceStart:105,sourceEnd:164},{name:'A little light',fromSentence:4,toSentence:4,sourceStart:165,sourceEnd:239}],fps,tailHold);
 return {...p,markers:{...p.markers,midnight:secondsToFrame(timing.sentences[0].end,fps),exceptOurs:secondsToFrame(timing.sentences[1].start,fps),kittenAtDoor:p.shots[1].startFrame,warmCup:p.shots[2].startFrame,somewhereWarm:p.shots[3].startFrame}};
}
export function validatePlan(p:NarrationPlan){
 if(!p||p.fps!==30||!Number.isInteger(p.durationInFrames)||p.durationInFrames<1||p.durationInFrames>54000||!Number.isFinite(p.audioDuration)||p.audioDuration<=0||p.audioDuration*30>p.durationInFrames+1||!Array.isArray(p.shots)||p.shots.length!==4)throw new Error('Invalid narration plan.');
 const ranges=[[0,44],[45,104],[105,164],[165,239]];
 p.shots.forEach((s,i)=>{if(![s.startFrame,s.endFrame,s.actionStartFrame,s.actionEndFrame].every(Number.isInteger)||s.startFrame!==(i===0?0:p.shots[i-1].endFrame)||s.endFrame<=s.startFrame||s.actionStartFrame<s.startFrame||s.actionEndFrame<s.actionStartFrame||s.actionEndFrame>=s.endFrame||s.sourceStart!==ranges[i][0]||s.sourceEnd!==ranges[i][1])throw new Error('Invalid narrated visual beat mapping.');});
 if(p.shots[3].endFrame!==p.durationInFrames)throw new Error('Incomplete narration plan.');return p;
}
export function visualFrameAt(frame:number,p:NarrationPlan):number{
 if(!Number.isFinite(frame)||frame<0)throw new Error('Invalid animation frame.');
 const shot=p.shots.find(s=>frame>=s.startFrame&&frame<s.endFrame)??p.shots[p.shots.length-1];
 const u=Math.max(0,Math.min(1,(frame-shot.startFrame)/Math.max(1,shot.actionEndFrame-shot.startFrame)));
 return Math.round(shot.sourceStart+u*(shot.sourceEnd-shot.sourceStart));
}
