import {createEpisodeBox,type BoxIdentity} from './boxProps';
import {ease,rescueTipAngle,tippedEssieRoot,type State} from './timeline';
type Box=ReturnType<typeof createEpisodeBox>;
type Key='latte'|'essie'|'shared'|'demo';

/** One physical hinge policy shared by rendering and geometry QA. No walls hidden. */
export function stageEpisodeBox(box:Box,key:Key,s:State,n=s.story?.displayBeat??s.shot.sequence){
 const tip=key==='essie'?rescueTipAngle(n,s.u):0;
 const position=s[(key+'Box') as 'latteBox'|'essieBox'|'sharedBox'|'demoBox'];
 box.root.position.set(...(key==='essie'?tippedEssieRoot(position,tip):position));
 box.root.rotation.set(tip,(n===50&&key==='essie'||n===12&&key==='latte')?(s.story?.boxShake??0):0,0);
 box.root.visible=s.show[key];
 box.setOpenAmount(s.flap[key]);
 if(key==='demo'&&n<=3){
  if(n===2)box.flaps.right.rotation.z-=.065*Math.sin(Math.PI*s.u)*Math.sin(2*Math.PI*s.u);
  return;
 }
 // Full panels rest flat OUTSIDE the carton. Upright front/back flaps had
 // created barriers between the real camera and the original cat paintings.
 box.flaps.front.rotation.x=Math.PI;
 box.flaps.back.rotation.x=-Math.PI;
 box.flaps.left.rotation.z=Math.PI;
 box.flaps.right.rotation.z=-Math.PI;
 if(key==='latte'){
  if(n>=9&&n<=11)box.flaps.front.rotation.x=n===10?.10*Math.sin(Math.PI*s.u):0;
  if(n===12)box.flaps.front.rotation.x=Math.PI*ease((s.u-.15)/.70);
  if(n===16)box.flaps.front.rotation.x=Math.PI-.10;
 }
 if(key==='essie'){
  // The cafe back hinge rises within the footprint to clear the counter.
  if(s.room==='cafe')box.flaps.back.rotation.x=-Math.PI/2;
  if(n===7)box.flaps.right.rotation.z=-Math.PI/2;
  if(n===32||n===41)box.flaps.front.rotation.x=Math.PI-.08;
  if(n===51||n===52){
   // Keep front/back flaps level in world space as the WHOLE box tips.
   box.flaps.front.rotation.x=Math.PI-tip;
   box.flaps.back.rotation.x=-Math.PI-tip;
  }
 }
 if(key==='shared'){
  // Full left flap fits beside the window; right hinge clears the real chair.
  box.flaps.right.rotation.z=-Math.PI/2;
  if(n===59)box.flaps.front.rotation.x=Math.PI-.114;
 }
}

export function demoIdentity(s:State):BoxIdentity{
 return s.shot.sequence===57||(s.shot.sequence===58&&s.room==='street')?'lesson':'demo';
}
