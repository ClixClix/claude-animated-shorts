import type {EpisodeState} from './timeline';
import type {V3} from '../../cafe/config';
const ease=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
/** Continuous supporting-actor routes through the existing entrance, independent of camera cuts. */
export function shelterState(s:EpisodeState,index:number){
 const anchor=(id:string,fallback:number)=>s.editShots?.find(q=>q.id===id)?.start??fallback;
 const start=anchor('59A',3050),end=anchor('58C',3988),emerge=anchor('59C',4170),settle=anchor('60A',3200);
 const begin=index===3?anchor('57E',3850):index===2?start-14:start+index*16;
 const finish=index===3?end:index===2?settle:anchor('60A',3200);
 let progress=ease((s.frame-begin)/Math.max(30,finish-begin));
 if(index===2){const u=Math.max(0,Math.min(1,(s.frame-begin)/(finish-begin))),r=.08;progress=u<r?u*u/(2*r*(1-r)):u>1-r?1-(1-u)**2/(2*r*(1-r)):(u-r/2)/(1-r);}
 const route:V3[]=index===3?[[3.70,.03,5.65],[2.5,.03,5.65],[2.5,0,3.6],[-.5,0,2.5]]:index===2?[[5.45,.03,-1.7],[5.45,.03,4.9],[2.6,.03,5.85],[2.6,0,3.9],[3.5,0,3.65],[3.5,0,2.9],[-1.0,0,2.7]]:index===0?[[2.05,.03,5.9],[2.05,0,3.55],[.35,0,3.05],[.35,0,.8]]:[[2.65,.03,6.7],[2.65,0,3.65],[-.35,0,3.05],[-.35,0,1.7]];
 if(index===3){const threshold=anchor('58A',3892),entryFraction=3.25/(3.25+Math.hypot(3,1.1));progress=s.frame<threshold?entryFraction*ease((s.frame-begin)/Math.max(1,threshold-begin)):entryFraction+(1-entryFraction)*ease((s.frame-threshold)/Math.max(1,finish-threshold));}
 const lengths=route.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-route[i][j]))),total=lengths.reduce((a,b)=>a+b,0);
 let distance=progress*total,position=route.at(-1)!;
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const u=distance/lengths[i];position=route[i].map((v,j)=>v+(route[i+1][j]-v)*u) as V3;break;}distance-=lengths[i];}
 if(index===2&&s.frame>begin&&s.frame<begin+28)position[1]+=.62*Math.sin(Math.PI*(s.frame-begin)/28);
 return {position,progress,travel:progress*total,walking:progress>0&&progress<1,visible:s.frame>=(index===3?anchor('57D',3800):index===2?anchor('58D',3000):start),fear:1-progress};
}

export function streetCatPosition(s:Pick<EpisodeState,'t'>,index:number):V3{
 const t=s.t,rush=Math.min(t,3),walk=Math.max(0,t-3);
 if(index===0&&t>10){const approach=ease((t-10)/.8),turn=ease((t-11.5)/1.5);return [-2.4-approach*.3-turn*1.4,.03,11.9-approach*.45+turn*5.5];}
 return index===0?[5-rush*1.3-walk*.5,.03,11.9]:[-2.5+rush*1.2+walk*.42,.03,6.05];
}
