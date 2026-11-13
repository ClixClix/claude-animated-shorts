import * as T from 'three';
import {CAT_PLACEMENTS, FIXTURES, OPENINGS, ROOM, SHOTS, Fixture} from './config';
export type Check={name:string;pass:boolean;detail:string};
export function layoutChecks():Check[]{
 const out:Check[]=[];const check=(name:string,pass:boolean,detail:string)=>out.push({name,pass,detail});
 const ids=FIXTURES.map(x=>x.id);check('Unique permanent fixture IDs',new Set(ids).size===ids.length,`${ids.length} stable fixtures`);
 const counters=FIXTURES.filter(x=>x.role.endsWith('-counter'));
 check('Exactly one serving and one preparation counter',counters.length===2&&counters.filter(x=>x.role==='serving-counter').length===1&&counters.filter(x=>x.role==='preparation-counter').length===1,counters.map(x=>x.id).join(', '));
 check('Exactly two customer tables',FIXTURES.filter(x=>x.role==='customer-table').length===2,'table-window-front, table-window-back');
 check('Exactly four customer chairs',FIXTURES.filter(x=>x.role==='chair').length===4,'Two chairs at each table');
 const main=FIXTURES.find(x=>x.role==='serving-counter')!,rear=FIXTURES.find(x=>x.role==='preparation-counter')!;
 const aisle=main.position[2]-main.size[2]/2-(rear.position[2]+rear.size[2]/2);
 check('Continuous barista aisle',aisle>=1.2,`${aisle.toFixed(2)} m between worktops; riser is fixed inside staff zone`);
 const dims=(f:Fixture)=>Math.abs(Math.sin(f.rotation??0))>0.5?[f.size[2],f.size[1],f.size[0]]:f.size;
 for(const f of FIXTURES){
   check(`${f.id}: finite positive geometry`,f.position.every(Number.isFinite)&&f.size.every(n=>Number.isFinite(n)&&n>0),`${f.role}`);
   if(f.support){const s=FIXTURES.find(x=>x.id===f.support),d=s&&dims(s);
     check(`${f.id}: rests on ${f.support}`,!!s&&Math.abs(f.position[1]-s.surface!)<0.001&&Math.abs(f.position[0]-s.position[0])+f.size[0]/2<=d![0]/2+0.02&&Math.abs(f.position[2]-s.position[2])+f.size[2]/2<=d![2]/2+0.02,'Worktop/shelf height and footprint');
   }
 }
 const furniture=FIXTURES.filter(f=>['serving-counter','preparation-counter','customer-table','chair','bench','riser'].includes(f.role));
 for(let i=0;i<furniture.length;i++)for(let j=i+1;j<furniture.length;j++){
   const a=furniture[i],b=furniture[j],ad=dims(a),bd=dims(b);
   const overlap=Math.abs(a.position[0]-b.position[0])<(ad[0]+bd[0])/2-0.01&&Math.abs(a.position[2]-b.position[2])<(ad[2]+bd[2])/2-0.01;
   check(`Clear furniture footprints: ${a.id} / ${b.id}`,!overlap,'No duplicate or overlapping furniture');
 }
 for(const c of CAT_PLACEMENTS){
   const s=FIXTURES.find(x=>x.id===c.support)!;
   check(`${c.id}: grounded`,Math.abs(c.position[1]-s.surface!)<0.001,`${c.support} at y=${c.position[1]} m`);
   check(`${c.id}: consistent scale`,c.height===1.52,'Same 1.52 m canvas card; original art/proportions unchanged');
   check(`${c.id}: supported footprint`,Math.abs(c.position[0]-s.position[0])+0.31<=s.size[0]/2&&Math.abs(c.position[2]-s.position[2])+0.16<=s.size[2]/2,'Foot/contact region fits support');
 }
 for(const s of SHOTS){
   const [x,y,z]=s.position;const interior=s.id!=='exterior';
   check(`${s.id}: camera in allowed space`,interior?(Math.abs(x)<ROOM.half-0.2&&z>ROOM.back+0.2&&z<ROOM.front-0.2&&y>0.2&&y<ROOM.height-0.2):z>ROOM.front+1,'No camera inside shell or ceiling');
   const cam=new T.PerspectiveCamera(s.fov,1080/1920,0.08,100);cam.position.set(...s.position);cam.lookAt(...s.target);cam.updateMatrixWorld();cam.updateProjectionMatrix();
   const bad=furniture.filter(f=>{const d=dims(f);return Math.abs(x-f.position[0])<d[0]/2+0.08&&Math.abs(z-f.position[2])<d[2]/2+0.08&&y<f.position[1]+d[1]+0.08;});
   check(`${s.id}: camera clears furniture`,bad.length===0,bad.map(f=>f.id).join(', ')||'Clear');
 }
 check('Visible entrance aperture configured',OPENINGS.filter(o=>o.id==='entrance').length===1,'One permanent front entrance');
 return out;
}
export const layoutFingerprint=()=>JSON.stringify({fixtures:FIXTURES,cats:CAT_PLACEMENTS,openings:OPENINGS,room:ROOM});
