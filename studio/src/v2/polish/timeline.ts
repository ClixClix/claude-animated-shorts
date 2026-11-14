import {StoryState,beat,ease,clamp,mix3} from '../animation/timeline';
import {V3} from '../cafe/config';
import {KittenActing} from '../animation/kitten';
import {floorAt,travelDistance,routePoint,plantedFeet,hopAt,ROUTE_LENGTH} from './locomotion';

export const POLISH_FPS=30;
export const POLISH_FRAMES=522;
export const POLISH_SHOTS=[
 {id:'A',start:0,end:36,name:'Alone outside',composition:'Short exterior establishing shot',action:'Lonely kitten beneath the glowing café windows',emotion:'Isolation and warmth in the same frame',narration:'In this town'},
 {id:'B',start:36,end:104,name:'A small, cold stranger',composition:'Eye-level kitten close-up',action:'Ears lower; eyes glance to the warm doorway; hesitant breath',emotion:'Vulnerability',narration:'every café closed at midnight'},
 {id:'C',start:104,end:147,name:'Except ours',composition:'Warm interior / Essie and the serving counter',action:'Establish Essie at work and the existing cup',emotion:'A place of safety',narration:'Except ours'},
 {id:'D',start:147,end:192,name:'One brave step',composition:'Low three-quarter walking medium',action:'Anticipation, then several planted-paw steps toward the entrance',emotion:'Courage despite fear',narration:'pause, then One night'},
 {id:'E',start:192,end:242,name:'Across the threshold',composition:'Interior doorway tracking shot',action:'Door opens; kitten visibly crosses into the café',emotion:'Uncertainty becoming hope',narration:'a frightened kitten appeared at the door'},
 {id:'F',start:242,end:276,name:'Essie decides',composition:'Medium close-up reaction',action:'Eyes, ears, head turn, concern, cup glance, decision',emotion:'Recognition and empathy',narration:'door, then unvoiced'},
 {id:'G',start:276,end:372,name:'Come in',composition:'Continuous interior follow shot',action:'Visible aisle route, crouch, hop and supported landing',emotion:'Responding to Essie’s invitation',narration:'unvoiced'},
 {id:'H',start:372,end:438,name:'A gentle offer',composition:'Three-quarter counter medium with visible paw and cup',action:'Notice cup, reach, contact, push, settle and release',emotion:'Purposeful kindness',narration:'unvoiced'},
 {id:'I',start:438,end:522,name:'Somewhere safe',composition:'Eye-level emotional two-shot / restrained push-in',action:'Cup glance, hesitation, relaxed ears, small smile, appreciative look',emotion:'Safety and connection',narration:'unvoiced'},
] as const;
export const CUP_BEGIN:V3=[0.15,1.12,-1.23],CUP_OFFER:V3=[0.48,1.12,-1.0];
export const KITTEN_REST:V3=[0.64,1.12,-0.79];
const CUP_DIRECTION:V3=[(CUP_OFFER[0]-CUP_BEGIN[0])/Math.hypot(0.33,0.23),0,(CUP_OFFER[2]-CUP_BEGIN[2])/Math.hypot(0.33,0.23)];
const blink=(f:number,centers:number[])=>Math.max(0,...centers.map(c=>1-Math.abs(f-c)/2.4));
export function polishAt(frame:number){
  const f=Math.max(0,Math.min(POLISH_FRAMES-1,frame));
  const shot=POLISH_SHOTS.find(s=>f>=s.start&&f<s.end)!;
  const u=ease((f-shot.start)/Math.max(1,shot.end-shot.start-1));
  const distance=travelDistance(f),walkingFeet=plantedFeet(distance),root=routePoint(distance).position;
  const moving=f>154&&f<241||f>276&&f<344;
  let kitten:V3=[...root];
  if(moving)kitten[1]+=Math.abs(Math.sin(distance/0.26*Math.PI*2))*0.009;
  let feet=walkingFeet.map(p=>p.position),supportHeight=floorAt(kitten[2]),airborne=false;
  if(f>344){const h=hopAt(f);kitten=h.position;feet=h.feet;airborne=h.airborne;supportHeight=kitten[2]<-0.5?1.12:0;}
  if(f>=369){kitten=[...KITTEN_REST];feet=[[-0.05,0,0],[0.05,0,0]].map(v=>[kitten[0]+v[0],kitten[1],kitten[2]] as V3);supportHeight=1.12;}

  const fear=0.93-0.13*beat(f,276,330)-0.80*beat(f,452,482);
  const smile=0.74*beat(f,472,499);
  const essie:V3=[0.02,0.60,-2.08+0.32*beat(f,372,382)];
  const concern=beat(f,252,264)*(1-beat(f,474,500)),reassurance=beat(f,478,506);
  const cup=mix3(CUP_BEGIN,CUP_OFFER,beat(f,397,420));
  const shoulder:V3=[essie[0]+0.12,1.245,essie[2]+0.12];
  const contactPoint:V3=[cup[0]-CUP_DIRECTION[0]*0.17,1.265,cup[2]-CUP_DIRECTION[2]*0.17];
  const rest:V3=[essie[0]+0.12,1.245,essie[2]+0.12];
  let reach=0,paw:V3=[...rest];
  if(f>=269&&f<328){
    // The offered paw is a decision/beckoning gesture, not hidden cup contact.
    reach=beat(f,269,282)*(1-beat(f,312,328));paw=mix3(rest,[0.24,1.39,-1.25],reach);
  }
  if(f>=380&&f<394){reach=beat(f,380,394);paw=mix3(rest,contactPoint,reach);paw[1]+=Math.sin(Math.PI*reach)*0.07;}
  const contact=f>=394&&f<=424;
  if(contact){reach=1;paw=contactPoint;}
  if(f>424&&f<436){reach=1-beat(f,425,436);paw=mix3(rest,contactPoint,reach);paw[1]+=Math.sin(Math.PI*reach)*0.07;}

  let camera:V3,target:V3,fov:number,blur=0,required=['kitten'];
  switch(shot.id){
    case 'A':camera=mix3([5.0,2.4,8.4],[4.8,2.3,8.15],u);target=[0.2,1.3,3.9];fov=76;break;
    case 'B':camera=mix3([3.40,0.92,6.35],[3.34,0.91,6.27],u);target=[2.25,0.42,5.05];fov=45;break;
    case 'C':camera=[1.15,1.85,1.2];target=[-0.3,1.39,-2.1];fov=66;required=['essie','cup'];break;
    case 'D':camera=[3.8,1.02,6.3];target=[2.25,0.39,4.66];fov=49;break;
    case 'E':camera=[0.30,1.20,3.45];target=[kitten[0],kitten[1]+0.38,kitten[2]];fov=75;break;
    case 'F':camera=[0.1,1.88,-3.08];target=[0.10,1.47,-1.90];fov=76;required=['essie'];break;
    case 'G':camera=mix3([2.8,1.95,3.8],[1.4,2.0,2.4],u);target=[kitten[0],kitten[1]+0.39,kitten[2]-0.1];fov=72;break;
    case 'H':camera=[-0.75,1.87,1.24];target=[0.29,1.40,-1.17];fov=57;required=['kitten','essie','cup'];break;
    default:camera=mix3([0,1.60,0.90],[0,1.57,0.65],u);target=[0.40,1.50,-1.18];fov=62;blur=4;required=['kitten','essie','cup'];break;
  }
  const earlyGlance=beat(f,65,84),inside=f>=192;
  let gazeX=earlyGlance*0.75,gazeY=0.1,headTurn=earlyGlance*0.35,headTilt=-0.045;
  if(f>=147&&f<192){gazeX=0.75;headTurn=0.32;gazeY=-0.15;headTilt=-0.02;}
  if(inside&&f<438){gazeX=f<242?-0.55:0.42;headTurn=f<242?-0.3:0.23;gazeY=-0.15;}
  if(f>=426){const cupLook=beat(f,426,441),gratitude=beat(f,484,508);gazeX=0.42*(1-cupLook)-0.58*gratitude;gazeY=0.62*cupLook*(1-gratitude)+0.08*gratitude;headTurn=0.23*(1-cupLook)-0.30*gratitude;headTilt=0.055*beat(f,442,456)-0.03*gratitude;}
  const earDrop=0.94-0.16*beat(f,276,330)-0.78*beat(f,450,484);
  const crouch=0.6*beat(f,147,152)*(1-beat(f,154,160))+0.8*beat(f,338,344)*(1-beat(f,344,348))+0.65*beat(f,367,370)*(1-beat(f,371,380));
  const kittenActing:KittenActing={feet,gazeX,gazeY,headTurn,headTilt,earDrop,crouch,tail:0.25*beat(f,480,506)};
  const headTurnEssie=-0.67*beat(f,248,260)*(1-beat(f,266,280));
  const state:StoryState={frame:f,shot:shot.id==='A'||shot.id==='B'||shot.id==='D'?1:shot.id==='C'||shot.id==='F'?2:shot.id==='I'?4:3,
    camera,target,fov,blur,kitten,kittenFear:Math.max(0,fear),kittenSmile:smile,kittenLook:0,kittenGait:distance/0.26*Math.PI*2,kittenLift:airborne?Math.sin(Math.PI*hopAt(f).progress):0,kittenWalking:moving?1:0,kittenBlink:blink(f,[62,159,229,361,493]),
    essie,essiePose:{yaw:-0.06,headTurn:headTurnEssie,gazeX:-0.85*beat(f,243,248)*(1-beat(f,265,277))+0.50*beat(f,372,383)*(1-beat(f,427,444)),gazeY:0.42*beat(f,265,273)*(1-beat(f,280,292))+0.35*beat(f,372,382)*(1-beat(f,391,400)),
      earLeft:0.85*beat(f,246,252)*(1-beat(f,265,280)),earRight:-0.38*beat(f,247,254)*(1-beat(f,265,280)),headTilt:-0.11*concern+0.07*beat(f,268,274)*(1-beat(f,275,282))+0.065*reassurance,blink:blink(f,[121,265,383,501]),breath:Math.sin(f/30*1.8)*0.28,tail:0.07*Math.sin(f/30),expression:'neutral'},
    concern,reassurance,cup,paw,shoulder,reach,contact,door:1.15*beat(f,177,208)*(1-beat(f,248,300))};
  return {state,kittenActing,kittenSupportHeight:supportHeight,kittenShadowOpacity:Math.max(0.18,Math.exp(-Math.max(0,kitten[1]-supportHeight)*2.2)),required,
    shot,walkingFeet,routeDistance:Math.min(distance,ROUTE_LENGTH),airborne};
}
