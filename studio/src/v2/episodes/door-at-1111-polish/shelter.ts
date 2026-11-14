import type {EpisodeState} from './timeline';
import type {V3} from '../../cafe/config';
const ease=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
/** Continuous supporting-actor routes through the existing entrance, independent of camera cuts. */
export function shelterState(s:EpisodeState,index:number){
 const anchor=(id:string,fallback:number)=>s.editShots?.find(q=>q.id===id)?.start??fallback;
 const start=anchor('58A',3892),end=anchor('58C',3988),emerge=anchor('59C',4170),settle=anchor('60B',4299);
 const progress=ease((s.frame-(index===2?emerge:start+index*16))/Math.max(30,index===2?settle-emerge:end-start-index*16));
 const route:V3[]=index===2?[[4.95,.03,5.65],[2.35,.03,5.65],[2.35,0,3.65],[.20,0,3.55]]:index===0?[[2.05,.03,5.9],[2.05,0,3.55],[.35,0,3.05]]:[[2.65,.03,6.7],[2.65,0,3.65],[1.05,0,3.05]];
 const lengths=route.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-route[i][j]))),total=lengths.reduce((a,b)=>a+b,0);
 let distance=progress*total,position=route.at(-1)!;
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const u=distance/lengths[i];position=route[i].map((v,j)=>v+(route[i+1][j]-v)*u) as V3;break;}distance-=lengths[i];}
 return {position,progress,travel:progress*total,walking:progress>0&&progress<1,visible:s.frame>=start,fear:1-progress};
}
