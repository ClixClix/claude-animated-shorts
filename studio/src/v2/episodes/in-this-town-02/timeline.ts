import scratch from './EDITORIAL_SCRATCH_PLAN.json';
import type {V3} from '../../cafe/config';
export const FPS=30;
export const FIRST_DRAFT_FRAMES=3876;
export type BoxStage='normal'|'resting'|'morphing'|'boxed'|'rescuing'|'restored';
export type ActorPose={position:V3;visible:boolean;walking:boolean;emotion:'neutral'|'happy'|'sad'|'scared'|'surprised'|'concerned';headTurn:number;scale:number;morph:number;gazeY:number};
export type EditShot={id:string;sequence:number;act:string;start:number;end:number;cameraAndAction:string;narrationAnchor:string;soundCue:string};
export type EpisodeEdit={shots:EditShot[];captions?:{start:number;end:number;text:string}[]};
export const SCRATCH_EDIT:EpisodeEdit={shots:scratch.shots.map(s=>({
 id:s.id,sequence:s.sequence,act:s.act,start:s.estimateStartFrame,end:s.estimateEndFrame,
 cameraAndAction:s.cameraAndAction,narrationAnchor:s.narrationAnchor,soundCue:s.soundCue,
}))};
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export const mix=(a:V3,b:V3,t:number):V3=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
export const HOME={
  latte:[-1.9,0,2.1] as V3,
  essie:[.25,0,.3] as V3,
  shared:[-1.45,0,2.1] as V3,
  cafeMocha:[-.35,0,1.4] as V3,
  door:[2.25,0,4.45] as V3,
  entrance:[2.4,0,6.65] as V3,
  busStop:[-5.20,0,6.1] as V3, // Past the shelter sign pole; shot28/29 remain continuous.
  market:[-7.3,0,6.5] as V3,
  alleyMouth:[-9.25,0,4.7] as V3,
  alleyBox:[-9.15,0,1.4] as V3,
  demo:[1.8,0,5.35] as V3
};
const hidden=():ActorPose=>({position:[0,0,0],visible:false,walking:false,emotion:'neutral',headTurn:0,scale:1,morph:0,gazeY:0});
const actor=(position:V3,visible=true,emotion:ActorPose['emotion']='neutral',walking=false,morph=0):ActorPose=>({
 position:[...position],visible,walking,emotion,headTurn:0,scale:1,morph,gazeY:0
});
const closer=(p:V3,z=1.25,x=.6):V3=>[p[0]+x,p[1],p[2]+z];
const walk=(a:V3,b:V3,u:number)=>mix(a,b,ease(u));
const cameraPreset=(camera:V3,target:V3,fov=52,blur=0)=>({camera,target,fov,blur});
export type State={
 frame:number;shot:EditShot;u:number;t:number;daylight:boolean;
 camera:V3;target:V3;fov:number;blur:number;
 mocha:ActorPose;essie:ActorPose;latte:ActorPose;demoCat:ActorPose;
 latteBox:V3;essieBox:V3;sharedBox:V3;demoBox:V3;
 show:{latte:boolean;essie:boolean;shared:boolean;demo:boolean};
 flap:{latte:number;essie:number;shared:number;demo:number};
 morph:{essie:number;latte:number;demo:number};
 rescued:{essie:boolean;latte:boolean};
 heroBox:'latte'|'essie'|'shared'|'demo'|null;room:string;
};
export const locateShot=(frame:number,shots:EditShot[])=>{
 const found=shots.find(s=>frame>=s.start&&frame<s.end);
 return found??shots.at(-1)!;
};
export function stateAt(frame:number,shots:EditShot[]):State{
 const sh=locateShot(frame,shots),n=sh.sequence,u=clamp((frame-sh.start)/Math.max(1,sh.end-sh.start-1)),t=frame/30;
 let day=n<=23||n>=56;
 let mocha=actor(HOME.cafeMocha,n>=5,'neutral'),essie=actor(closer(HOME.essie),n===7||(n>=18&&n<=23),'happy'),latte=actor(closer(HOME.latte),n===6,'happy');
 let demoCat=actor(closer(HOME.demo,.2,0),n<=3,'happy');
 const latteBox=[...HOME.latte] as V3,sharedBox=[...HOME.shared] as V3,demoBox=[...HOME.demo] as V3;
 let essieBox=[...HOME.essie] as V3;
 const show={latte:n>=6&&n<=55,essie:n===7||(n>=18&&n<=23)||(n>=32&&n<=52),shared:n>=58,demo:n<=5};
 const flap={latte:.85,essie:.85,shared:.98,demo:.85}; // Lay finale side flaps almost flat, not across Mocha's approach.
 const morph={essie:0,latte:0,demo:0};
 let heroBox:State['heroBox']=null,room='cafe';
 let cam=cameraPreset([3.1,1.8,9.7],[2.1,.8,6.7],59);
 const focus=(p:V3,dist=2.8,fov=51,side=1.4)=>cameraPreset([p[0]+side,Math.max(1.3,p[1]+1.8),p[2]+dist],[p[0],p[1]+.75,p[2]],fov);
 if(n<=4){
  room='street';heroBox='demo';demoCat=actor(closer(HOME.demo,.06,0),n<3,'surprised',false);
  cam=n===1?cameraPreset([4.2,1.0,9.2],[3.45,.6,7.6] as V3,38):
      n===2?cameraPreset([3.4,5.0,7.6],[3.45,.10,7.6],48):
      n===3?focus(HOME.demo,2.1,40,.45):cameraPreset([6,1.65,9.2],[3.45,.5,7.6],62);
  if(n===2){
   // Keep all four physical flaps outside the rim in this high-angle view.
   // Carry the approved Shot 01 peek and flap position through the
   // exact frame-84 boundary; the camera will dolly in instead of cutting.
   flap.demo=lerp(.84,1,ease(u/.62));
   demoCat.position=[HOME.demo[0],.04-.018*ease(u/.78),HOME.demo[2]];
   demoCat.headTurn=.10*Math.sin(u*Math.PI*2);
  }
  if(n===3){
    // Let the audience see the living kitten BEFORE the cardboard fold.
    // Earlier full movie showed only ears behind a flap from frame 63.
    const fold=ease((u-.28)/.62);
    demoCat.visible=true;demoCat.morph=fold;
    demoCat.position=[HOME.demo[0],.13-.16*fold,HOME.demo[2]];
    morph.demo=fold;
    flap.demo=lerp(1,.25,ease((u-.36)/.56));
   }
  if(n===4){demoCat.visible=false;flap.demo=.33;}
 }
 if(n===5){mocha.position=walk(HOME.entrance,[1.15,0,6],u);mocha.walking=true;mocha.emotion='sad';heroBox='demo';cam=cameraPreset([5.15,1.7,9.0],[2,.7,5.1],55);}
 if(n===6){latte.position=[HOME.latte[0],.02,HOME.latte[2]];latte.emotion='happy';mocha.visible=false;heroBox='latte';cam=focus(HOME.latte,2.6,46,-.25);flap.latte=.9;}
 if(n===7){essie.position=[HOME.essie[0],.02,HOME.essie[2]];mocha.position=[1.45,0,.9];mocha.emotion='sad';essie.emotion='happy';heroBox='essie';cam=focus(HOME.essie,2.7,58,1.5);}
 if(n===8){mocha.position=walk([2.6,0,7.3],HOME.door,u);mocha.walking=true;cam=cameraPreset([5.6,2.0,10.2],[2.2,1.0,4.2],55);room='street';}
 if(n>=9&&n<=17){
  mocha.position=n<=10?[1.0,0,1.4]:n<=14?[-.8,0,2.8]:n<=16?[-1.0,0,2.25]:[-1.45,0,2.55];
  mocha.emotion='sad';heroBox='latte';
  if(n===9)cam=cameraPreset([3.6,2.2,3.8],[-1.25,.8,1.1],65);
  else if(n===10||n===15)cam=focus(HOME.latte,2.55,n===10?42:58,1.5);
  else if(n===11||n===14||n===17)cam=focus(mocha.position,2.2,35,1.05);
  else if(n===12)cam=focus(HOME.latte,1.3,38,.4);
   else if(n===13)cam=cameraPreset(
    [HOME.latte[0],.76,HOME.latte[2]+.10],
    [mocha.position[0],.92,mocha.position[2]],58);
  else cam=cameraPreset([1.7,2.0,4.0],[-1.8,.7,2.0],58);
  flap.latte=n===12?.84:n===13?.95:.84;
  if(n===12){
   // Lean the original Episode01 cat's muzzle to the actual front rim.
   // Episode.tsx sequences two physical flap pivots, never human hands.
   const contact=ease((u-.10)/.56);
   mocha.position=[lerp(-.80,-1.03,contact),0,lerp(2.80,2.68,contact)];
   mocha.headTurn=-.10-.16*contact;mocha.gazeY=-.16*contact;
   mocha.walking=u>.12&&u<.62;
  }
  if(n===16)mocha.position=walk([-1.4,0,2.6],[-1.8,0,2.3],u);
 }
 if(n>=18&&n<=23){
  mocha.position=n===20?mix([1.35,0,1.35],HOME.essie,ease(u)):[1.1,0,1.2];
  essie.position=n===20?walk(HOME.essie,[.9,0,1.0],u):n===22?[.9,0,1.0]:[HOME.essie[0],0,HOME.essie[2]];
  essie.emotion=n>=20?'sad':'happy';mocha.emotion=n===23?'sad':'scared';
  heroBox='essie';cam=n===19?focus(HOME.essie,2,42,.9):n===21?focus(essie.position,1.8,37,1.2):
     n===23?focus(mocha.position,1.8,39,1.2):cameraPreset([3.1,2.0,3.6],[.3,.8,.8],55);
 }
 if(n>=24&&n<=27){
  // Closing is a separate doorway beat, not a duplicate of the next
  // empty sleeping spot. Keep the existing Episode01 cat and café geometry.
  mocha.position=n===27?walk(HOME.door,HOME.entrance,u):
    n===26?[-1.05,0,1.35]:n===24?[2.00,0,3.50]:[.8,0,1.5];
  mocha.emotion='scared';essie.visible=false;show.essie=false;
  cam=n===24?cameraPreset([4.6,1.8,6.2],[2.3,1.35,4.55],57):n===26?focus(HOME.essie,2.1,41,.85):
    n===27?cameraPreset([5,2.3,9.2],[2.4,.8,5.2],56):focus(mocha.position,2.6,45,1);
  if(n===27){room='street';mocha.walking=true;}
 }
 if(n>=28&&n<=34){room='street';mocha.walking=n<=33;mocha.emotion='scared';essie.visible=n>=31;
  mocha.position=n===28?walk(HOME.entrance,HOME.busStop,u):n===29?walk(HOME.busStop,HOME.market,u):
     n===30?walk(HOME.market,HOME.alleyMouth,u):n<=32?[-9.25,0,4.2]:n===33?[-9.25,0,4.5]:[-9.25,0,4.0];
  essie.position=n===32?walk([-9.1,0,2.7],HOME.alleyBox,u):HOME.alleyBox;
  if(n===31)essie.position=[-9.25,0,2.8];if(n===34)essie.position=HOME.alleyBox;
  essie.emotion='happy';essie.walking=n===32;
  if(n>=31){show.essie=true;essieBox=n===32?walk([-9.1,0,2.7],HOME.alleyBox,u):HOME.alleyBox;}
  if(n===32){
   essie.position=[essieBox[0],0,essieBox[2]+.95];
   // Essie's mouth-and-box action is the subject of this moving close view.
   // Mocha remains nearby in story space but offscreen until the next shot.
   mocha.visible=false;
  }
  cam=n===28?focus(HOME.busStop,3.0,61,2.4):
     n===29?cameraPreset(
      [mocha.position[0]-1.6,1.75,mocha.position[2]+2.6],
      [mocha.position[0],.75,mocha.position[2]],54):
    n===30?cameraPreset([-7.2,1.4,8.5],[-9.3,.7,3.0],58):
    n===31?cameraPreset([-7.2,5.5,8.1],[-9.15,.5,2.0],48):
    n===32?cameraPreset([-7.25,1.4,3.5],[-9.15,.62,2.0],44):
    n===33?focus(mocha.position,2,40,1.1):
    cameraPreset([-6.5,1.55,8.0],[-9.15,.7,1.8],39);
 }
 if(n>=35&&n<=52){room='alley';essieBox=HOME.alleyBox;
  // The blue shop facade begins at X=-8.35; preserve the original cat's
  // 0.67m half-width by keeping Mocha in the open corridor near X=-9.25.
  mocha.position=n===36?walk(HOME.alleyMouth,[-9.25,0,2.70],u):[-9.25,0,2.70];
  if(n===40)mocha.position=[-9.25,0,2.55];
  mocha.emotion=n>=50?'happy':n>=46?'sad':'scared';
  mocha.walking=n===36;
  essie.position=[HOME.alleyBox[0],0,HOME.alleyBox[2]];
  essie.visible=n<=39||n>=50;essie.emotion=n>=50?'happy':n>=37?'scared':'happy';
  heroBox='essie';flap.essie=n>=50?.87:n>=40?.50:n===39?lerp(.85,.35,ease(u)):.90;
  if(n===37)morph.essie=.18+.33*ease(u);
  if(n===38)morph.essie=.50+.25*ease(u);
  if(n===39)morph.essie=.75+.25*ease(u);
  if(n>=40&&n<=49)morph.essie=1;
  if(n===50)morph.essie=1-.75*ease(u);
  if(n>=51)morph.essie=0;
  essie.morph=morph.essie;
  if(n>=40&&n<=49)essie.visible=false;
  // Shot 45 is explicitly Mocha's POV looking INSIDE the empty carton;
  // never render his upright card directly in front of his own camera.
  if(n===45)mocha.visible=false;
  if(n===49){
   mocha.position=walk([-9.25,0,2.70],HOME.alleyBox,u);
   mocha.position[1]=.70*Math.sin(Math.PI*ease(u)); // Clear the physical box rim.
   mocha.scale=lerp(1,.63,ease(u));mocha.morph=0;flap.essie=.95;
  }
  if(n===50){
   mocha.position=walk(HOME.alleyBox,[-9.25,0,2.70],u);
   mocha.position[1]=.70*Math.sin(Math.PI*ease(u));
   mocha.scale=lerp(.63,1,ease(u));flap.essie=.95;
  }
  if(n>=51)mocha.position=[-9.25,0,2.70];
  cam=(n===35||n===37||n===38)?focus(HOME.alleyBox,2.25,42,1.05):
    (n===39||n===50||n===51)?cameraPreset([-7.0,1.75,3.7],[-9,.65,1.6],44):
    n===41||n===45?cameraPreset([-8.2,2.9,2.1],[-9.15,.3,1.4],42):
    n===42||n===43||n===48?focus(mocha.position,2.0,38,1.2):
    n===44?cameraPreset([-6.2,2.0,5.5],[-8.8,.6,1.8],55):
    n===46?cameraPreset([-8.5,1.7,3.9],[-9.15,.8,1.4],48):
    n===49?cameraPreset([-7.3,1.4,2.8],[-9.15,.45,1.4],50):
    cameraPreset([-6.8,1.8,4.1],[-8.95,.7,1.8],55);
 }
 if(n===46){
  // Quick actual cafe memory cutaways: the earlier cloud movie repeated
  // three near-identical alley views instead of showing either friend.
  const rememberLatte=u>=.23&&u<.43,rememberEssie=u>=.43&&u<.66;
  if(rememberLatte||rememberEssie){
   room='cafe';day=true;mocha.visible=false;
   latte.visible=rememberLatte;essie.visible=rememberEssie;
   if(rememberLatte){
    heroBox='latte';show.latte=true;show.essie=false;
    latte.position=[HOME.latte[0],.13,HOME.latte[2]];latte.scale=.74;
   }else{
    heroBox='essie';show.latte=false;show.essie=true;
    essieBox=[...HOME.essie];essie.position=[HOME.essie[0],.12,HOME.essie[2]];essie.scale=.78;
   }
  }
 }
 if(n>=53&&n<=55){
  // Cut to the cafe approach rather than sprinting 12m through the bus shelter.
  mocha.position=n===53?walk([1.15,0,6.25],HOME.door,u):[HOME.latte[0]+.3,0,HOME.latte[2]+.6];
  essie.position=n===53?walk([.25,0,6.10],[1.65,0,4.85],u):[HOME.latte[0]+1,0,HOME.latte[2]+.3];
  essie.visible=true; // Essie visibly helps with Latte's rescue in shots 53–55.
  mocha.emotion=essie.emotion='happy';mocha.walking=essie.walking=n===53;
  latte.visible=n===55;latte.position=n===55?mix(HOME.latte,[HOME.latte[0],.25,HOME.latte[2]+.7],ease(u)):[...HOME.latte];latte.emotion='surprised';
  flap.latte=.93;heroBox='latte';
  if(n===54){morph.latte=1;mocha.position=walk([HOME.latte[0]+.35,0,HOME.latte[2]+.75],HOME.latte,u);mocha.scale=lerp(1,.65,ease(u));}
  if(n===55){morph.latte=1-ease(u);mocha.position=walk(HOME.latte,[HOME.latte[0]+.75,0,HOME.latte[2]+.7],u);mocha.scale=lerp(.65,1,ease(u));}
  latte.morph=morph.latte;
  cam=n===53?cameraPreset([6,2,9.5],[2.4,.7,4.9],64):cameraPreset([1.4,1.7,4.4],[-1.8,.8,2.1],50);
 }
 if(n>=56){mocha.emotion='happy';essie.emotion='happy';latte.emotion='happy';mocha.visible=essie.visible=latte.visible=true;
  mocha.position=n<=57?[1.1,0,6.4]:[-1.6,0,2.8];
  essie.position=n<=57?[.1,0,6.0]:n===58?[-1.0,0,2.9]:[-1.8,0,2.5];
  latte.position=n<=57?[2.3,0,6.0]:n===58?[-1.7,0,3.0]:[-1.1,0,2.5];
  room=n<=57?'street':'cafe';heroBox=n>=58?'shared':null;
  cam=n===56?cameraPreset([5.7,2.7,11.5],[1.2,.9,6.6],58):
    n===57?cameraPreset([3.8,1.9,9.6],[1.1,.9,6.1],48):
    n===58?cameraPreset([2.6,1.65,4.4],[-1.4,.6,2.7],56):
    cameraPreset([.9,1.45,4.5-(n===60?u*.55:0)],[-1.45,.6,2.5],n===60?49:55);
 }
 // Show the cure as physical action, not a giant instructional billboard:
 // Mocha approaches the real rule carton; the original Episode01 kitten
 // visibly re-emerges while the two rescued friends watch from the sidewalk.
 if(n===56||n===57){
  show.demo=true;
  flap.demo=n===56?.90:.90-.18*ease(u/.28)+.22*ease((u-.48)/.28);
  demoCat.visible=n===57;
  demoCat.position=[HOME.demo[0],.01+.15*ease((u-.35)/.45),HOME.demo[2]];
  demoCat.scale=.88;
  demoCat.emotion='happy';
  demoCat.headTurn=.08*Math.sin(Math.PI*u);
  if(n===57){
   mocha.position=walk([1.1,0,6.4],[1.50,0,5.98],ease(u));
   mocha.walking=true;
   essie.headTurn=.12*Math.sin(Math.PI*u);
   latte.headTurn=-.10*Math.sin(Math.PI*u);
  }
 }
 if(n===52){essie.visible=true;essie.position=[-9.2,0,1.4];}
 if(n===1){
  // The opening kitten peeks above the real box rim instead of holding still.
  demoCat.position=[HOME.demo[0],.04+.06*Math.sin(Math.PI*u),HOME.demo[2]];
  demoCat.headTurn=.14*Math.sin(Math.PI*u);
  flap.demo=.84+.10*Math.sin(Math.PI*u);
 }
 if(n===25)mocha.headTurn=lerp(-.18,.30,ease(u));
 if(n===14)mocha.headTurn=lerp(-.22,.26,ease(u));
 // Essie-only box-lip insert: Mocha's idle card was just disembodied ears
 // above the rear flap in every inspected frame of shot 35.
 if(n===35||n===37||n===38)mocha.visible=false;
 if(n>=31&&n<=48){
  mocha.headTurn=.16*Math.sin(u*Math.PI*1.25);
  mocha.gazeY=-.10+.12*Math.sin(u*Math.PI);
  if(n>=35&&n<=39)essie.headTurn=.10*Math.sin(u*Math.PI);
 }
 // Keep standing cat models near their established Episode 01 scale. A cat
 // curled inside a box uses a separate compact pose and grounded placement,
 // not a magically enlarged box or an oversized upright cat sticking through it.
 if(n===6){latte.position=[HOME.latte[0],.13,HOME.latte[2]];latte.scale=.74;}
 if(n===7){essie.position=[HOME.essie[0],.12,HOME.essie[2]];essie.scale=.78;}
 if(n===19){essie.position=[HOME.essie[0],.12,HOME.essie[2]];essie.scale=.77;}
 if(n===35){essie.position=[HOME.alleyBox[0],.12,HOME.alleyBox[2]];essie.scale=.77;}
 if(n>=37&&n<=39){essie.position=[HOME.alleyBox[0],.12,HOME.alleyBox[2]];essie.scale=.78;}
 if(n===50){essie.position=[HOME.alleyBox[0],.16,HOME.alleyBox[2]];essie.scale=lerp(.60,.82,ease(u));}
 if(n===51){essie.position=[HOME.alleyBox[0],.10,HOME.alleyBox[2]+.28];essie.scale=lerp(.82,1,ease(u));}
 if(n===55){latte.position=[HOME.latte[0],.12,HOME.latte[2]+.18];latte.scale=lerp(.75,1,ease(u));}
 if(n===58){
  // Continuity setup for the following shot: Essie and Latte have already
  // settled inside, while Mocha hesitates on the left and approaches.
  mocha.position=walk([-3.60,0,2.17],[-3.32,0,2.17],u);
  mocha.scale=.76;mocha.walking=true;mocha.emotion='sad';
  essie.position=[-1.45,.12,2.01];essie.scale=.76;
  latte.position=[-.95,.12,2.17];latte.scale=.76;
 }
 if(n>=59){
  // SHOT 59: Essie and Latte wait in the one shared box; Mocha enters LAST.
  // The sidewall has to be cleared before feet land. Never teleport through
  // cardboard, never rebuild the original Episode 01 cat as a primitive.
  essie.position=[-1.45,.12,2.01];essie.scale=.76;
  latte.position=[-.95,.12,2.17];latte.scale=.76;
  const settle=ease(n===59?(u-.72)/.28:1);
  if(n===59){
   // Keep the hesitant expression continuous from the previous shot; the
   // first genuinely happy look arrives only as he clears the box lip.
   mocha.emotion=u<.66?'sad':'happy';
   const hop=clamp((u-.24)/.50);
   // The full-width Episode01 card must stay to the left of the sidewall
   // until its feet rise ABOVE the .59m box lip. The previous linear entry
   // crossed cardboard for ten sampled frames before takeoff.
   const clearance=ease((hop-.25)/.55);
   mocha.position=[
    u<.24?lerp(-3.32,-3.19,ease(u/.24)):lerp(-3.19,-1.95,clearance),
    (hop>0&&hop<1?.76*Math.sin(Math.PI*hop):0)
       +.12*ease((hop-.86)/.14),
    2.17
   ];
   mocha.scale=.76; // Preserve the Episode01 silhouette size throughout the jump.
   mocha.walking=u<.22;
    mocha.headTurn=.10*Math.sin(Math.PI*hop);
  }else{
   const warm=ease(u);
   mocha.position=[lerp(-1.95,-1.85,warm),.12,2.17];
   latte.position=[lerp(-.95,-1.04,warm),.12,2.17];
   mocha.scale=.76;
  }
  mocha.headTurn=.08+.16*settle;
  essie.headTurn=.025*Math.sin(t*1.1);
  latte.headTurn=-.08-.16*settle;
  mocha.gazeY=essie.gazeY=latte.gazeY=-.06;
 }
 // Directed story-specific performance. Source-only geometry correctness
 // previously produced long inert poses; each beat must actually communicate
 // the narration through the approved Episode 01 expression rig.
 if(n===5){
  // Reluctant approach, disgusted glance at carton, distinct sidestep away.
  const recoil=ease((u-.35)/.24);
  mocha.position=[lerp(2.40,1.20,ease(u))-.22*Math.sin(Math.PI*recoil),
   0,lerp(6.65,6.00,ease(u))+.22*Math.sin(Math.PI*recoil)];
  mocha.walking=true;
  mocha.headTurn=-.24*ease((u-.12)/.25)+.37*recoil;
  mocha.gazeY=-.18*ease((u-.16)/.24);
  mocha.emotion=u>.20&&u<.75?'scared':'sad';
 }
 if(n===7){
  // Essie invites him with a hopeful glance; Mocha consciously refuses.
  essie.headTurn=lerp(-.16,.24,ease((u-.10)/.46));
  essie.gazeY=lerp(-.12,.10,ease((u-.20)/.50));
  mocha.position=walk([1.45,0,.90],[1.70,0,1.24],u);
  mocha.headTurn=lerp(-.24,.26,ease((u-.38)/.50));
  mocha.walking=u>.25&&u<.86;
 }
 if(n===9){
  // Distinct left-right search, instead of one static startled sprite.
  mocha.headTurn=lerp(-.38,.38,ease((u-.17)/.65));
  mocha.gazeY=.12-.22*ease((u-.35)/.43);
  mocha.emotion='concerned';
 }
 if(n===11){
  mocha.headTurn=-.12+.17*Math.sin(Math.PI*u);
  mocha.gazeY=-.15*ease((u-.20)/.44);
  mocha.emotion='concerned';
 }
 if(n===14){
  // Recognition: look into the box and then at its striped exterior.
  mocha.headTurn=lerp(-.30,.28,ease((u-.28)/.53));
  mocha.gazeY=lerp(-.30,.06,ease((u-.42)/.36));
  mocha.emotion='surprised';
 }
 if(n===17){
  // Pleading gives way to a lowered, defeated gaze.
  mocha.headTurn=.17*Math.sin(Math.PI*u);
  mocha.gazeY=-.36*ease((u-.53)/.34);
  mocha.emotion='sad';
 }
 if(n===21){
  // Essie reacts to being removed, then glances back toward her box.
  essie.headTurn=lerp(-.30,.31,ease((u-.25)/.50));
  essie.gazeY=lerp(.06,-.18,ease((u-.28)/.45));
  essie.emotion='concerned';
 }
 if(n===23){
  mocha.headTurn=lerp(-.28,.10,ease((u-.42)/.46));
  mocha.gazeY=-.24*ease((u-.48)/.40);
  mocha.emotion='sad';
 }
 if(n===24){
  // Follow the actual closing sign rather than stare at an empty corner.
  mocha.headTurn=lerp(.18,-.20,ease((u-.38)/.40));
  mocha.gazeY=.13*ease((u-.25)/.35);
  mocha.emotion='neutral';
 }
 if(n===25){
  mocha.headTurn=lerp(-.35,.35,ease((u-.10)/.64));
  mocha.gazeY=-.20*ease((u-.38)/.35);
  mocha.emotion='scared';
 }
 if(n===35){
  // A slow, comfortable settle before the horror starts.
  essie.headTurn=-.10*ease((u-.20)/.48);
  essie.gazeY=-.23*ease((u-.32)/.52);
 }
 if(n===37||n===38||n===39){
  // A progressive loss of control; preserve exact Episode 01 head and coat.
  const fold=clamp(morph.essie);
  essie.headTurn=.13*Math.sin(u*Math.PI*1.2)*(1-fold);
  essie.gazeY=-.20*fold;
  essie.emotion=fold>.52?'scared':'concerned';
 }
 if(n===43){
  mocha.headTurn=-.12*ease((u-.18)/.55);
  mocha.gazeY=-.37*ease((u-.33)/.50);
  mocha.emotion='sad';
 }
 if(n===56){
  // Readable group responses when the cure appears in a populated street.
  mocha.headTurn=-.16+.26*ease((u-.20)/.50);
  essie.headTurn=.18-.26*ease((u-.35)/.48);
  latte.headTurn=.21*Math.sin(u*Math.PI);
 }

 const openShared=n>=58;
 const inTown=n>=56&&n<=57;
 if(inTown){latte.position=[2.5,0,6.3];}
 const out:State={
 frame,shot:sh,u,t,daylight:day,camera:cam.camera,target:cam.target,fov:cam.fov,blur:cam.blur,
 mocha,essie,latte,demoCat,
 latteBox,essieBox,sharedBox,demoBox,
 show:{...show,shared:openShared},flap,morph,
 rescued:{essie:n>=51,latte:n>=55},heroBox,room
 };
 return out;
}
