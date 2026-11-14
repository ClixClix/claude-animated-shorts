import React from 'react';
import {AbsoluteFill,Audio,Composition,Freeze,staticFile,useCurrentFrame} from 'remotion';
import {ALittleLight} from '../animation/ALittleLight';
import {NarrationPlan,visualFrameAt,validatePlan} from './timing';
export type PreviewProps={audioFile:string;plan:NarrationPlan|null;samplesApproved:boolean;pacingApproved:boolean;measuredTruePeak:number|null;fixtureLabel?:string};
const safeFile=(s:string)=>/^v2-narration\/[A-Za-z0-9_-]+\.mp3$/.test(s);
const Preview:React.FC<PreviewProps>=({audioFile,plan,samplesApproved,pacingApproved,measuredTruePeak,fixtureLabel})=>{
 const f=useCurrentFrame();
 if(!plan||!samplesApproved||!pacingApproved||measuredTruePeak===null||measuredTruePeak> -1||!safeFile(audioFile))return <AbsoluteFill style={{background:'#14283c',color:'#f3ddbc',justifyContent:'center',padding:100,fontSize:38,fontFamily:'sans-serif'}}>Narrated preview awaits verified audio, sample approval and pacing review. The original silent test is unchanged.</AbsoluteFill>;
 return <AbsoluteFill><Freeze frame={visualFrameAt(f,plan)}><ALittleLight/></Freeze><Audio src={staticFile(audioFile)}/>{fixtureLabel&&<div style={{position:'absolute',bottom:30,left:20,right:20,background:'#14283c',color:'#fff',padding:16,fontSize:24,textAlign:'center'}}>{fixtureLabel}</div>}</AbsoluteFill>;
};
/** Props contain only public audio/timing data. No server client, key or environment binding is imported. */
export const NarrationComposition:React.FC=()=> <Composition id="InThisTownV2Narrated" component={Preview} durationInFrames={240} width={1080} height={1920} fps={30}
 defaultProps={{audioFile:'',plan:null,samplesApproved:false,pacingApproved:false,measuredTruePeak:null} as PreviewProps}
 calculateMetadata={({props})=>{
   if(!props.plan)return {durationInFrames:240};
   validatePlan(props.plan);
   return {durationInFrames:props.plan.durationInFrames};
 }}/>;
