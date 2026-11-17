import scratch from './EDITORIAL_SCRATCH_PLAN.json';
import type {V3} from '../../cafe/config';
export const FPS=30;
export const FIRST_DRAFT_FRAMES=3876;
export type BoxStage='normal'|'resting'|'morphing'|'boxed'|'rescuing'|'restored';
export type ActorPose={position:V3;visible:boolean;walking:boolean;emotion:'neutral'|'happy'|'sad'|'scared'|'surprised';headTurn:number;scale:number;morph:number;gazeY:number};
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
  shared:[-1.45,0,2.5] as V3,
  cafeMocha:[-.35,0,1.4] as V3,
  door:[2.25,0,4.45] as V3,
  entrance:[2.4,0,6.65] as V3,
  busStop:[-4.4,0,6.1] as V3,
  market:[-7.3,0,6.5] as V3,
  alleyMouth:[-8.9,0,4.7] as V3,
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
 const day=n<=23||n>=56;
 let mocha=actor(HOME.cafeMocha,n>=5,'neutral'),essie=actor(closer(HOME.essie),n===7||(n>=18&&n<=23),'happy'),latte=actor(closer(HOME.latte),n===6,'happy');
 let demoCat=actor(closer(HOME.demo,.2,0),n<=3,'happy');
 const latteBox=[...HOME.latte] as V3,sharedBox=[...HOME.shared] as V3,demoBox=[...HOME.demo] as V3;
 let essieBox=[...HOME.essie] as V3;
 const show={latte:n>=6&&n<=55,essie:n===7||(n>=18&&n<=23)||(n>=32&&n<=52),shared:n>=58,demo:n<=4};
 const flap={latte:.85,essie:.85,shared:.85,demo:.85};
 const morph={essie:0,latte:0,demo:0};
 let heroBox:State['heroBox']=null,room='cafe';
 let cam=cameraPreset([3.1,1.8,9.7],[2.1,.8,6.7],59);
 const focus=(p:V3,dist=2.8,fov=51,side=1.4)=>cameraPreset([p[0]+side,Math.max(1.3,p[1]+1.8),p[2]+dist],[p[0],p[1]+.75,p[2]],fov);
 if(n<=4){
  room='street';heroBox='demo';demoCat=actor(closer(HOME.demo,.06,0),n<3,'surprised',false);
  cam=n===1?cameraPreset([4.2,1.0,9.2],[3.45,.6,7.6] as V3,38):
      n===2?cameraPreset([3.4,5.0,7.6],[3.45,.10,7.6],48):
      n===3?focus(HOME.demo,2.1,40,.45):cameraPreset([6,1.65,9.2],[3.45,.5,7.6],62);
  if(n===3){demoCat.visible=true;demoCat.morph=ease(u);demoCat.position=[HOME.demo[0],0,HOME.demo[2]];morph.demo=ease(u);flap.demo=lerp(.8,.25,ease(u));}
  if(n===4){demoCat.visible=false;flap.demo=.33;}
 }
 if(n===5){mocha.position=walk(HOME.entrance,[1.15,0,6],u);mocha.walking=true;mocha.emotion='sad';cam=cameraPreset([5.15,1.7,9.0],[2,.7,5.1],55);}
 if(n===6){latte.position=[HOME.latte[0],.02,HOME.latte[2]];latte.emotion='happy';mocha.visible=false;heroBox='latte';cam=focus(HOME.latte,2.6,46,-.25);flap.latte=.9;}
 if(n===7){essie.position=[HOME.essie[0],.02,HOME.essie[2]];mocha.position=[1.45,0,.9];mocha.emotion='sad';essie.emotion='happy';heroBox='essie';cam=focus(HOME.essie,2.7,58,1.5);}
 if(n===8){mocha.position=walk([2.6,0,7.3],HOME.door,u);mocha.walking=true;cam=cameraPreset([5.6,2.0,10.2],[2.2,1.0,4.2],55);room='street';}
 if(n>=9&&n<=17){
  mocha.position=n<=10?[1.0,0,1.4]:n<=14?[-.8,0,2.8]:n<=16?[-1.0,0,2.25]:[-1.45,0,2.55];
  mocha.emotion='sad';heroBox='latte';
  if(n===9)cam=cameraPreset([3.6,2.2,3.8],[-1.25,.8,1.1],65);
  else if(n===10||n===15)cam=focus(HOME.latte,2.55,n===10?42:58,1.5);
  else if(n===11||n===14||n===17)cam=focus(mocha.position,2.2,35,1.05);
  else if(n===12||n===13)cam=focus(HOME.latte,1.3,38,.4);
  else cam=cameraPreset([1.7,2.0,4.0],[-1.8,.7,2.0],58);
  flap.latte=n===12?lerp(.15,.95,ease(u)):n===13?.95:.84;
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
  mocha.position=n===27?walk(HOME.door,HOME.entrance,u):[.8,0,1.5];
  mocha.emotion='scared';essie.visible=false;show.essie=false;
  cam=n===24?cameraPreset([2.2,2.0,3.8],[-1,1,.8],65):n===26?focus(HOME.essie,2.1,41,.85):
    n===27?cameraPreset([5,2.3,9.2],[2.4,.8,5.2],56):focus(mocha.position,2.6,45,1);
  if(n===27){room='street';mocha.walking=true;}
 }
 if(n>=28&&n<=34){room='street';mocha.walking=n<=33;mocha.emotion='scared';essie.visible=n>=31;
  mocha.position=n===28?walk(HOME.entrance,HOME.busStop,u):n===29?walk(HOME.busStop,HOME.market,u):
     n===30?walk(HOME.market,HOME.alleyMouth,u):n<=32?[-8.2,0,4.2]:n===33?[-8.55,0,4.5]:[-8.7,0,4.0];
  essie.position=n===32?walk([-9.1,0,2.7],HOME.alleyBox,u):HOME.alleyBox;
  if(n===31)essie.position=[-9.1,0,2.8];if(n===34)essie.position=HOME.alleyBox;
  essie.emotion='happy';essie.walking=n===32;
  if(n>=31){show.essie=true;essieBox=n===32?walk([-9.1,0,2.7],HOME.alleyBox,u):HOME.alleyBox;}
  if(n===32)essie.position=[essieBox[0]+.9,0,essieBox[2]+.16];
  cam=n===28?focus(HOME.busStop,3.0,61,2.4):n===29?focus(HOME.market,3.0,62,2.5):
    n===30?cameraPreset([-7.2,1.4,8.5],[-9.3,.7,3.0],58):
    n===31?cameraPreset([-7.2,5.5,8.1],[-9.15,.5,2.0],48):
    n===32?cameraPreset([-7.25,1.4,3.5],[-9.15,.62,2.0],44):
    n===33?focus(mocha.position,2,40,1.1):
    cameraPreset([-6.5,1.55,8.0],[-9.15,.7,1.8],39);
 }
 if(n>=35&&n<=52){room='alley';essieBox=HOME.alleyBox;
  mocha.position=n===36?walk(HOME.alleyMouth,[-8.35,0,2.65],u):n<=39?[-8.4,0,2.3]:[-8.4,0,1.8];
  if(n===40)mocha.position=[-8.3,0,2.15];
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
  if(n===49){mocha.position=walk([-8.4,0,1.8],HOME.alleyBox,u);mocha.scale=lerp(1,.63,ease(u));mocha.morph=0;flap.essie=.95;}
  if(n===50){mocha.position=walk(HOME.alleyBox,[-8.4,0,1.8],u);mocha.scale=lerp(.63,1,ease(u));flap.essie=.95;}
  if(n>=51)mocha.position=[-8.40,0,1.8];
  cam=(n===35||n===37||n===38)?focus(HOME.alleyBox,2.25,42,1.05):
    (n===39||n===50||n===51)?cameraPreset([-7.0,1.75,3.7],[-9,.65,1.6],44):
    n===41||n===45?cameraPreset([-8.2,2.9,2.1],[-9.15,.3,1.4],42):
    n===42||n===43||n===48?focus(mocha.position,2.0,38,1.2):
    n===44?cameraPreset([-6.2,2.0,5.5],[-8.8,.6,1.8],55):
    n===46?cameraPreset([-8.5,1.7,3.9],[-9.15,.8,1.4],48):
    n===49?cameraPreset([-7.3,1.4,2.8],[-9.15,.45,1.4],50):
    cameraPreset([-6.8,1.8,4.1],[-8.95,.7,1.8],55);
 }
 if(n>=53&&n<=55){
  mocha.position=n===53?walk(HOME.alleyMouth,HOME.door,u):[HOME.latte[0]+.3,0,HOME.latte[2]+.6];
  essie.position=n===53?walk(HOME.alleyMouth,HOME.door,u):[HOME.latte[0]+1,0,HOME.latte[2]+.3];
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
 if(n===52){essie.visible=true;essie.position=[-9.2,0,1.4];}
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
 if(n>=59){
  // Shared cardboard sits on the café floor: actual curled cats stay
  // grounded IN it, not hovering 60 cm above the base.
  mocha.position=[-2.18,.11,2.5];mocha.scale=.56;
  essie.position=[-1.45,.11,2.5];essie.scale=.56;
  latte.position=[-.72,.11,2.5];latte.scale=.56;
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
