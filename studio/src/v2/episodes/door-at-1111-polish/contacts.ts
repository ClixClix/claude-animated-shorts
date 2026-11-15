import type {EpisodeState} from './timeline';
import type {V3} from '../../cafe/config';
import {DESIGNS} from '../../cats/designs';
/** World-space mouth landmark from the locked Canvas head transforms, including walk bob/turn/tilt. */
export function mouthAnchor(s:EpisodeState,id:'mocha'|'essie',lower=true):V3{
 return faceAnchor(s,id,43,lower);
}
/** Small head-only nudge using the approved drawing; never a reaching paw. */
export function nosePushPixels(s:EpisodeState){
 const smooth=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
 if(s.shot.number===58&&s.shot.variant===0)return 26*smooth((s.t-109.05)/.20)*(1-smooth((s.t-109.25)/.40));
 if(s.shot.number===59&&s.shot.variant===1)return 18*smooth((s.u-.12)/.23)*(1-smooth((s.u-.60)/.25));
 return 0;
}
export function noseAnchor(s:EpisodeState):V3{return faceAnchor(s,'mocha',26,false);}
function faceAnchor(s:EpisodeState,id:'mocha'|'essie',y:number,lower:boolean):V3{
 const a=s[id],p=a.pose,sign=(p.yaw??0)<0?-1:1,yaw=Math.abs(p.yaw??0),walk=!!p.walking;
 const headYaw=Math.max(-1,Math.min(1,yaw+(p.headTurn??0)*sign)),hy=Math.abs(headYaw),headSign=headYaw<0?-1:1;
 const mx=hy>.86?98:hy*55,scaleX=(1-hy*.18)*DESIGNS[id].headWidth/101;
 const x=mx*headSign*scaleX,angle=(p.headTilt??0)*sign;
 const bob=walk?Math.cos((p.gait??0)*2)*2:(p.breath??0)*1.5;
 const px=sign*(yaw*(walk?76:51)+x*Math.cos(angle)-y*Math.sin(angle)+(id==='mocha'?nosePushPixels(s):0)),py=204+bob+(walk?35:0)+x*Math.sin(angle)+y*Math.cos(angle);
 const dx=s.camera[0]-a.position[0],dz=s.camera[2]-a.position[2],length=Math.hypot(dx,dz)||1;
 return [a.position[0]+dz/length*px*1.52/550+dx/length*.025,a.position[1]+(480-py)*1.52/550-(lower?headDropPixels(s,id)*1.52/550:0),a.position[2]-dx/length*px*1.52/550+dz/length*.025];
}

/** Lower the existing head drawing toward the bowl, then lift after release; no artwork replacement. */
export function headDropPixels(s:EpisodeState,id:'mocha'|'essie'){
 if(id!=='essie')return 0;
 const ease=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
 const amount=ease((s.t-117.35)/1.15)*(1-ease((s.t-118.65)/.55));
 return Math.max(0,mouthAnchor(s,id,false)[1]-.115)*amount*550/1.52;
}
