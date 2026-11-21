/** Latest user-directed performances. Same locked artwork, real props and narration clock. */
import type {State,ActorPose,EditShot} from './timeline';
import type {V3} from '../../cafe/config';
import {BOX_SPECS} from './boxProps';
import {rescueTipAngle,tippedEssieInterior} from './timeline';
export const STORY_ALLEY:V3=[-18,0,-6];
export const FRIEND_NAPS:V3[]=[[.55,.055,5.2],[1.5,.055,6.65],[2.45,.055,5.2]];
export const CAFE_BED:V3=[3.25,.19,.75];
export type StoryCamera={camera:V3;target:V3;fov:number};
export type StoryNotes={camera?:StoryCamera;friendNap?:boolean;alley:boolean;townSquare:boolean;cafeDoor?:number;houseDoor?:number;light?:number;food?:V3;shake?:number;boxShake?:number;ears?:number;lean?:number;displayBeat?:number};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const e=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
const mix=(a:V3,b:V3,t:number):V3=>a.map((v,i)=>v+(b[i]-v)*t) as V3;
const cam=(camera:V3,target:V3,fov=65):StoryCamera=>({camera,target,fov});
const face=(p:V3,d=2.5,fov=56)=>cam([p[0],p[1]+1.2,p[2]+d],[p[0],p[1]+.78,p[2]],fov);
const boxEye=(p:V3,cat:ActorPose,kind:'latte'|'essie'|'lesson'='essie')=>{
 const b=BOX_SPECS[kind];
 return cam([p[0]+b.width*.36,p[1]+b.height+.17,p[2]-b.depth*.30],[cat.position[0],cat.position[1]+.90,cat.position[2]],90);
};
const lookBox=(p:V3)=>cam([p[0]+.18,1.18,p[2]+1.34],[p[0],.22,p[2]],74);
const leap=(a:V3,b:V3,u:number,start=.10,dur=.76):V3=>{
 const p=clamp((u-start)/dur),cross=e((p-.25)/.45);
 return [a[0]+(b[0]-a[0])*cross,a[1]+(b[1]-a[1])*p+3.2*p*(1-p),a[2]+(b[2]-a[2])*cross];
};
export function directStory(s:State,frame:number,shots:EditShot[],sample:(frame:number,shots:EditShot[])=>State,captions:{start:number;end:number;text:string}[]=[]):State{
 const n=s.shot.sequence,u=s.u,L=s.latteBox,E=s.essieBox;
 const story:StoryNotes={alley:n>=31&&n<=52,townSquare:n===56};
 const mark=(word:string,fallback:number)=>{
  const group=shots.filter(x=>x.sequence===n),start=group[0].start,end=group.at(-1)!.end;
  const found=captions.find(c=>c.start>=start&&c.start<end&&c.text.toLowerCase().replace(/[^a-z]/g,'')===word);
  return found?sample(found.start,shots).u:fallback;
 };
 const setCam=(c:StoryCamera)=>{story.camera=c;};
 const hide=()=>{s.mocha.visible=s.essie.visible=s.latte.visible=s.demoCat.visible=false;};
 const replay=(beat:number,p:number)=>{
  const parts=shots.filter(x=>x.sequence===beat),a=parts[0],b=parts.at(-1)!;
  const f=a.start+Math.round(clamp(p)*(b.end-a.start-1));return directStory(sample(f,shots),f,shots,sample,captions);
 };
 const adopt=(r:State)=>{
  for(const key of ['mocha','essie','latte','demoCat','latteBox','essieBox','sharedBox','demoBox','show','flap','morph','heroBox','room','daylight'] as const)(s as any)[key]=r[key];
 };
 // Constant model scale is an identity invariant, including resting and replay.
 for(const id of ['mocha','essie','latte','demoCat'] as const)s[id].scale=1;
 if(n===4){s.mocha.position[2]=7.05-.30*e(u);const x=s.mocha.position[0]+.55;setCam(cam([x,1.8,9.2],[x,.75,5.75],78));}
 if(n===5){
  const p=e((u-.05)/.30),leave=e((u-.54)/.43);
  s.mocha.position=mix([.10,0,6.75],[1.12,0,5.97],p);
  s.mocha.position=mix(s.mocha.position,[2.8,0,6.35],leave);
  s.mocha.walking=u<.34||u>.54;s.mocha.headTurn=-.35*Math.sin(Math.PI*p);s.mocha.gazeY=-.3*(1-leave);
  const x=s.mocha.position[0]+.55;setCam(cam([x,1.8,9.2],[x,.75,5.75],78));
 }
 if(n===6){
  s.latte.position=leap([L[0]+1.9,0,L[2]+.04],[L[0],.055,L[2]+.04],u);s.latte.walking=false;
  setCam(cam([-.95,1.5,-.5],[-1.1,.75,2.1],96));
 }
 if(n===7){
  const shift=e((u-.08)/.24),look=e((u-mark('mocha',.36))/.18),away=e((u-mark('never',.60))/Math.max(.12,1-mark('never',.60)));
  s.essie.position=[E[0]-.12-.20*shift,.055,E[2]-.12];s.essie.headTurn=.30*look;
  s.mocha.visible=true;s.mocha.position=mix([1.45,0,1.30],[3.55,0,1.30],away);
  s.mocha.headTurn=-.40*look*(1-away);s.mocha.walking=u>.60;
  setCam(cam([1.10,1.65,3.85],[.70,.72,.65],98));
 }
 if(n===8){
  const reach=e(u/.22),enter=e((u-.46)/.48);
  s.mocha.position=mix([2.4,0,6.1],[2.4,0,5.05],reach);
  s.mocha.position=mix(s.mocha.position,[2.15,0,3.45],enter);
  s.mocha.walking=u<.20||u>.46;story.cafeDoor=-Math.PI/2*e((u-.22)/.22);
  s.mocha.headTurn=-.30;setCam(cam([4.65,1.65,7.3],[2.3,.72,4.5],70));
 }
 if(n===9){hide();s.show.latte=true;setCam(cam([.4,1.10,1.4],mix([1.7,.72,2.0],[-2,.65,2.25],e(u)),88));}
 if(n===10||n===11||n===12||n===13||n===14){
  hide();s.show.latte=true;setCam(lookBox(L));
  if(n===12)story.boxShake=.008*Math.sin(u*Math.PI*2);
 }
 if(n===15){hide();s.show.latte=true;setCam(cam([L[0]+.40-.15*e(u),1.35,L[2]+2.0],[L[0],.25,L[2]],64));}
 if(n===16){
  s.mocha.visible=true;s.mocha.position=[L[0],0,L[2]+1.08];s.mocha.walking=false;
  const carry=e(u/.36),drop=e((u-.36)/.17),shake=e((u-.61)/.10)*(1-e((u-.88)/.10));
  story.food=mix([L[0]+.75,.09,L[2]+1.10],[L[0],.68,L[2]+.68],carry);
  story.food=mix(story.food,[L[0],.09,L[2]],drop);s.mocha.lean=-.42*e((u-.20)/.16)*(1-e((u-.55)/.14));
  const offset=.025*Math.sin(u*48)*shake;s.latteBox=[L[0]+offset,0,L[2]+.012*Math.sin(u*41)*shake];
  story.shake=.006*shake;setCam(cam([L[0]+1.4,1.8,L[2]+1.75],[L[0],.75,L[2]+.50],88));
 }
 if(n===17){
  s.mocha.position=[L[0],0,L[2]+1.08];s.mocha.visible=true;s.mocha.walking=false;
  s.mocha.emotion=u<.55?'concerned':'sad';s.mocha.headTurn=.12*Math.sin(u*3);s.mocha.gazeY=-.25;
  setCam(boxEye(L,s.mocha,'latte'));
 }
 if(n===19){s.essie.position=leap([E[0]+2.25,0,E[2]+.30],[E[0],.055,E[2]+.25],u);s.essie.walking=false;setCam(cam([E[0]+.2,1.65,E[2]+3.3],[E[0]+.65,.85,E[2]+.25],86));}
 if(n===20){
  const contact=e(u/.20),pull=e((u-.20)/.70);
  s.essie.position=leap([E[0],.055,E[2]+.25],[.6,0,1.65],u,.20,.70);
  s.mocha.position=mix([.95,0,.90],[1.65,0,1.10],pull);s.mocha.walking=false;s.essie.walking=false;s.mocha.headTurn=-.30;s.mocha.lean=-.2*contact*(1-pull);
  setCam(cam([.5,1.65,3.65],[.65,.85,.80],76));
 }
 if(n===21){s.mocha.visible=false;s.essie.position=[1.45,0,1.5];s.essie.emotion='concerned';s.essie.headTurn=.2*Math.sin(u*5);setCam(cam([-.6,1.15,1.5],[1.45,.80,1.5],45));}
 if(n===22||n===23){const p=((n-22)+u)/2;s.mocha.visible=false;s.show.essie=false;s.essie.position=[...CAFE_BED];s.essie.walking=false;s.essie.emotion='happy';s.essie.sleeping=true;setCam(cam([1.0+.12*p,1.25,.9],[3.25,.72,.75],57));}
 if(n===24){
  // Clear west/front aisles; the camera pans from one stationary safe point.
  s.mocha.position=u<.30?[-3.75,0,1.25]:u<.49?mix([-3.75,0,1.25],[-3.75,0,3.90],e((u-.30)/.19)):u<.76?mix([-3.75,0,3.90],[2.25,0,3.90],e((u-.49)/.27)):[2.25,0,3.90];s.mocha.walking=u>.30&&u<.76;
  story.light=1-e((u-.20)/.12);story.cafeDoor=-Math.PI/2*(1-e((u-.77)/.22));
  const origin:V3=[3.6,1.85,3.9],target:V3=[s.mocha.position[0],.80,s.mocha.position[2]],distance=Math.hypot(...target.map((v,i)=>v-origin[i]));
  setCam(cam(origin,target,Math.max(18,Math.min(86,2*Math.atan(1.3/distance)*180/Math.PI))));
 }
 if(n===25||n===26){
  hide();s.room='house';s.show.essie=false;s.show.latte=false;
  setCam(n===25?cam([2.65,1.05,14.7],mix([.3,.7,13.0],[1.38,.25,13.7],e(u)),80):cam([1.5,1.15,15.1-.12*e(u)],[.25,.03,13.5],53));
 }
 if(n===28){s.mocha.position=mix([3.45,0,10.8],[-4.4,0,7.05],e(u));s.mocha.walking=true;setCam(cam([s.mocha.position[0]+1.2,1.65,s.mocha.position[2]+3.4],[s.mocha.position[0],.78,s.mocha.position[2]],72));}
 if(n===29){s.mocha.position=mix([-4.4,0,7.05],[-7.25,0,6.0],e(u));setCam(cam([s.mocha.position[0]-1.6,1.75,s.mocha.position[2]+2.6],[s.mocha.position[0],.75,s.mocha.position[2]],64));}
 if(n===30){
  const index=s.searchAlleyIndex??0,base:V3=index===0?[-18,0,0]:index===1?[18,0,0]:[-18,0,-26];
  hide();s.room='alley';s.show.essie=s.show.demo=false;
  setCam(cam([base[0],1.1,base[2]+6.5],[base[0],.65,base[2]-5],70));
 }
 // Long alley remains one persistent physical location, safely away from shop walls.
 if(n>=31&&n<=52){
  s.room='alley';s.essieBox=[...STORY_ALLEY];s.show.essie=true;s.show.latte=s.show.demo=false;
  s.mocha.position=[-18,0,-3.95];s.mocha.walking=false;s.mocha.scale=s.essie.scale=1;
  s.essie.position=[-18,.055,-6];
  setCam(cam([-18,1.55,-1.0],[-18,.73,-5.3],62));
  if(n===31||n===34){s.mocha.position=[-18,0,8.6];s.essie.visible=true;setCam(cam([-16.5,1.5,10.2],[-18,.65,-3.7],58));}
  if(n===32){const drag=e(u);s.essieBox=mix([-18,0,-1.8],STORY_ALLEY,drag);s.essie.position=[-18,0,s.essieBox[2]+1.30];s.essie.walking=true;s.mocha.visible=false;setCam(cam([-16.5,1.6,s.essieBox[2]+3.5],[-18,.68,s.essieBox[2]+.6],70));}
  if(n===33){s.mocha.position=[-18,.14*Math.sin(Math.PI*e((u-.1)/.6)),8.6-1.8*e((u-.40)/.58)];s.mocha.emotion='scared';s.mocha.walking=u>.4;story.shake=.009*Math.sin(Math.PI*u);setCam(face(s.mocha.position,2.35,58));}
  if(n===35){s.mocha.visible=false;s.essie.visible=true;s.essie.position=leap([-18,0,-4.65],[-18,.055,-6],u);s.essie.walking=false;setCam(cam([-16.4,1.7,-2.5],[-18,.65,-5.65],72));}
  if(n===36){s.mocha.position=mix([-18,0,6.8],[-18,0,-3.95],e(u));s.mocha.walking=true;setCam(cam([-16.2,1.65,s.mocha.position[2]+3.2],[-18,.75,s.mocha.position[2]-1.2],75));}
  if(n>=37&&n<=39){const p=((n-37)+u)/3;s.essie.visible=true;s.essie.morph=e((p-.08)/.86);s.morph.essie=s.essie.morph;s.mocha.visible=false;setCam(cam([-17.1,1.5,-3.2-.12*p],[-18,.68,-6],61));}
  if(n===40){
   const first=mark('first',.35),now=mark('now',.62);const p=u<first?0:u<now?(u-first)/Math.max(.05,now-first):(u-now)/Math.max(.05,1-now);
   if(u<first){s.mocha.emotion='scared';s.essie.visible=false;setCam(face(s.mocha.position,2.2,48));}
   else if(u<now){adopt(replay(6,p));story.displayBeat=6;setCam(cam([-.95,1.5,-.5],[-1.1,.75,2.1],96));}
   else{const r=replay(39,p);s.essie={...r.essie,position:[-18,.055,-6]};s.essie.visible=true;s.essie.morph=e(p);s.morph.essie=e(p);s.mocha.visible=false;story.displayBeat=39;setCam(cam([-17.1,1.5,-3.2],[-18,.68,-6],61));}
  }
  if(n===41){s.essie.visible=false;s.mocha.position=[-18,0,-4.60];s.mocha.lean=-.20*Math.sin(u*Math.PI*2)**2;setCam(cam([-16.55,1.30,-4.35],[-18,.84,-4.65],66));}
  if(n===42){s.essie.visible=false;s.mocha.position=[-18,0,-4.70];s.mocha.emotion='sad';setCam(face(s.mocha.position,1.95,45));}
  if(n===43||n===44){hide();s.show.essie=true;setCam(cam([-17.65,1.2,-3.5-.15*e(u)],[-18,.33,-6],58));}
  if(n===45){s.essie.visible=false;s.mocha.visible=u<.48;s.mocha.position=[-18,0,-4.70];setCam(u<.48?boxEye(s.essieBox,s.mocha):lookBox(s.essieBox));if(u>=.48)s.mocha.visible=false;}
  if(n===46){hide();s.room='street';s.show={latte:false,essie:false,shared:false,demo:false};story.friendNap=true;setCam(cam([1.5,2.65,8.8-.10*e(u)],[1.5,.65,5.9],76));}
  if(n===47){
   if(u<.55){hide();s.show.essie=true;setCam(lookBox(s.essieBox));}
   else{adopt(replay(7,.12+.22*(u-.55)/.45));story.displayBeat=7;setCam(cam([1.10,1.65,3.85],[.70,.72,.65],98));}
  }
  if(n===48){s.essie.visible=false;s.mocha.emotion='concerned';s.mocha.position=[-18,0,-4.70];setCam(boxEye(s.essieBox,s.mocha));}
  if(n===49){s.essie.visible=false;s.mocha.position=leap([-18,0,-4.70],[-18.38,.055,-6],u);s.mocha.walking=false;setCam(boxEye(s.essieBox,s.mocha));}
  if(n===50){
   const two=mark('two',.43),reveal=e((u-two)/Math.max(.1,1-two));
   s.mocha.position=[-18.38,.055,-6];s.essie.position=[-17.65,.055,-6.13];s.mocha.walking=false;s.mocha.emotion='surprised';s.essie.visible=u>=two;s.essie.morph=0;s.morph.essie=1-reveal;story.ears=reveal;story.boxShake=.018*Math.sin(u*45)*(1-e((u-.25)/.15));
   if(u<two){s.essie.visible=false;s.mocha.visible=u>=.18;setCam(u<.18?cam([-17.6,1.35,-3.8],[-18,.35,-6],62):face(s.mocha.position,2.2,54));}
   else{if(reveal<.55)s.mocha.visible=false;setCam(cam(mix([-17.65,1.22,-4.25],[-18,1.6,-1.2],reveal),mix([-17.65,1.12,-6.13],[-18,.85,-5.2],reveal),54+10*reveal));}
  }
  if(n===51||n===52){
   // Feet travel with the actual tipping floor, then fall beyond its front edge.
   const t=n===52?1:u,tip=rescueTipAngle(n,t),slide=e((t-.28)/.34),fall=e((t-.62)/.34);
   for(const id of ['mocha','essie'] as const){const x=id==='mocha'?-.38:.35,localZ=(id==='mocha'?0:-.13)+.46*slide;const carried=tippedEssieInterior(s.essieBox,[x,.055,localZ],tip),landing:V3=[-18+(id==='mocha'?-.38:.28),0,-4.2];s[id].position=mix(carried,landing,fall);s[id].position[1]+=.28*Math.sin(Math.PI*fall);}
   s.mocha.walking=s.essie.walking=false;s.essie.morph=s.morph.essie=0;s.essie.visible=true;
   s.mocha.emotion=s.essie.emotion=n===52?'happy':'surprised';setCam(cam([-18,1.6,-1.2],[-18,.85,-5.2],64));
  }
 }
 if(n===53){
  const lane=e(u/.34),street=e((u-.34)/.43),enter=e((u-.77)/.22);
  s.mocha.position=u<.34?mix([-18.38,0,-4.2],[-18,0,7.5],lane):mix([-18,0,7.5],[2.25,0,7.5],street);
  s.essie.position=[s.mocha.position[0]-.65,0,s.mocha.position[2]+.4];
  if(u>=.77){s.mocha.position=[2.25-.65*e((enter-.60)/.40),0,7.5-4.2*e(enter)];s.essie.position=[2.25+.5*e((enter-.80)/.20),0,7.9-4.35*e((enter-.12)/.88)];}
  s.mocha.walking=s.essie.walking=true;s.show.latte=false;story.cafeDoor=-Math.PI/2;
  // Motivated doorway reverse: see both cats enter through the real aperture.
  setCam(u<.77?cam([s.mocha.position[0]+1.2,1.6,s.mocha.position[2]+3.8],[s.mocha.position[0],.72,s.mocha.position[2]],80):cam([2.25,1.85,1.05],[2.25,.8,4.6],78));
 }
 if(n===54){s.mocha.position=leap([L[0],0,L[2]+1.3],[L[0],.055,L[2]],u);s.essie.position=[L[0]+.92,0,L[2]+.1];s.essie.lean=-.15;s.mocha.walking=false;setCam(cam([-.95,1.5,-.5],[-1.1,.75,2.1],96));}
 if(n===55){
  const pop=e((u-.08)/.43),impact=e((u-.52)/.16),settle=e((u-.68)/.29);
  s.latte.visible=u>.08;s.latte.morph=s.morph.latte=0;s.latte.position=leap([L[0],.055,L[2]],[L[0],0,L[2]+1.65],u,.08,.66);
  s.mocha.position=mix([L[0],.055,L[2]],[L[0]-.95,0,L[2]+1.55],impact);s.essie.position=mix([L[0]+.92,0,L[2]+.10],[L[0]+1.05,0,L[2]+1.55],impact);
  s.mocha.lean=-.50*impact*(1-settle);s.essie.lean=-.50*impact*(1-settle);s.mocha.emotion=s.essie.emotion='surprised';
  story.shake=.018*Math.sin(Math.PI*impact);setCam(cam([-1.0,1.55,-.40+.35*pop],[L[0],.80,L[2]+.50],88));
 }
 if(n===56){
  s.mocha.position=[0,.625,6.0];s.essie.visible=s.latte.visible=false;s.show={latte:false,essie:false,shared:false,demo:false};
  setCam(cam([0,5.2+2.3*e(u),12.0+3*e(u)],[0,.75,8.5],78));
 }
 if(n===57){
  s.essie.visible=s.latte.visible=false;
  s.show={latte:false,essie:false,shared:false,demo:true};s.demoBox=[0,0,6.3];s.demoCat.position=[.45,.055,6.3];s.demoCat.visible=true;s.demoCat.morph=u<.32?e(u/.27):1-e((u-.72)/.25);s.morph.demo=s.demoCat.morph;
  s.mocha.position=leap([-.45,0,8.0],[-.45,.055,6.3],u,.32,.40);s.mocha.visible=u>.3;s.mocha.walking=false;
  setCam(u<.32?cam([1.5,1.55,9.8],[0,.65,6.3],74):u<.72?boxEye(s.demoBox,s.mocha,'lesson'):cam([.9,1.55,9.5],[0,.75,6.3],78));
 }
 if(n===58){
  s.essie.visible=s.latte.visible=false;
  if(u<mark('after',.25)){
   s.room='street';s.show={latte:false,essie:false,shared:false,demo:true};s.demoBox=[0,0,6.3];s.demoCat.visible=true;s.demoCat.position=[.45,.055,6.3];s.demoCat.morph=0;s.morph.demo=0;s.mocha.position=[-.45,.055,6.3];setCam(cam([.9,1.55,9.5],[0,.75,6.3],78));
  }else{
   s.room='cafe';s.show={latte:false,essie:false,shared:false,demo:true};s.demoBox=[.10-.55*e((u-.25)/.5),0,2.2];s.demoCat.visible=false;s.mocha.position=[.12,0,3.1];s.mocha.lean=-.35*Math.sin(Math.PI*e(u));
   setCam(cam([2.2,1.45,3.8],[.1,.65,2.3],72));
  }
 }
 if(n===59){
  const p=e((u-.10)/.80);s.sharedBox=mix([.1,0,1.1],[-1.45,0,2.1],p);s.mocha.position=[s.sharedBox[0],0,s.sharedBox[2]+1.10];s.mocha.walking=u>.1&&u<.9;s.mocha.lean=-.05;
  s.essie.visible=s.latte.visible=false;s.show={latte:false,essie:false,shared:true,demo:false};setCam(cam([-3.6,1.8,3.9],[-1.35,.80,2.35],88));
 }
 if(n===60){
  const positions=[[-2.15,.055,2.1],[-1.45,.055,2.1],[-.75,.055,2.1]] as V3[];
  s.mocha.position=leap([-1.45,0,3.2],positions[0],u,.04,.50);s.essie.position=leap([-1.45,0,3.5],positions[1],u,.18,.50);s.latte.position=leap([-.35,0,3.5],positions[2],u,.32,.50);
  s.mocha.visible=s.essie.visible=s.latte.visible=true;s.mocha.walking=s.essie.walking=s.latte.walking=false;s.mocha.emotion=s.essie.emotion=s.latte.emotion='happy';
  setCam(cam([-3.6+.10*e((u-.84)/.15),1.8,3.9],[-1.35,.80,2.35],88));
 }
 // Authored cameras remain the fallback; permitted tremor is restrained.
 if(story.shake&&story.camera){story.camera.camera[0]+=story.shake*Math.sin(s.t*47);story.camera.camera[1]+=story.shake*Math.sin(s.t*39)*.65;}
 story.alley=s.room==='alley'&&n>=30&&n<=52;
 s.story=story;
 return s;
}
