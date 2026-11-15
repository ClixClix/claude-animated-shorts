import type {V3} from '../../cafe/config';
const occupied=[[-10,-4],[-12,1],[-12,15],[9.8,-6],[12,1],[-5,-12],[1,-13],[7,-13],[-7,14.5],[0,19],[7,14.5]];
/** Metres/Y-up, same origin as the cafe. Stable district blocks, no shot-specific rebuilding. */
export const CITY_BUILDINGS=[-48,-36,-24,-12,0,12,24,36,48].flatMap((x,column)=>[-52,-39,-26,-13,0,26,39,52,65].flatMap((z,row)=>{
 if(Math.abs(x)<19&&z>-8&&z<23||occupied.some(p=>Math.hypot(x-p[0],z-p[1])<7))return [];
 const seed=column*11+row,floors=3+seed%4+(z<-30?2:0),width=5.4+(seed%3)*.2,depth=6.4+(seed%2)*.6;
 return [{id:`city-block-${column}-${row}`,position:[x,0,z] as V3,width,depth,height:floors*1.65+.7,floors,style:seed%4,pitched:seed%3===0}];
}));
export const CITY_ROADS=[
 ...[-54,-42,-30,-18,18,30,42,54].map(x=>({id:`city-road-x-${x}`,position:[x,0,4] as V3,size:[5.8,.06,150] as V3})),
 ...[-58.5,-45.5,-32.5,-19.5,-6.5,19.5,32.5,45.5,58.5,71.5].flatMap(z=>[-6.5,19.5].includes(z)?[-1,1].map(side=>({id:`city-road-z-${z}-${side}`,position:[side*40,0,z] as V3,size:[38,.06,5.2] as V3})):[{id:`city-road-z-${z}`,position:[0,0,z] as V3,size:[120,.06,5.2] as V3}]),
];
export const CITY_EXTENT=170;
/** Distant, fixed skyline blocks: fill the horizon without changing the story street. */
export const CITY_BACKDROP=[
 ...[-156,-143,-130,-117,-104,-91,-78,78,91,104,117,130,143,156].flatMap(z=>Array.from({length:25},(_,i)=>[-144+i*12,z])),
 ...[-156,-144,-132,-120,-108,-96,-84,-72,72,84,96,108,120,132,144,156].flatMap(x=>Array.from({length:11},(_,i)=>[x,-65+i*13])),
].map(([x,z],i)=>({id:'skyline-block-'+i,position:[x,0,z] as V3,width:6.4+i%3,depth:7.2,height:11+(i*7%9)*1.5}));
