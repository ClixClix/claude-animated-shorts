import {CatPose} from '../cats/pose';
import {V3} from '../cafe/config';
export const TOTAL_FRAMES=240;
export const FPS=30;
export const STORY_TITLE='In This Town — A Little Light';
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
export const beat=(f:number,a:number,b:number)=>ease((f-a)/(b-a));
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export const mix3=(a:V3,b:V3,t:number):V3=>t<=0?[...a]:t>=1?[...b]:a.map((v,i)=>lerp(v,b[i],t)) as V3;
export type StoryState={
 frame:number;shot:1|2|3|4;camera:V3;target:V3;fov:number;blur:number;
 kitten:V3;kittenFear:number;kittenSmile:number;kittenLook:number;kittenGait:number;kittenLift:number;kittenWalking:number;kittenBlink:number;
 essie:V3;essiePose:Partial<CatPose>;concern:number;reassurance:number;
 cup:V3;paw:V3;shoulder:V3;reach:number;contact:boolean;door:number;
};
export const CUP_START:V3=[0.15,1.12,-1.23];
export const CUP_END:V3=[0.42,1.12,-1.0];
export const KITTEN_COUNTER:V3=[0.64,1.12,-0.79];
const DIRECTION:V3=[(CUP_END[0]-CUP_START[0])/Math.hypot(0.27,0.23),0,(CUP_END[2]-CUP_START[2])/Math.hypot(0.27,0.23)];
export const CUP_RADIUS=0.105, PAW_RADIUS=0.065;
export function storyAt(frame:number):StoryState{
 const f=Math.max(0,Math.min(239,frame));const shot=f<45?1:f<105?2:f<165?3:4;
 let kitten:V3=[2.25,0,4.78];let walking=0,gait=0,lift=0;
 if(f>=19&&f<45){const t=beat(f,19,36);kitten=mix3([2.25,0,4.78],[2.25,0,4.66],t);walking=Math.sin(Math.PI*t);gait=t*Math.PI*2;}
 else if(f>=45&&f<81){
   const t=clamp((f-45)/35);kitten=t<0.10?mix3([2.25,0,4.66],[2.25,0,4.0],t/0.10):t<0.48?mix3([2.25,0,4.0],[0.30,0,2.95],(t-0.10)/0.38):mix3([0.30,0,2.95],[0.30,0,0.15],(t-0.48)/0.52);
   walking=1;gait=(f-45)*0.7;kitten[1]=0;
 }else if(f>=81&&f<105){const t=clamp((f-81)/23);kitten=mix3([0.30,0,0.15],KITTEN_COUNTER,ease(t));kitten[1]+=Math.sin(Math.PI*t)*0.38;lift=Math.sin(Math.PI*t);}
 else if(f>=105)kitten=[...KITTEN_COUNTER];
 if(f<81)kitten[1]+=0.03*(1-beat(4.25-kitten[2],0,0.15));
 const cup=mix3(CUP_START,CUP_END,beat(f,129,149));
 const essie:V3=[0.02,0.60,lerp(-2.08,-1.76,beat(f,105,117))];
 const shoulder:V3=[essie[0]+0.065,1.13,essie[2]+0.10];
 const touching=f>=126&&f<=153;
 const contactPoint:V3=[cup[0]-DIRECTION[0]*(CUP_RADIUS+PAW_RADIUS),1.245,cup[2]-DIRECTION[2]*(CUP_RADIUS+PAW_RADIUS)];
 const rest:V3=[essie[0]+0.06,1.17,essie[2]+0.08];
 let reach=0,paw:V3=rest;
 if(f>=113&&f<126){reach=beat(f,113,126);paw=mix3(rest,contactPoint,reach);paw[1]+=Math.sin(Math.PI*reach)*0.11;}
 else if(touching){reach=1;paw=contactPoint;}
 else if(f>153&&f<165){reach=1-beat(f,154,164);paw=mix3(rest,contactPoint,reach);paw[1]+=Math.sin(Math.PI*reach)*0.13;}
 const concern=beat(f,57,77)*(1-beat(f,174,195));
 const reassurance=beat(f,195,216);
 const fear=1-beat(f,174,205),smile=beat(f,199,219);
 const blinkAt=(a:number)=>Math.max(0,1-Math.abs(f-a)/2.6);
 const blink=Math.max(blinkAt(65),blinkAt(113),blinkAt(210));
 const essiePose:Partial<CatPose>={yaw:-0.06,headTurn:lerp(0.0,-0.29,beat(f,49,75))*(1-beat(f,105,117)),
   gazeX:lerp(-0.08,-0.72,beat(f,48,64))*(1-beat(f,105,117))+beat(f,117,126)*0.4,
   gazeY:beat(f,109,123)*0.25-blink*0.04,blink,earLeft:beat(f,52,61)*0.18*(1-beat(f,84,95)),earRight:-beat(f,53,63)*0.18*(1-beat(f,84,95)),
   headTilt:-0.055*concern+0.045*reassurance,breath:Math.sin(f/30*1.8)*0.3,tail:0.10*Math.sin(f/30*1.1),expression:'neutral'};
 let camera:V3,target:V3,fov:number,blur:number;
 if(shot===1){const t=beat(f,0,44);camera=mix3([4.05,1.10,7.35],[3.75,0.99,6.98],t);target=[2.23,0.34,4.55];fov=46;blur=0;}
 else if(shot===2){camera=[0.10,1.90,-3.08];target=[0.10,1.47,-1.90];fov=80;blur=0;}
 else if(shot===3){camera=[0,1.86,1.50];target=[0.30,1.43,-1.20];fov=55;blur=0;}
 else {camera=[0,1.67,1.10];target=[0.39,1.48,-1.20];fov=57;blur=5;}
 return {frame:f,shot,camera,target,fov,blur,kitten,kittenFear:fear,kittenSmile:smile,kittenLook:beat(f,190,218),kittenGait:gait,kittenLift:lift,kittenWalking:walking,
   kittenBlink:Math.max(blinkAt(15),blinkAt(184),blinkAt(222)),essie,essiePose,concern,reassurance,cup,paw,shoulder,reach,contact:touching,door:beat(f,28,48)*(1-beat(f,88,120))*1.12};
}
