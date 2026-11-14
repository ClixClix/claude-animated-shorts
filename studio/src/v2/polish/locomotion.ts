import {V3} from '../cafe/config';
import {clamp,ease,mix3} from '../animation/timeline';

export const STRIDE=0.26;
const entryX=2.25-Math.sqrt(1.41**2-0.65**2);
export const ROUTE:V3[]=[[2.25,0,5.05],[2.25,0,3.60],[entryX,0,2.95],[0.30,0,2.95],[0.30,0,0.12]];
const lengths=ROUTE.slice(1).map((p,i)=>Math.hypot(p[0]-ROUTE[i][0],p[2]-ROUTE[i][2]));
export const ROUTE_LENGTH=lengths.reduce((a,b)=>a+b,0);
export const ENTRY_DISTANCE=2.86;
export const floorAt=(z:number)=>0.03*(1-ease((4.25-z)/0.15));

export function routePoint(distance:number):{position:V3;direction:V3}{
  let d=Math.max(0,Math.min(ROUTE_LENGTH,distance));
  for(let i=0;i<lengths.length;i++) {
    if(d<=lengths[i]||i===lengths.length-1) {
      const a=ROUTE[i],b=ROUTE[i+1],u=clamp(d/lengths[i]);
      const position=mix3(a,b,u);position[1]=floorAt(position[2]);
      return {position,direction:[(b[0]-a[0])/lengths[i],0,(b[2]-a[2])/lengths[i]]};
    }
    d-=lengths[i];
  }
  throw new Error('Route sampling failed.');
}

export function travelDistance(frame:number){
  if(frame<154)return 0;
  if(frame<=191)return 0.65*ease((frame-154)/37);
  if(frame<=241)return 0.65+(ENTRY_DISTANCE-0.65)*ease((frame-192)/49);
  if(frame<276)return ENTRY_DISTANCE;
  return ENTRY_DISTANCE+(ROUTE_LENGTH-ENTRY_DISTANCE)*ease((frame-276)/68);
}

function anchor(distance:number,side:number):V3 {
  const {position,direction}=routePoint(distance);
  return [position[0]-direction[2]*side*0.045,position[1],position[2]+direction[0]*side*0.045];
}
export type PlantedFoot={position:V3;stance:boolean;anchorKey:string};
/** Feet are fixed world targets during stance, then arc to the next target during swing. */
export function plantedFeet(distance:number):PlantedFoot[]{
  return [-1,1].map((side,index)=>{
    const offset=index*0.5,cycles=distance/STRIDE+offset,step=Math.floor(cycles+1e-9),phase=Math.max(0,cycles-step);
    const anchorDistance=(n:number)=>n<=0?0:(n-offset+0.35)*STRIDE;
    const a=anchor(anchorDistance(step),side);
    if(phase<=0.58)return {position:a,stance:true,anchorKey:`${index}:${step}`};
    const b=anchor(anchorDistance(step+1),side),u=(phase-0.58)/0.42;
    const position=mix3(a,b,ease(u));position[1]+=Math.sin(Math.PI*u)*0.045;
    return {position,stance:false,anchorKey:`${index}:${step}:swing`};
  });
}

export function hopAt(frame:number){
  const u=clamp((frame-344)/25),start=routePoint(ROUTE_LENGTH).position,end:V3=[0.64,1.12,-0.79];
  const position=mix3(start,end,u);position[1]=1.12*u+2.8*u*(1-u);
  const startFeet=plantedFeet(ROUTE_LENGTH);
  const feet=startFeet.map((foot,i)=>{
    const delta:V3=[foot.position[0]-start[0],foot.position[1]-start[1],foot.position[2]-start[2]];
    const target:V3=[i===0?-0.05:0.05,0,0];
    const d=mix3(delta,target,ease(u));
    return [position[0]+d[0],position[1]+d[1]+Math.sin(Math.PI*u)*0.025,position[2]+d[2]] as V3;
  });
  return {position,feet,airborne:u>0&&u<1,progress:u};
}
