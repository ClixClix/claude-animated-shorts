import type {V3} from '../../cafe/config';
import type {State} from './timeline';
import {BOX_SPECS} from './boxProps';

/** Portrait-safe framing director for Episode 02.
 *
 * All placements are in the established Cafe/City coordinates (metres; Y up).
 * Replaces old shot-specific extreme close cameras that were composed as if
 * the frame were horizontal. This routine only moves cameras, NOT fixtures.
 */
const ASPECT=1080/1920;
const TARGET_X=.77, TARGET_Y=.72; // leave space for one-word subtitles.
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const V=(x:number,y:number,z:number):V3=>[x,y,z];
const norm=(p:V3):V3=>{const l=Math.hypot(...p)||1;return [p[0]/l,p[1]/l,p[2]/l];};
const sub=(a:V3,b:V3):V3=>V(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const add=(a:V3,b:V3):V3=>V(a[0]+b[0],a[1]+b[1],a[2]+b[2]);
const mul=(a:V3,v:number):V3=>V(a[0]*v,a[1]*v,a[2]*v);
const cross=(a:V3,b:V3):V3=>V(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]);
const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

type Extents={center:V3; half:V3;id:string};
const cat=(id:string,p:V3,scale=1):Extents=>({
 id,center:V(p[0],p[1]+.66*scale,p[2]),
 half:V(.67*scale,.72*scale,.10*scale)
});
const box=(id:string,p:V3,kind:'latte'|'essie'|'shared'|'demo'):Extents=>{
 const spec=BOX_SPECS[kind];
 return {id,center:V(p[0],p[1]+(spec.height+.04)*.5,p[2]),
  half:V(spec.width*.5,.5*(spec.height+.04),spec.depth*.5)};
};
function focusSet(s:State):Extents[]{
 const n=s.shot.sequence;
 const C=(id:'mocha'|'essie'|'latte'|'demoCat')=>{
  const p=s[id];return cat(id,p.position,p.scale);
 };
 const B=(id:'latte'|'essie'|'shared'|'demo')=>{
  const p=id==='latte'?s.latteBox:id==='essie'?s.essieBox:id==='shared'?s.sharedBox:s.demoBox;
  return box(id,p,id);
 };
 if(n<=4)return n<=2?[B('demo'),C('demoCat')]:[B('demo'),...(n===3?[C('demoCat')]:[])];
 if(n===5||n===8||n===11||n===14||n===17||n===23||n===24||n===25||n===27||n===28||n===29||n===30||n===33||n===36||n===43||n===48)return [C('mocha')];
 if(n===6)return [B('latte'),C('latte')];
 if(n===7)return [B('essie'),C('essie'),C('mocha')];
 if(n===9||n===15||n===16)return [C('mocha'),B('latte')];
 if(n===10||n===13)return [B('latte')];
 if(n===12)return [C('mocha'),B('latte')];
 if(n===18||n===20||n===22)return [C('mocha'),C('essie'),B('essie')];
 if(n===19)return [C('mocha'),C('essie'),B('essie')];
 if(n===21)return [C('essie')];
 if(n===26)return [B('essie')]; // shows the vacant spot, box is invisible
 if(n===31||n===34)return [C('mocha'),C('essie'),B('essie')];
 if(n===32)return [C('mocha'),C('essie'),B('essie')];
 if(n===35)return [C('essie'),B('essie')];
 if(n===37||n===38)return [C('mocha'),C('essie'),B('essie')];
 if(n===39||n===40||n===41||n===42||n===44||n===47||n===49||n===50||n===51)return [C('mocha'),B('essie'),...(n===39||n===50||n===51?[C('essie')]:[])];
 if(n===45)return [B('essie')];
 if(n===46)return [C('mocha'),B('essie')];
 if(n===52)return [C('mocha'),C('essie')];
 if(n===53)return [C('mocha'),C('essie')];
 if(n===54)return [C('mocha'),C('essie'),B('latte')];
 if(n===55)return [C('mocha'),C('essie'),C('latte'),B('latte')];
 if(n===56)return [C('mocha'),C('essie'),C('latte')];
 if(n===57)return [C('mocha'),{id:'town-cure-sign',center:[.1,2.0,6.1],half:[1.60,1.0,.1]}];
 if(n>=58)return [C('mocha'),C('essie'),C('latte'),B('shared')];
 return [C('mocha')];
}
const fallback:Record<string,V3>={
 demo:[3.45,1.85,9.0],
 outside:[5.6,2.0,10.0],
 latte:[2.8,1.8,-.30],
 essie:[.70,1.75,3.35],
 group:[2.8,1.8,-.30],
 shared:[-1.45,1.85,3.55],
 bus:[-1.8,1.95,10.9],
 market:[-5.5,1.85,11.0],
 alley:[-9.15,1.85,5.2],
 town:[3.5,2.0,11.6],
};
type Region='outside'|'demo'|'latte'|'essie'|'group'|'shared'|'bus'|'market'|'alley'|'town';
// A fixed axis per location avoids unmotivated orbital camera rotation while
// a character walks during a continuous shot.
const regionAnchor:Record<Region,V3>={
 demo:[1.8,0,5.35],outside:[2.4,0,6.65],latte:[-1.9,0,2.1],
 essie:[.25,0,.3],group:[.25,0,.3],shared:[-1.45,0,2.1],
 bus:[-4.4,0,6.1],market:[-7.3,0,6.5],alley:[-9.15,0,1.4],
 town:[1.1,0,6.4]
};

function region(s:State):Region{
 const n=s.shot.sequence;
 if(n<=4)return 'demo';
 if(n===5||n===8||n===27||n===53)return 'outside';
 if(n===28)return 'bus';
 if(n===29)return 'market';
 if(n>=30&&n<=52)return 'alley';
 if(n===56||n===57)return 'town';
 if(n>=58)return 'shared';
 if([6,9,10,11,12,13,14,15,16,17,54,55].includes(n))return 'latte';
 if([7,18,19,20,21,22,23,24,25,26].includes(n))return 'essie';
 return 'group';
}
function corners(focus:Extents[]):V3[]{
 const corners:V3[]=[];
 for(const {center,half} of focus)
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])
  corners.push(V(center[0]+x*half[0],center[1]+y*half[1],center[2]+z*half[2]));
 return corners;
}
function boundsCenter(focus:Extents[]):V3{
 const all=corners(focus);
 const mn:V3=[Infinity,Infinity,Infinity],mx:V3=[-Infinity,-Infinity,-Infinity];
 for(const p of all)for(let i=0;i<3;i++){mn[i]=Math.min(mn[i],p[i]);mx[i]=Math.max(mx[i],p[i]);}
 return V((mn[0]+mx[0])*.5,(mn[1]+mx[1])*.5,(mn[2]+mx[2])*.5);
}
function projections(points:V3[],center:V3,from:V3,fov:number){
 const forward=norm(sub(center,from));
 let right=norm(cross(forward,[0,1,0]));
 if(Math.hypot(...right)<.01)right=[1,0,0];
 const up=norm(cross(right,forward));
 const tan=Math.tan(fov*Math.PI/360);
 let x=0,y=0,behind=false;
 for(const point of points){
  const offset=sub(point,from),d=dot(offset,forward);
  if(d<.25){behind=true;continue;}
  x=Math.max(x,Math.abs(dot(offset,right)/(d*tan*ASPECT)));
  y=Math.max(y,Math.abs(dot(offset,up)/(d*tan)));
 }
 return {x,y,behind};
}
function safeInteriorDistance(center:V3,dir:V3){
 // Cameras stay away from the cafe's solid front/back walls and side walls.
 const range=[[-3.40,3.40],[.65,3.65],[-3.62,3.62]];
 let limit=30;
 for(let i=0;i<3;i++){
  const v=dir[i];if(Math.abs(v)<1e-5)continue;
  const bound=v>0?range[i][1]:range[i][0];
  const dist=(bound-center[i])/v;
  if(dist>0)limit=Math.min(limit,dist);
 }
 return Math.max(.6,limit-.15);
}
function preferredFov(s:State){
 const n=s.shot.sequence;
 if([11,12,13,14,21,26,38,41,43,45,48].includes(n))return 54;
 if([3,39,49,50,51,54,55].includes(n))return 62;
 if([7,9,15,18,20,22,31,34,56,57,58,59,60].includes(n))return 70;
 return 61;
}
function fit(s:State){
 const focus=focusSet(s),center=boundsCenter(focus),r=region(s);
 // Do not fit the entire 2.48m box from above at the expense of faces.
 // This is an intentional FRONT 3/4 café shot, using existing Episode 01 art.
 if(s.shot.sequence===59||s.shot.sequence===60){
  const n=s.shot.sequence,u=clamp(s.u,0,1);
  const push=n===60?.08*u:0;
  // Follow Mocha while his body is OUTSIDE the shared box in 59; otherwise
  // the fixed close-up saw only empty left edge while the jump occurred.
  // Once he clears the rim the camera recenters on all three faces.
  const trackX=n===59?clamp(s.mocha.position[0]+.75,-2.50,-1.45):-1.45;
  const camera:V3=[trackX,1.18,3.94-push];
  const target:V3=[trackX,.73,2.11];
  const fov=n===59?93:90;
  return {camera,target,fov,region:r,
   framing:projections(corners(focus),target,camera,fov),
   shot:n,selectedIds:focus.map(x=>x.id)};
 }
 const origin=fallback[r];
 let dir=norm(sub(origin,regionAnchor[r]));
 // The playable alley is a narrow corridor at x roughly -9.15.
 // Aim ALONG its open z-axis. Any sideward camera enters the shop wall,
 // which obscured Mocha and Essie in real shot37/49/50 frames.
 if(r==='alley')dir=norm([0,.40,1]);
 const interior=['latte','essie','group','shared'].includes(r);
 const points=corners(focus);
 const maxDistance=interior?safeInteriorDistance(center,dir):21;
 const preferred=preferredFov(s);
 let selected:{d:number;fov:number;fit:number}|null=null;
 for(let fov=preferred;fov<=91;fov+=3){
  let lo=.6,hi=maxDistance;
  if(!Number.isFinite(hi)||hi<=.6)continue;
  const at=(d:number)=>projections(points,center,add(center,mul(dir,d)),fov);
  const p=at(hi);
  if(p.behind||p.x>TARGET_X||p.y>TARGET_Y)continue;
  for(let k=0;k<24;k++){
   const d=(lo+hi)/2,q=at(d);
   if(q.behind||q.x>TARGET_X||q.y>TARGET_Y)lo=d;
   else hi=d;
  }
  const d=Math.min(maxDistance,hi*1.10);
  selected={d,fov,fit:Math.max(p.x,p.y)};break;
 }
 if(!selected){
  // Preserve the whole subject even where a wall would otherwise occlude it;
  // this signals a manual shot rewrite is needed, rather than cropping a cat.
  selected={d:maxDistance,fov:91,fit:1};
 }
 // Wide geography shots breathe; close details retain an intentional tighter face/box frame.
 const wide=[4,8,18,24,27,28,29,30,31,34,40,44,53,56,57,60].includes(s.shot.sequence);
 const distance=Math.min(maxDistance,selected.d*(wide?1.21:1));
 const camera=add(center,mul(dir,distance));
 return {camera,target:center,fov:selected.fov,region:r,
  framing:projections(points,center,camera,selected.fov),
  shot:s.shot.sequence,selectedIds:focus.map(f=>f.id)};
}
/** Deterministic camera profile for all frames. No mutable state or accumulated camera drift. */
export function directEpisodeCamera(s:State){
 return fit(s);
}
