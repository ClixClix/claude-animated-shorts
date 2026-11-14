import {storyAt, StoryState} from '../animation/timeline';
import {NarrationPlan, Timing, secondsToFrame, validatePlan} from './timing';

export type TownAuditionTiming = {
  sourceFrames: {frame: number; source: number}[];
  blinkFrames: number[];
};

/** The approved three-sentence recording describes arrival, not the later act of kindness. */
export function planTownAudition(timing: Timing, audioDuration: number) {
  if (timing.sentences.length !== 3 || !Number.isFinite(audioDuration) || audioDuration <= 0) {
    throw new Error('The approved town audition requires its three recorded sentences.');
  }
  const word = (text: string) => {
    const result = timing.words.find(w => w.text.toLowerCase() === text);
    if (!result) throw new Error('Required arrival word is absent from the recorded alignment.');
    return result;
  };
  const arrival = secondsToFrame(word('appeared').start);
  const stepStart = secondsToFrame(timing.sentences[2].start);
  if (arrival - stepStart < 24 || stepStart < 45 || audioDuration < word('door').end) {
    throw new Error('Recorded arrival timing cannot support the approved acting.');
  }
  const reactionEnd = Math.max(arrival + 60, Math.ceil(audioDuration * 30) + 18);
  const counterEnd = reactionEnd + 60;
  const end = counterEnd + 80;
  const shots: NarrationPlan['shots'] = [
    {name:'The lonely kitten',startFrame:0,endFrame:arrival,sourceStart:0,sourceEnd:44,actionStartFrame:stepStart,actionEndFrame:arrival-1},
    {name:'Essie notices',startFrame:arrival,endFrame:reactionEnd,sourceStart:45,sourceEnd:104,actionStartFrame:arrival,actionEndFrame:reactionEnd-1},
    {name:'The warm drink',startFrame:reactionEnd,endFrame:counterEnd,sourceStart:105,sourceEnd:164,actionStartFrame:reactionEnd,actionEndFrame:counterEnd-1},
    {name:'A little light',startFrame:counterEnd,endFrame:end,sourceStart:165,sourceEnd:239,actionStartFrame:counterEnd,actionEndFrame:counterEnd+74},
  ];
  const plan: NarrationPlan = {
    fps:30,durationInFrames:end,audioDuration,shots,
    sentences:timing.sentences,words:timing.words,
    markers:{oneNight:stepStart,kittenAppeared:arrival,narrationEnds:Math.ceil(audioDuration*30),cupOffer:reactionEnd,emotionalPayoff:counterEnd},
  };
  validatePlan(plan);
  const visualTiming: TownAuditionTiming = {
    sourceFrames:[
      {frame:0,source:0},
      {frame:stepStart,source:19},
      {frame:arrival-9,source:36},
      {frame:arrival-1,source:44},
      {frame:arrival,source:45},
      {frame:reactionEnd-1,source:104},
      {frame:reactionEnd,source:105},
      {frame:counterEnd-1,source:164},
      {frame:counterEnd,source:165},
      {frame:counterEnd+74,source:239},
      {frame:end-1,source:239},
    ],
    blinkFrames:[110,counterEnd+19,counterEnd+57],
  };
  validateTownAuditionTiming(visualTiming, plan);
  return {plan, visualTiming};
}

export function validateTownAuditionTiming(t:TownAuditionTiming,p:NarrationPlan) {
  validatePlan(p);
  if (!t || !Array.isArray(t.sourceFrames) || t.sourceFrames.length<2 ||
      !Array.isArray(t.blinkFrames) || t.blinkFrames.some(f=>!Number.isFinite(f)||f<0||f>=p.durationInFrames)) {
    throw new Error('Invalid town audition timing.');
  }
  t.sourceFrames.forEach((k,i)=>{
    if (!Number.isInteger(k.frame)||!Number.isFinite(k.source)||k.source<0||k.source>239||
        (i>0&&(k.frame<=t.sourceFrames[i-1].frame||k.source<t.sourceFrames[i-1].source))) {
      throw new Error('Source time must progress continuously and deterministically.');
    }
  });
  if (t.sourceFrames[0].frame!==0||t.sourceFrames[0].source!==0||
      t.sourceFrames.at(-1)!.frame!==p.durationInFrames-1||t.sourceFrames.at(-1)!.source!==239) {
    throw new Error('Incomplete town audition time map.');
  }
  for (const shot of p.shots) {
    if (sourceFrameAt(shot.startFrame,t)!==shot.sourceStart||sourceFrameAt(shot.endFrame-1,t)!==shot.sourceEnd) {
      throw new Error('A narrated camera cut crosses an approved shot boundary.');
    }
  }
  return t;
}

/** Fractional source time keeps camera/acting smooth when a shot is extended. */
export function sourceFrameAt(frame:number,t:TownAuditionTiming) {
  if (!Number.isFinite(frame)||frame<0) throw new Error('Invalid narrated frame.');
  const keys=t.sourceFrames;
  for(let i=1;i<keys.length;i++) {
    if(frame<=keys[i].frame) {
      const a=keys[i-1],b=keys[i],u=(frame-a.frame)/(b.frame-a.frame);
      return a.source+(b.source-a.source)*Math.max(0,Math.min(1,u));
    }
  }
  return keys[keys.length-1].source;
}

export function townAuditionStateAt(frame:number,t:TownAuditionTiming):StoryState {
  const s=storyAt(sourceFrameAt(frame,t));
  const blink=(center:number)=>Math.max(0,1-Math.abs(frame-center)/2.6);
  // Only idle timing is decoupled; all positions, head turns, reaches and contact use the approved timeline.
  return {...s,kittenBlink:Math.max(0,...t.blinkFrames.map(blink)),
    essiePose:{...s.essiePose,breath:Math.sin(frame/30*1.8)*0.3,tail:0.10*Math.sin(frame/30*1.1)}};
}
