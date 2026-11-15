import board from './storyboard.json';
import {mouthAnchor} from './contacts';
import {V3} from '../../cafe/config';
import {CatPose} from '../../cats/pose';
export const FPS=30;
export type EpisodeShot={id:string;number:number;variant:number;start:number;end:number;sourceStart:number;sourceEnd:number;direction:string;purpose?:string;flashback?:boolean};
export const DRAFT_SHOTS:EpisodeShot[]=board.flatMap(s=>{
 const n=s.number===58?4:1;return Array.from({length:n},(_,i)=>({id:`${s.number}${n>1?String.fromCharCode(65+i):''}`,number:s.number,variant:i,start:s.start+Math.round((s.end-s.start)*i/n),end:s.start+Math.round((s.end-s.start)*(i+1)/n),sourceStart:s.start+(s.end-s.start)*i/n,sourceEnd:s.start+(s.end-s.start)*(i+1)/n,direction:s.direction,flashback:s.number===58}));
});
export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const ease=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export const mix=(a:V3,b:V3,t:number):V3=>a.map((v,i)=>lerp(v,b[i],t)) as V3;
export const beat=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
export const distance=(a:V3,b:V3)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export function validateShots(shots:EpisodeShot[]){
 if(!Array.isArray(shots)||shots.length<60)throw Error('Episode requires the complete 60-shot storyboard.');
 const ids=new Set<string>();for(let i=0;i<shots.length;i++){
  const s=shots[i];if(!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start!==(i?shots[i-1].end:0)||s.end<=s.start||s.end-s.start>120||ids.has(s.id))throw Error('Shot duration, coverage, gap or ID violation.');ids.add(s.id);
  if(s.number<1||s.number>60||s.sourceEnd<=s.sourceStart)throw Error('Invalid source shot.');
 }
 const omitted=new Set([7,8,9,18,19,25,33,35]);
 for(let n=1;n<=60;n++)if(!omitted.has(n)&&!shots.some(s=>s.number===n))throw Error('Missing required story beat '+n);
 if(shots.at(-1)!.end>5400)throw Error('Excessive duration.');return shots;
}
export function sourceAt(frame:number,shots:EpisodeShot[]){
 const s=shots.find(s=>frame>=s.start&&frame<s.end)??shots.at(-1)!;
 const u=clamp((frame-s.start)/Math.max(1,s.end-s.start));return {shot:s,frame:lerp(s.sourceStart,s.sourceEnd,u),u};
}
export function actualAt(base:number,shots:EpisodeShot[]){const s=shots.find(s=>base>=s.sourceStart&&base<s.sourceEnd)??shots.at(-1)!;return s.start+(s.end-s.start)*clamp((base-s.sourceStart)/(s.sourceEnd-s.sourceStart));}
export const HOME={front:12.3,back:16.1,left:-0.05,right:4.55,floor:0.20,door:[3.15,0.2,12.3] as V3,window:[0.85,1.55,12.3] as V3,switch:[4.50,1.05,13.00] as V3};
export const STREETLIGHTS:V3[]=[[-6,0,6.5],[6,0,6.5],...[-4.5,-3,-1.5,0,1.5,3,4.5].map(x=>[x,0,9.6] as V3)];
export const DOOR_PUSH_WINDOWS=[[4,6],[15,17],[67,69],[109,109.25]] as const;
/** Acceleration under the paw, then continuous-velocity coasting with friction after release. */
export function doorAngleAt(t:number){
 const [a]=DOOR_PUSH_WINDOWS[t<13?0:t<26.5?1:2],crack=1.12,wide=Math.PI/2;
 // A readable, quick outward swing, followed by a still open hold.
 if(t<109)return crack*beat(t,a,a+.42)*(1-beat(t,a+3,a+4.2));
 const release=109.25,end=110.1,atRelease=crack+(wide-crack)*(.25/1.1);
 if(t<release)return crack+(atRelease-crack)*clamp((t-109)/.25)**2;
 return atRelease+(wide-atRelease)*(1-(1-clamp((t-release)/(end-release)))**2);
}
export const kittenRevealed=(s:Pick<EpisodeState,'shot'>)=>s.shot.number>=46;
export const streetActivity=(s:Pick<EpisodeState,'t'>)=>s.t<29;
export function groupedProgress(s:EpisodeState,numbers:number[]){const shots=s.editShots?.filter(q=>numbers.includes(q.number));return shots?.length?clamp((s.frame-shots[0].start)/(shots.at(-1)!.end-shots[0].start)):s.u;}
export const BLACKOUT_TIMES=[31.8,34.5,36.8,41.0,43.7,46.0,48.7,51.0,53.9];
export const KITTEN_WAIT:V3=[2.50,0.03,5.10],KITTEN_REST:V3=[2.60,0,3.24];
export const BOWL_REST:V3=[3.124228,0,3.424509];
export const CLOCK:V3=[.98,10.3,-7.4];
export const SIGN:V3=[-2.15,0.40,3.42];
export const LANTERN:V3=[-0.96,0,2.62];

export type Key={time:number;position:V3};
export const KITTEN_PATH:Key[]=[{time:0,position:KITTEN_WAIT},{time:99,position:KITTEN_WAIT},{time:100,position:[4.6,.03,5.45]},{time:101,position:[4.6,.03,5.45]},{time:103,position:KITTEN_WAIT},{time:121.5,position:KITTEN_WAIT},{time:122.25,position:KITTEN_WAIT},{time:122.65,position:[2.58,.03,4.95]},{time:123.0,position:KITTEN_WAIT},{time:123.35,position:KITTEN_WAIT},{time:125,position:KITTEN_REST},{time:136,position:KITTEN_REST}];
function pathAt(t:number,keys:Key[]){
 if(t<=keys[0].time)return {position:[...keys[0].position] as V3,travel:0,velocity:0,inMotion:false};
 let travel=0;
 for(let i=1;i<keys.length;i++){
  const a=keys[i-1],b=keys[i],length=distance(a.position,b.position);
  if(t<b.time){const u=clamp((t-a.time)/(b.time-a.time)),before=i>1&&distance(keys[i-2].position,a.position)>.001,after=i+1<keys.length&&distance(b.position,keys[i+1].position)>.001;const progress=before&&after?u:before?u+u*u-u*u*u:after?2*u*u-u*u*u:ease(u);const slope=before&&after?1:before?1+2*u-3*u*u:after?4*u-3*u*u:6*u*(1-u);return {position:mix(a.position,b.position,progress),travel:travel+length*progress,velocity:length*slope/(b.time-a.time),inMotion:length>.001};}
  travel+=length;
 }
 return {position:[...keys.at(-1)!.position] as V3,travel,velocity:0,inMotion:false};
}
const LATTE_PATH:Key[]=[
 {time:0,position:[-1.45,.03,6.1]},{time:10.5,position:[-1.45,.03,6.1]},{time:12.99,position:[-2,.03,6.6]},{time:13,position:[-2,.03,6.1]},
 {time:26.49,position:[-2.0,0.03,6.10]}, {time:26.5,position:[-2.50,0.03,6.3]},
 {time:39.5,position:[-2.50,0.03,6.3]}, {time:44.5,position:[-2.50,0.03,8.00]},
 {time:46.5,position:[-1.80,0.03,8.25]}, {time:49,position:[-0.70,0.03,9.0]},
 {time:51.5,position:[2.0,0.03,10.8]}, {time:54,position:[3.15,0.20,12.08]},
 {time:56,position:[3.68,0.20,13.10]}, {time:58.5,position:[3.68,0.20,13.10]},
 {time:60.5,position:[0.85,0.20,13.14]}, {time:85.9,position:[0.85,0.20,13.14]}, {time:87.1,position:[1.45,0.20,13.85]}, {time:89.1,position:[0.85,0.20,13.14]}, {time:95.65,position:[0.85,0.20,13.14]},
 {time:96.15,position:[2.15,0.20,13.65]}, {time:96.6,position:[3.30,0.20,13.65]},
 {time:96.9,position:[3.30,0.20,12.55]}, {time:97.3,position:[3.30,0.18,11.56]}, {time:97.4,position:[3.30,0.03,11.30]},
 {time:100,position:[3.80,0.03,5.55]}, {time:104,position:[3.80,0.03,5.55]},
 {time:105.5,position:[3.80,0.03,5.55]}, {time:107.5,position:[4.15,0.03,5.85]}, {time:124,position:[4.15,0.03,5.85]},
 {time:126,position:[1.93,0,3.30]}, {time:132.5,position:[1.93,0,3.30]}, {time:135,position:[2.15,0,3.30]}, {time:136,position:[2.15,0,3.30]},
];
const ESSIE_PATH:Key[]=[{time:99,position:[0.02,0.6,-2.08]},{time:100.5,position:[0.48,0.6,-2.08]},{time:102,position:[0.91,0,-2.08]},{time:104,position:[1.40,0,-1.8]},{time:107,position:[1.4,0,0.5]},{time:109,position:[3.55,0,0.6]},{time:113.5,position:[3.55,0,2.9]},{time:117,position:[3.32,0,3.34]},{time:127,position:[3.32,0,3.34]},{time:129.5,position:[3.65,0,3.34]},{time:132,position:[3.65,0,.9]},{time:136,position:[3.65,0,.9]}];
const MOCHA_PATH:Key[]=[{time:0,position:[2.25,0,3.90]},{time:6,position:[2.25,0,3.90]},{time:10,position:[-.96,0,3.30]},{time:12.99,position:[-.96,0,3.30]},{time:13,position:[2.25,0,3.90]},{time:17,position:[2.25,0,3.90]},{time:21,position:[-.96,0,3.30]},{time:26.5,position:[-.96,0,3.65]},{time:64.5,position:[-.96,0,3.65]},{time:67,position:[2.25,0,3.90]},{time:69,position:[2.25,0,3.90]},{time:75,position:[-.96,0,3.65]},{time:85,position:[-.96,0,3.65]},{time:87.5,position:[-.96,0,3.30]},{time:89.5,position:[-.96,0,3.30]},{time:93.5,position:[-.50,0,3.30]},{time:101,position:[-.96,0,3.30]},{time:105.5,position:[-.96,0,3.10]},{time:107.5,position:[-.96,0,3.10]},{time:109,position:[2.25,0,3.90]},{time:112,position:[2.25,0,3.90]},{time:114.5,position:[1.18,0,3.32]},{time:127,position:[1.18,0,3.32]},{time:128,position:[.25,0,3.32]},{time:129,position:[.25,0,1.25]},{time:130.3,position:[-3.45,0,1.25]},{time:136,position:[-3.45,0,1.25]}];

export function pointByDistance(d:number,keys:Key[]):V3{
 let cursor=Math.max(0,d);
 for(let i=1;i<keys.length;i++){const length=distance(keys[i-1].position,keys[i].position);if(length<.00001)continue;if(cursor<=length)return mix(keys[i-1].position,keys[i].position,cursor/length);cursor-=length;}
 return [...keys.at(-1)!.position];
}
export function feetAt(travel:number,keys:Key[]){
 return [0,.5,.5,0].map((offset,i)=>{
  const stride=.32,cycle=travel/stride+offset,step=Math.floor(cycle+1e-8),phase=Math.max(0,cycle-step),fore=i%2? .13:-.13;
  const at=(n:number)=>{
   const d=Math.max(0,(n-offset+.3)*stride+fore),p=pointByDistance(d,keys),a=pointByDistance(Math.max(0,d-.02),keys),b=pointByDistance(d+.02,keys),len=Math.hypot(b[0]-a[0],b[2]-a[2])||1,side=i<2?-.045:.045;
   return [p[0]-(b[2]-a[2])/len*side,p[1],p[2]+(b[0]-a[0])/len*side] as V3;
  };
  const anchor=at(step);if(phase<=.58)return {position:anchor,key:`${i}:${step}:stance`,lift:0};
  const u=(phase-.58)/.42,p=mix(anchor,at(step+1),ease(u));p[1]+=Math.sin(Math.PI*u)*.055;return {position:p,key:`${i}:${step}:swing`,lift:Math.sin(Math.PI*u)*.055};
 });
}

export function supportHeight(p:V3,seed:number){
 if(seed===2&&p[0]>=-.505&&p[0]<=.545&&p[2]>=-2.58&&p[2]<=-1.58)return .6;
 if(seed===0&&p[2]>=12.3)return .20;
 if(seed===0&&p[2]>=11.41&&p[0]>=2.25&&p[0]<=4.05)return .18;
 return p[2]>=4.25?.03:0;
}
export type Actor={feet:V3[];footKeys:string[];position:V3;pose:Partial<CatPose>;travel:number;moving:boolean;emotion:number};
function actor(t:number,keys:Key[],seed:number):Actor{
 const p=pathAt(t,keys),moving=p.inMotion;
 const feet=feetAt(p.travel,keys);for(const foot of feet)foot.position[1]=supportHeight(foot.position,seed)+foot.lift;
 return {feet:feet.map(f=>f.position),footKeys:feet.map(f=>f.key),position:p.position,travel:p.travel,moving,emotion:0,pose:{walking:moving,gait:p.travel/0.32*Math.PI*2,breath:Math.sin(t*1.8+seed)*.22,tail:Math.sin(t*.9+seed)*.10,blink:Math.max(0,1-Math.abs(((t+seed)%4.1)-3.9)/.085),earLeft:0,earRight:0,headTilt:0,yaw:0,headTurn:0,gazeX:0,gazeY:0}};
}
export type EpisodeState={shot:EpisodeShot;editShots?:EpisodeShot[];frame:number;t:number;u:number;camera:V3;target:V3;fov:number;blur:number;required:string[];latte:Actor;mocha:Actor;essie:Actor;kitten:V3;kittenFear:number;kittenSmile:number;kittenTap:number;kittenWalking:number;kittenTravel:number;door:number;homeDoor:number;switchReach:number;blanketLay:number;bowl:V3;bowlContact:boolean;rain:number;failed:boolean[];clock:string;flashback:boolean};
export function stateAt(frame:number,shots:EpisodeShot[]=DRAFT_SHOTS,taps:number[]=[]):EpisodeState{
 const sample=sourceAt(frame,shots),n=sample.shot.number,base=sample.frame/30;
 let t=base;
 // The ending remains in the present: guests enter the same open doorway.
 if(n===58)t=base;
 const latte=actor(t,LATTE_PATH,0),mocha=actor(t,MOCHA_PATH,1),essie=actor(t,ESSIE_PATH,2);

 latte.emotion=t>=23.5&&t<26.5?lerp(1,.35,beat(t,23.5,26)):1-beat(t,108,124);latte.pose={...latte.pose,yaw:latte.moving?-.9:-.05,headTurn:-.25*beat(t,28,37),gazeX:-.6,earLeft:.35*latte.emotion,earRight:.35*latte.emotion,headTilt:-.04*latte.emotion};
 if(t>=46.5&&t<49){latte.pose.headTilt=(latte.pose.headTilt??0)-.17*Math.sin(Math.PI*clamp((t-46.5)/2.5));latte.pose.tail=.45*Math.sin(Math.PI*clamp((t-46.5)/2.5));}
 if([39,40,41,42,43,44,45,48,49].includes(n)){latte.emotion=1;latte.pose.earLeft=.85;latte.pose.earRight=.85;latte.pose.headTilt=.05*Math.sin(frame*.19);}
 if(n===34){const fear=.55+.15*sample.shot.variant+.15*sample.u;latte.emotion=fear;latte.pose.earLeft=latte.pose.earRight=fear*.8;}
 if(n===49)latte.pose.blink=beat(sample.u,.12,.35);
 if(n===43&&sample.u<.23){const hop=.10*Math.sin(Math.PI*sample.u/.23);latte.position[1]+=hop;latte.feet.forEach(f=>f[1]+=hop);}
 if(n===43){latte.pose.headTurn=.4*Math.sin(sample.u*Math.PI*2);latte.pose.gazeX=.8*Math.sin(sample.u*Math.PI*2);}
 if(n===45){const search=sample.u<.5?Math.sin(sample.u*Math.PI*4):-beat(sample.u,.5,.75);latte.pose.headTurn=.40*search;latte.pose.gazeX=.85*search;}
 if(n===51){mocha.pose.headTilt=.16*Math.sin(sample.u*Math.PI*4);mocha.pose.blink=.45+.35*Math.sin(sample.u*Math.PI*3)**2;}
 if(n>=60){latte.pose.gazeX=.65;latte.pose.headTurn=.25;latte.pose.headTilt=-.08;}
 if(n===50&&sample.shot.variant===0)latte.pose.blink=1-beat(sample.u,.15,.65);
 if(n===59)mocha.pose.expression='happy';
 if(n===59&&sample.shot.variant===1){mocha.pose.headTurn=-.5;mocha.pose.gazeX=-.8;}
 if(t>=117){latte.pose.headTurn=.20;latte.pose.gazeX=.42;latte.pose.gazeY=.6;}
 if(n===57&&sample.shot.variant===1){latte.pose.headTurn=-.60*beat(sample.u,.08,.60);latte.pose.gazeX=-.92;latte.pose.gazeY=-.18;}
 mocha.emotion=.32*beat(t,108,125);mocha.pose.yaw=.23;mocha.pose.headTilt=-.03+.05*Math.sin((t-112)*3)*beat(t,112,112.2)*(1-beat(t,114.3,114.5));if(t>=112&&t<114.5)mocha.pose.gazeY=.65;
 if(n===51){mocha.pose.headTilt=.16*Math.sin(sample.u*Math.PI*4);mocha.pose.blink=.45+.35*Math.sin(sample.u*Math.PI*3)**2;}
 essie.emotion=.65*beat(t,114,128);essie.pose.yaw=-.30;essie.pose.gazeY=.5;
 const k=pathAt(t,KITTEN_PATH);k.position[1]=.03*(1-beat(4.25-k.position[2],0,.15));
 const tapAt=(v:number)=>Math.max(0,1-Math.abs(t-v)/.22);
 const kittenTap=Math.max(tapAt(72.0),tapAt(74.3),tapAt(76.8),tapAt(99.8),tapAt(103.9));
 const door=doorAngleAt(t);
 const blanketLay=beat(t,119,119.6),bowlDrop=beat(t,117.35,118.5),bowl=mix([essie.position[0],essie.position[1]+.51,essie.position[2]+.10],BOWL_REST,bowlDrop);
 const s:EpisodeState={shot:sample.shot,editShots:shots,frame,t,u:sample.u,camera:[0,1,7],target:[0,1,4],fov:48,blur:0,required:[],latte,mocha,essie,kitten:k.position,kittenFear:1-beat(t,119,130),kittenSmile:beat(t,123,131),kittenTap,kittenWalking:k.velocity>0.01?1:0,kittenTravel:k.travel,door,homeDoor:(1-beat(t,56.1,56.6))*beat(t,51.5,53)+beat(t,94.5,96)*(1-beat(t,98,99)),switchReach:beat(t,56.1,57)*(1-beat(t,57.5,58.3)),blanketLay,bowl,bowlContact:t>=100&&t<118.65,rain:beat(t,26.5,29),failed:BLACKOUT_TIMES.map(time=>t>=time),clock:t<3.25?'11:10':'11:11',flashback:n===58&&sample.shot.variant===2};
 setCamera(s);
 if(n<46){const kick=taps.reduce((sum,f)=>{const d=frame-f;return sum+(d>=0&&d<7?(1-d/7)*Math.sin(d*2.7):0);},0);s.camera[0]+=kick*.008;s.camera[1]+=kick*.005;s.target[0]+=kick*.008;s.target[1]+=kick*.005;}

 if(n===47){const reach=beat(s.u,.18,.40)*(1-beat(s.u,.66,.88));s.kittenTap=0;const jump=Math.sin(Math.PI*clamp((s.u-.2)/.34));s.kitten[1]+=.19*Math.max(0,jump);const landing=Math.max(0,1-Math.abs(s.u-.55)/.07)*Math.sin(s.frame*2.1)*.008;s.camera[1]+=landing;}
 if(n===58&&sample.shot.variant===1)s.clock='11:11';
 // Use the approved viewing angles to face actual travel in the current camera's screen plane.
 // A short central sample anticipates corners and avoids an abrupt left/right profile flip.
 for(const [a,path] of [[latte,LATTE_PATH],[mocha,MOCHA_PATH],[essie,ESSIE_PATH]] as [Actor,Key[]][]){
  if(!a.moving)continue;
  const before=pathAt(t-.12,path).position,after=pathAt(t+.12,path).position;
  const dx=after[0]-before[0],dz=after[2]-before[2],length=Math.hypot(dx,dz);
  const cx=s.camera[0]-a.position[0],cz=s.camera[2]-a.position[2],cameraLength=Math.hypot(cx,cz);
  const heading=length>1e-8&&cameraLength>1e-8?Math.max(-1,Math.min(1,(dx*cz-dz*cx)/(length*cameraLength))):0;
  a.pose.yaw=heading*(a===latte?.62:.9);a.pose.gazeX=heading*.5;
  if(a===latte&&[43,44].includes(n)){a.pose.headTurn=.35*Math.sin(frame*.12);a.pose.gazeX=.7*Math.sin(frame*.12);}
 }
 if(Math.abs(latte.pose.yaw??0)>.6)latte.pose.headTurn=0;
 const mouth=mouthAnchor(s,'essie'),dx=s.camera[0]-essie.position[0],dz=s.camera[2]-essie.position[2],length=Math.hypot(dx,dz)||1;
 s.bowl=t<118.65?[mouth[0]+dx/length*.17,Math.max(0,mouth[1]-.115),mouth[2]+dz/length*.17]:BOWL_REST;
 return s;
}
function setCamera(s:EpisodeState){
 const n=s.shot.number,v=s.shot.variant,t=s.t,u=s.u;
 const face=(a:Actor,h=.84):V3=>[a.position[0],a.position[1]+h,a.position[2]];
 const latte=face(s.latte),kitten:V3=[s.kitten[0],s.kitten[1]+.40,s.kitten[2]],mocha=face(s.mocha),essie=face(s.essie);
 const set=(camera:V3,target:V3,fov:number,required:string[]=[],blur=0)=>Object.assign(s,{camera,target,fov,required,blur});
 const latteHome=(close=false)=>set(close?[1.00,1.30,14.6]:[2.55,1.55,15.35],latte,close?65:58,['latte'],close?3:0);
 switch(n){
 case 1:if(!v)set([-8.5+u*.35,5.0,13.5],[-1.7,1.7,6.5],105,['cafe']);else set([-.2,1.45,11.3],[0,.9,6.05],92,['rush-home']);break;
 case 2:set([6.5,10.7,3.0],CLOCK,45,['clock']);break;
 case 3:set([3.4,1.5,6.4],[2.65,1.27,4.65],65,['handle']);break;
 case 4:set([2.48,1.00,6.95-u*.12],[2.25,1.45,4.2],53,['door']);break;
 case 5:set([3.05,1.1,5.9],[3.05,1.0,9.7],68,['pavement']);break;
 case 6:set([-4.0,2.0,10.7],[-.4,1.0,7.0],95,['latte']);break;
 case 7:set([.55,3.18,5.65],CLOCK,65,['clock']);break;
 case 8:set([5.7,2.8,12.0],[1.2,2.2,4.2],52,['door']);break;
 case 9:set([-.80,1.8,6.05],[-.90,2.1,4.24],62,['shadow']);break;
 case 10:set([-.6,1.25,8.5],latte,40,['latte']);break;
 case 11:{const p=STREETLIGHTS[v];set([p[0]+.6,3.1,p[2]+2],[p[0],3.08,p[2]],66,['light-'+(v+1)]);break;}
 case 12:set([-1.00,1.15,8.1],latte,40,['latte']);break;
 case 13:set([7,16,8],[-10,13,-28],10,['moon']);break;
 case 14:set([-2.25,1.3,8.55],latte,43,['latte']);break;
 case 15:set([-7.25,2.8,8.5],[-6,3.1,6.5],49,['light-1']);break;
 case 16:set([7.3,2.5,9],[6,3.1,6.5],50,['light-2']);break;
 case 17:set([-4.1,2.6,7.2],[-4.5,3.1,9.6],45,['light-3']);break;
 case 18:set([-2.6,1.25,8.4],latte,46,['latte'],2);break;
 case 19:set([s.latte.position[0]+1,.32,s.latte.position[2]+1.7],[s.latte.position[0],.22,s.latte.position[2]],44,['latte-feet']);break;
 case 20:set([s.latte.position[0]+2.15,1.1,s.latte.position[2]+1.4],latte,53,['latte']);break;
 case 21:set([-.8,1.7,10.0],[-3.5,1.1,7.0],84,['latte','bus-stop']);break;
 case 22:set([.9,.7,9.25],[s.latte.position[0],.35,s.latte.position[2]],50,['latte-feet']);break;
 case 23:set([.8,1.7,9.6],[3.0,.7,12.0],82,['home-door']);break;
 case 24:set([5.25,.85,10.85],latte,57,['latte']);break;
 case 25:set([2.35,1.2,14.55],[3.12,1.1,12.3],57,['home-door']);break;
 case 26:if(!v)set([4.15,1.6,15.4],latte,75,['latte']);else if(v===1)set([4.0,1.16,12.65],HOME.switch,80,['switch']);else latteHome(true);break;
 case 27:{const x=-3.7+7.4*ease(u);set([x,1.55,10.5],[x,1.65,4.2],92,['dark-street']);break;}
 case 28:case 29:{const q=groupedProgress(s,[28,29]);set(mix([-3.7,1.55,9.3],[1.5,2.2,8.8],ease(q)),mix([-1,1.7,4.2],[0,1.9,4.2],ease(q)),100-17*ease(q),['cafe']);break;}
 case 30:set([1.3,1.35,14.8],CLOCK,48,['clock']);break;
 case 31:set([2.4,1.1,6.7],[2.25,1.50,4.2],52,['door']);break;
 case 32:latteHome(true);break;
 case 33:set([2.80,.73,3.60],[2.80,.63,4.47],55,['tap']);break;
 case 34:if(v===0)latteHome();else if(v===1)set([2.6,1.4,15.2],latte,68,['latte']);else latteHome(true);break;
 case 35:latteHome(true);break;
 case 36:latteHome();s.camera=mix(s.camera,s.target,.12*ease(groupedProgress(s,[36])));s.required=['home-blanket'];break;
 case 37:if(!v)set([-2,1.55,10.5],[-2,1.65,5],92,['dark-street']);else set([3.5,1.4,7.0],[2.25,1.3,4.24],75,['door']);break;
 case 38:latteHome(v>0);if(!v)s.required=['home-blanket'];break;
 case 39:set(mix([-.45,1.65,6.65],[-.65,1.85,5.95],ease(groupedProgress(s,[39]))),[-.90,2.0,4.24],64,['shadow']);break;
 // Frame both ear tips together with the head, rather than an empty window strip.
 case 40:set(mix([-.96,2.55,6.65],[-.96,2.55,6.05],ease(u)),[-.96,2.42,4.26],70,['shadow-top','shadow']);break;
 // Include the dragging cloth and the floor around its full travel.
 case 41:set(mix([-.8,1.28,6.4],[-.25,1.24,6.3],ease(u)),[-.9,1.05,4.26],73,['cloth-silhouette']);break;
 case 42:{const q=groupedProgress(s,[42]);set([2.2,1.35,14.6],mix([.95,.60,13.24],[.55,.48,15.1],ease(q)),78,q<.4?['latte-paws']:q>.7?['hiding-box']:[]);const j=Math.sin(s.frame*1.9)*.004;s.camera[0]+=j;break;}
 case 43:set([3.8,1.5,15.35],latte,54,['latte']);break;
 case 44:set([s.latte.position[0]+.2,1.35,s.latte.position[2]-2.0],latte,52,['latte']);break;
 case 45:if(!v)set([s.latte.position[0]+1.0,1.45,s.latte.position[2]+1.8],latte,66,['latte']);else set([4.35,1.35,6.7],latte,64,['latte']);break;
 case 46:set([3.65,.85,6.3],kitten,65,['kitten']);break;
 case 47:{
  // Establish the kitten, tilt to the unreachable handle, then return to the kitten.
  const up=beat(u,.16,.40)*(1-beat(u,.64,.88));
  set([3.5,.95,7.0],mix(kitten,[2.73,1.27,4.34],up),66,up>.85?['handle']:up<.08?['kitten']:[]);
  break;
 }
 case 48:set(mix([-1.2,1.65,7.35],[-.9,1.8,6.3],ease(u)),[-.90,2.0,4.26],68,['shadow']);break;
 case 49:{const pull=ease(u);set(mix([3.4,1.4,7.25],[3.1,1.5,8.1],pull),latte,64-17*pull,['latte'],2);break;}
 case 50:if(!v)set([3.4,1.4,7.25],latte,60,['latte']);else set([3.10,1.35,5.62],mocha,65,['mocha']);break;
 case 51:set([s.mocha.position[0]+1.65,1.27,s.mocha.position[2]+1.48],[s.mocha.position[0]+.15,.70,s.mocha.position[2]+.05],57,['mocha','blanket']);break;
 case 52:set([2.42,1.40,4.10],essie,70,['essie','bowl']);break;
 case 53:set([2.45,.70,4.28],[3.12,.62,3.49],89,['bowl','essie']);break;
 case 54:set([3.65,1.75,4.08],[2.0,.36,3.32],64,['blanket','mocha']);break;
 case 55:set([1.8,.78,2.7],kitten,54,['kitten']);break;
 case 56:set([2.25,1.7,7.2],[(s.latte.position[0]+s.kitten[0])/2,(s.latte.position[1]+.84+s.kitten[1]+.39)/2,(s.latte.position[2]+s.kitten[2])/2],62,['latte','kitten']);break;
 case 57:
  if(v===0)set([-2.0,1.15,1.45],[-3.25,.65,3.35],64,['flowerpot']);
  else if(v===1)set([3.85,1.4,5.9],latte,56,['latte']);
  else set(mix([-2.15,.72,1.20],[-2.15,.68,1.45],ease(groupedProgress(s,[57]))),SIGN,51,['sign']);break;
 case 58:
  if(v===0)set([2.3,1.8,1.0],[2.3,.65,4.8],84,['door','shelter-guest']);
  else if(v===1)set([6.5,10.7,3.0],CLOCK,45,['clock']);
  else if(v===2){const x=-2.8-u*3.4;set([x+2.5,3.5,9.0],[x,1.0,7.2],95,['bus']);}
  else set(mix([7.0,1.3,8.1],[6.4,1.15,7.4],ease(u)),[5.45,.65,5.85],66,['hesitant-cat']);break;
 case 59:
  if(v===0)set(mix([.10,1.4,2.35],[-.15,1.3,2.15],ease(groupedProgress(s,[59]))),mocha,57,['mocha']);
  else if(v===1)set([-2.15,1.3,3.0],[-3.65,.8,1.3],66,['mocha']);
  else set([6.8,1.4,8.1],[4.95,.6,5.65],76,['hesitant-cat']);break;
 case 60:
  if(v===1){const x=-3.2+6.4*ease(u);set([x,1.55,10.5],[x,1.65,4.2],92,['dark-street']);}
  else set(mix([2.1,1.2,5.65],[2.1,1.18,5.4],ease(u)),[2.37,.70,3.26],57,['latte','kitten']);break;

 }
 // A restrained push supports selected reactions; tracking uses actor world position above.
 if([10,18,32,39,49,50,60].includes(n))s.camera=mix(s.camera,s.target,.035*u);
 // Fit requested faces/bodies inside the actual portrait frustum, not just their center marker.
 const close=new Set([10,12,14,18,28,32,35,38,42,45,49,50,57,59]);
 const fitIds=s.required.filter(id=>['latte','mocha','essie','kitten'].includes(id));
 if(fitIds.length){
  const sub=(a:V3,b:V3)=>a.map((v,i)=>v-b[i]) as V3,dot=(a:V3,b:V3)=>a.reduce((n,v,i)=>n+v*b[i],0),norm=(a:V3)=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l) as V3;};
  const forward=norm(sub(s.target,s.camera)),right=norm([-forward[2],0,forward[0]]),up:V3=[right[1]*forward[2]-right[2]*forward[1],right[2]*forward[0]-right[0]*forward[2],right[0]*forward[1]-right[1]*forward[0]];
  let tangent=Math.tan(s.fov*Math.PI/360);
  for(const id of fitIds){const p=id==='kitten'?s.kitten:s[id as 'latte'|'mocha'|'essie'].position,kid=id==='kitten',headOnly=close.has(n)&&fitIds.length===1,half=kid?.28:headOnly?.49:.64;
   for(const x of [-half,half])for(const h of kid?[.02,.72]:headOnly?[.72,1.43]:[.01,1.43]){const point:V3=[p[0]+right[0]*x,p[1]+h,p[2]+right[2]*x],d=sub(point,s.camera),depth=Math.max(.12,dot(d,forward));tangent=Math.max(tangent,Math.abs(dot(d,up))/depth/.87,Math.abs(dot(d,right))/depth/(1080/1920)/.87);}
  }
  s.fov=Math.min(112,Math.max(s.fov,Math.atan(tangent)*360/Math.PI));
 }

}
