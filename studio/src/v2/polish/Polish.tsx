import React from 'react';
import {AbsoluteFill,Audio,Composition,staticFile,useCurrentFrame} from 'remotion';
import {ALittleLight} from '../animation/ALittleLight';
import {polishAt,POLISH_FRAMES} from './timeline';

export const Polish:React.FC=()=>{
  const frame=useCurrentFrame(),p=polishAt(frame);
  return <AbsoluteFill><ALittleLight state={p.state} motionFrame={frame} kittenActing={p.kittenActing}
    kittenSupportHeight={p.kittenSupportHeight} kittenShadowOpacity={p.kittenShadowOpacity} required={p.required}/>
    <Audio src={staticFile('v2-narration/approved-sawyer.mp3')}/></AbsoluteFill>;
};
export const PolishComposition:React.FC=()=> <Composition id="InThisTownV2Polish" component={Polish} durationInFrames={POLISH_FRAMES} width={1080} height={1920} fps={30}/>;
