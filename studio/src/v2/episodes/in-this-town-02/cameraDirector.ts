import {STREET_BOX_CENTERS} from './timeline';
import type {V3} from '../../cafe/config';
import type {State} from './timeline';
import {stateAt as sampleShotState,ease as easeTrack} from './timeline';
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
 if(n===46&&s.room==='cafe')return s.heroBox==='latte'?
  [B('latte'),C('latte')]:[B('essie'),C('essie')];
 if(n===4)return [box('street-box-A',STREET_BOX_CENTERS[0],'demo'),box('street-box-B',STREET_BOX_CENTERS[1],'demo'),C('mocha')]; // Tracking camera is handled explicitly below.
 if(n<=3)return n<=2?[B('demo'),C('demoCat')]:[B('demo'),C('demoCat')];
 if(n===5)return [C('mocha'),B('demo')];
 if(n===5||n===8||n===11||n===14||n===17||n===23||n===24||n===25||n===27||n===28||n===29||n===30||n===33||n===36||n===43||n===48)return [C('mocha')];
 if(n===6)return [B('latte'),C('latte')];
 if(n===7)return [B('essie'),C('essie'),C('mocha')];
 if(n===9||n===15||n===16)return [C('mocha'),B('latte')];
 if(n===10)return [B('latte')];
 if(n===13)return [C('mocha')]; // Box-rim POV: frame the face being observed, not the box surrounding the lens.
 if(n===12)return [C('mocha'),B('latte')];
 if(n===18||n===20||n===22)return [C('mocha'),C('essie'),B('essie')];
 if(n===19)return [C('essie'),B('essie')]; // Mocha is hidden in this Essie-only insert.
 if(n===21)return [C('essie')];
 if(n===26)return [C('mocha'),B('essie')]; // Mocha plus the empty sleeping spot
 if(n===31||n===34)return [C('mocha'),C('essie'),B('essie')];
 if(n===32)return [C('essie'),B('essie')];
 if(n===35)return [C('essie'),B('essie')];
 if(n===37||n===38)return [C('essie'),B('essie')]; // Mocha is deliberately offscreen.
 if(n===39)return [C('essie'),B('essie')]; // Match the transformation-only visible cast.
 if(n===40||n===41||n===42||n===44||n===47||n===49||n===50||n===51)return [C('mocha'),B('essie'),...(n===50||n===51?[C('essie')]:[])];
 if(n===45)return [B('essie')];
 if(n===46)return [C('mocha'),B('essie')];
 if(n===52)return [C('mocha'),C('essie')];
 if(n===53)return [C('mocha'),C('essie')];
 if(n===54)return [C('mocha'),C('essie'),B('latte')];
 if(n===55)return [C('mocha'),C('essie'),C('latte'),B('latte')];
 if(n===56)return [C('mocha'),C('essie'),C('latte')];
 if(n===57)return [C('mocha'),B('demo'),C('demoCat')]; // Actual cure action, no instructional billboard.
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
 house:[3.75,1.8,14.75],
};
type Region='outside'|'demo'|'latte'|'essie'|'group'|'shared'|'bus'|'market'|'alley'|'town'|'house';
// A fixed axis per location avoids unmotivated orbital camera rotation while
// a character walks during a continuous shot.
const regionAnchor:Record<Region,V3>={
 demo:[1.8,0,5.35],outside:[2.4,0,6.65],latte:[-1.9,0,2.1],
 essie:[.25,0,.3],group:[.25,0,.3],shared:[-1.45,0,2.1],
 bus:[-4.4,0,6.1],market:[-7.3,0,6.5],alley:[-9.15,0,1.4],
 town:[1.1,0,6.4],house:[1.38,.2,13.7]
};

function region(s:State):Region{
 const n=s.shot.sequence;
 if(s.room==='house')return 'house';
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
 // Shot 04 is a continuous tracking shot: Mocha must cross BOTH street
 // boxes while we see the two separate cats leap inside and fold.
 if(s.shot.sequence===4){
  const pan=easeTrack(s.u);
  // Lower, closer, portrait-safe tracking view: both real boxes and
  // Mocha occupy the visible street, not a tiny corner of the skyline.
  // Each transformation occupies the center of this portrait frame in turn.
  // Mocha is closer to the lens, still readable in the foreground.
  const camera:V3=[1.55-2.14*pan,1.76,8.05];
  const target:V3=[.67-1.42*pan,.62,5.37];
  const fov=63;
  return {camera,target,fov,region:'town' as Region,
   framing:projections(corners(focus),target,camera,fov),
   shot:4,selectedIds:['mocha','street-box-A','street-box-B']};
 }
 if(s.shot.sequence===5){
  const pan=easeTrack(s.u);
  // Center the character, not the empty cardboard. Both are in frame as
  // he gets closer to the box; no more Mocha hidden beyond the left edge.
  const x=s.mocha.position[0];
  const camera:V3=[x+1.15,1.62,9.12];
  const target:V3=[x+.33,.72,5.87];
  return {camera,target,fov:66,region:'outside' as Region,
   framing:projections(corners(focus),target,camera,66),
   shot:5,selectedIds:['mocha','rule-demo']};
 }
 // A box close-up should show the *interior striped floor and flaps*,
 // the jumping Latte, and a strip of the real cafe environment.
 if(s.shot.sequence===6){
  const camera:V3=[s.latteBox[0]+.33,1.55,s.latteBox[2]+2.55];
  const target:V3=[s.latteBox[0]+.10,.64,s.latteBox[2]+.26];
  return {camera,target,fov:73,region:'latte' as Region,
   framing:projections(corners(focus),target,camera,80),
   shot:6,selectedIds:['latte','latte-striped-box']};
 }
 // Essie visibly offers space to Mocha; hold both faces and the same box.
 if(s.shot.sequence===7){
  // Both Essie in her large box AND Mocha passing by must fit simultaneously.
  const camera:V3=[s.essieBox[0]+2.15,1.90,s.essieBox[2]+4.70];
  const target:V3=[s.essieBox[0]+1.10,.75,s.essieBox[2]+.70];
  return {camera,target,fov:78,region:'essie' as Region,
   framing:projections(corners(focus),target,camera,78),
   shot:7,selectedIds:['essie','mocha','essie-box']};
 }
 // Director beat 58 takes place OUTSIDE on the living town street.
 // The next shot is an intentional location cut to the café window.
 if(s.shot.sequence===58){
  const camera:V3=[3.65,2.20,9.15],target:V3=[.98,.80,5.74],fov=90;
  return {camera,target,fov,region:'town' as Region,
   framing:projections(corners(focus),target,camera,fov),
   shot:58,selectedIds:['mocha','essie','latte','street-box-A','street-box-B']};
 }
 // Evidence-backed finale camera. In the 231-frame cloud QA preview
 // from run #44257023170, camera z=5.35 stared into the OPAQUE café
 // facade for EVERY frame of shots 59-60. Earlier full movie #44240680452
 // visibly framed the real interior/box at z=4.12. Restore that proven
 // window-side ray, keep shot59's approach pan and hold the same lens at
 // the 59->60 cut; only push after the three cats have landed.
 if(s.shot.sequence>=59){
  const n=s.shot.sequence,u=clamp(s.u,0,1);
  // Hold Mocha's hesitation on the LEFT at 59, then track LEFT-to-RIGHT
  // with the staggered jumps in 60. At the cut both lenses are identical;
  // the pan starts only after Mocha launches and ends on the three-cat box.
  const recenter=n===59?0:easeTrack((u-.08)/.55);
  const push=n===60?easeTrack((u-.62)/.37):0;
  const trackX=-2.95+1.50*recenter;
  const camera:V3=[trackX,1.98,4.12-.08*push];
  const target:V3=[trackX,.83,2.11];
  const fov=98-5*push;
  return {camera,target,fov,region:'shared' as Region,
   framing:projections(corners(focus),target,camera,fov),
   shot:n,selectedIds:focus.map(x=>x.id)};
 }
 // Only the rule demonstration uses a true overhead, with measured box size.
 if(s.shot.sequence===2){
  const target:V3=[s.demoBox[0],.35,s.demoBox[2]];
  // True vertical sees the original Episode01 illustrated cat edge-on.
  // Keep the elevated rule view but tilt enough to show its actual face.
  const camera:V3=[target[0]+.12,2.10,target[2]+1.55];
  // A closer elevated three-quarter, not a steep overhead that flattens
  // the original 0.79m Episode01 kitten into a miniature paper edge.
  return {camera,target,fov:49,region:r,
   framing:projections(corners(focus),target,camera,49),
   shot:2,selectedIds:focus.map(x=>x.id)};
 }
 // Shot 13 must be the view FROM Latte's box toward Mocha's worried face.
 // The generic box-centred director showed only his detached tail for every
 // frame of the complete 21d74b7 cloud render (720–791). Place the lens
 // just above the real 0.48m rim and aim at Mocha, not at the empty carton.
 if(s.shot.sequence===13){
  const camera:V3=[s.latteBox[0]+.03,.83,s.latteBox[2]+.07];
  const target:V3=[s.mocha.position[0],.82,s.mocha.position[2]];
  const fov=69;
  return {camera,target,fov,region:r,
   framing:projections(corners(focus),target,camera,fov),
   shot:13,selectedIds:['mocha','latte-box-rim']};
 }
 // Full 60-shot a845eb6 review: give closing, missing-cat, market and
 // doorway transitions their own camera axes. The previous 29 sign crossed
 // Mocha's face; the previous 53 open door leaf bisected both rescuers.
 if([11,14,24,25,29,53].includes(s.shot.sequence)){
  const n=s.shot.sequence;
  const profile:Record<number,{camera:V3;target:V3;fov:number}>={
   // Look across the window box without putting a chair back in front of
   // Mocha's planted forepaws (verified in 44146167639 shots 11 and 14).
   11:{camera:[-1.95,1.80,4.00],target:[-.80,.82,2.78],fov:75},
   14:{camera:[-2.20,1.74,3.96],target:[-.82,.84,2.75],fov:75},
   24:{camera:[2.50,1.80,1.75],target:[2.25,1.43,3.65],fov:72},
   25:{camera:[1.85,1.80,2.95],target:[.22,.65,.45],fov:70},
   // From the near side of the shelter: its tall sign stays BEHIND the
   // cat rather than projecting over his eyes during the market walk.
   29:{camera:[-4.50,1.85,4.85],target:[-6.35,.78,6.30],fov:75},
   // View the open door from its left rather than straight through its leaf.
   53:{camera:[.25,1.75,8.10],target:[1.65,.75,5.30],fov:76}
  };
  const q=profile[n];
  return {camera:q.camera,target:q.target,fov:q.fov,region:r,
   framing:projections(corners(focus),q.target,q.camera,q.fov),
   shot:n,selectedIds:focus.map(x=>x.id)};
 }
 // Actual 60-shot cloud footage showed 31–45 repeating one straight-on
 // alley composition. Cover the distinct story actions from opposite ends
 // of the EXISTING open service lane; keep every camera between the real
 // solid facades (west shop begins x=-8.35, open lane centered at -9.15).
 // This changes lens/staging only, never city meshes or Episode 01 assets.
 if([32,35,37,38,41,42,45].includes(s.shot.sequence)){
  const n=s.shot.sequence,p=s.essieBox;
  const profile:Record<number,{camera:V3;target:V3;fov:number}>={
   // From Essie's side, follow the box DRAG without putting a cardboard\n   // wall between the camera and her face. Mocha is offscreen in this shot.
   32:{camera:[p[0]-.20,1.95,p[2]+2.98],
       target:[p[0],.70,p[2]+.71],fov:72},
   // Stay behind the cardboard when Essie settles; Mocha is further up
   // the alley and must not stand between our camera and her face.
   35:{camera:[p[0]-.46,1.66,p[2]-1.66],
       target:[p[0],.58,p[2]],fov:62},
   // One close view for the first papery features, one even more intimate
   // view for the whisker/paw transformation, without entering the box.
   37:{camera:[p[0]-.40,1.25,p[2]-1.78],
       target:[p[0],.70,p[2]],fov:60},
   38:{camera:[p[0]-.34,1.18,p[2]-1.55],
       target:[p[0],.66,p[2]],fov:61},
   // The box and Mocha occupy opposite depth layers: readable tapping.
   41:{camera:[p[0]-.48,1.80,p[2]+3.15],
       target:[p[0],.68,p[2]+.65],fov:72},
   // Reverse for the hug, honoring the same axis and keeping the actor
   // on the open-lane side of the shop wall.
   42:{camera:[p[0]-.36,1.58,p[2]+3.55],
       target:[p[0],.74,p[2]+1.00],fov:73},
   // Real Mocha-eye POV from the OPEN entrance side: elevated enough to\n   // reveal the empty floor, never a lens staring into the exterior back wall.
   45:{camera:[p[0]-.18,2.25,p[2]+1.85],
       target:[p[0],.22,p[2]],fov:63}
  };
  const q=profile[n];
  return {camera:q.camera,target:q.target,fov:q.fov,region:r,
   framing:projections(corners(focus),q.target,q.camera,q.fov),
   shot:n,selectedIds:focus.map(x=>x.id)};
 }
 // Show the planned warm memory images, then return to Mocha's alley POV.
 if(s.shot.sequence===46){
  const memory=s.room==='cafe',latte=s.heroBox==='latte';
  const camera:V3=memory?(latte?[.15,1.65,4.85]:[1.65,1.65,3.50]):[-9.25,1.55,4.55];
  const target:V3=memory?(latte?[-1.9,.75,2.1]:[.25,.75,.3]):[-9.25,.73,2.65];
  const fov=memory?62:63;
  return {camera,target,fov,region:r,framing:projections(corners(focus),target,camera,fov),
   shot:46,selectedIds:focus.map(x=>x.id)};
 }
 // Change shot scale/angle at the emotional box decision, avoiding three
 // consecutive identical wide shots of the alley.
 if(s.shot.sequence===47||s.shot.sequence===48){
  const isBox=s.shot.sequence===47;
  const camera:V3=isBox?[-9.25,2.35,4.55]:[-9.25,1.40,4.40];
  const target:V3=isBox?[-9.15,.43,1.60]:[-9.25,.77,2.62];
  const fov=isBox?65:61;
  return {camera,target,fov,region:r,framing:projections(corners(focus),target,camera,fov),
   shot:s.shot.sequence,selectedIds:focus.map(x=>x.id)};
 }
 // A closer three-cat gathering rather than tiny silhouettes beneath a
 // giant storefront. The original Episode01 character art is unchanged.
 if(s.shot.sequence===56){
  const camera:V3=[1.20,1.65,10.60],target:V3=[1.20,.83,6.35],fov=86;
  return {camera,target,fov,region:r,framing:projections(corners(focus),target,camera,fov),
   shot:56,selectedIds:focus.map(x=>x.id)};
 }
 // Close enough to read the cure diagram; the prior exterior framing was tiny.
 if(s.shot.sequence===57){
  const target:V3=[.1,2.0,6.1],camera:V3=[.1,2.40,10.70];
  return {camera,target,fov:68,region:r,
   framing:projections(corners(focus),target,camera,68),
   shot:57,selectedIds:focus.map(x=>x.id)};
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
 // Motivated, gentle push on held beats; feline acting remains essential.
 if((s.shot.sequence>=31&&s.shot.sequence<=48)||
    [7,18,19,21,22,23,24,25].includes(s.shot.sequence))
  camera[2]-=.12*clamp(s.u,0,1);
 return {camera,target:center,fov:selected.fov,region:r,
  framing:projections(points,center,camera,selected.fov),
  shot:s.shot.sequence,selectedIds:focus.map(f=>f.id)};
}
/** Episode 02 camera grammar: measured, stable holds plus deliberate eased tracks.
 * Do not automatically orbit/zoom around every animated head or box:
 * fit(s) can change its selected FOV in 3-degree steps as living subjects move,
 * leading to small but visible zoom snaps and accidental pivots. Camera
 * direction is authored per shot, never dependent on the preceding render.
 */
const DOLLY_TRACK_SHOTS=new Set([5,8,20,27,28,29,30,32,36,49,50,54,55]);
const blend3=(a:V3,b:V3,u:number):V3=>[
 a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u
];
function authoredEpisodeCamera(s:State){
 const n=s.shot.sequence;
 if(n===1||n===2){
  // ONE continuous 105-frame city-to-kitten crane across editorial shots 01/02.
  // Old footage snapped to a far street view at frame 83, then rushed through
  // 8+ metres of city geometry in the 21-frame closeup. At the boundary,
  // position, look-at, FOV AND motion derivative now come from the SAME curve.
  // Phase 2 arcs RIGHT along the real sidewalk, descending to a three-quarter
  // kitten-and-box view instead of flying into storefront panels or signage.
  const total=104,split=83;
  const t=clamp(s.frame/total,0,1);
  const q=split/total;
  const boxX=s.demoBox[0],boxZ=s.demoBox[2];
  const bez=(a:number,b:number,c:number,d:number,u:number)=>{
   const v=1-u;return v*v*v*a+3*v*v*u*b+3*v*u*u*c+u*u*u*d;
  };
  const bez3=(a:V3,b:V3,c:V3,d:V3,u:number):V3=>[
   bez(a[0],b[0],c[0],d[0],u),
   bez(a[1],b[1],c[1],d[1],u),
   bez(a[2],b[2],c[2],d[2],u)
  ];
  const a:V3=[4.6,31.5,52.0]; // preserve approved city reveal
  const b:V3=[4.35,27.8,44.0];
  const c:V3=[boxX-.05,4.45,boxZ+3.0];
  const d:V3=[boxX+.75,2.05,boxZ+2.30];
  const k=(1-q)/q; // maintain equal first derivative through frame 83
  const b2:V3=[d[0]+(d[0]-c[0])*k,
   d[1]+(d[1]-c[1])*k,d[2]+(d[2]-c[2])*k];
  const c2:V3=[boxX+1.05,1.73,boxZ+1.78];
  const d2:V3=[boxX+1.16,1.70,boxZ+1.66];
  const targetA:V3=[1.8,3.8,8.3];
  const targetB:V3=[boxX,2.15,boxZ+1.9];
  const targetC:V3=[boxX,.58,boxZ];
  const targetD:V3=[boxX,.43,boxZ];
  const targetB2:V3=[targetD[0]+(targetD[0]-targetC[0])*k,
   targetD[1]+(targetD[1]-targetC[1])*k,
   targetD[2]+(targetD[2]-targetC[2])*k];
  const targetC2:V3=[boxX,.37,boxZ],targetD2:V3=[boxX,.36,boxZ];
  const first=t<=q,u=first?t/q:(t-q)/(1-q);
  const camera=first?bez3(a,b,c,d,u):bez3(d,b2,c2,d2,u);
  const target=first?bez3(targetA,targetB,targetC,targetD,u):
   bez3(targetD,targetB2,targetC2,targetD2,u);
  const fov=first?bez(80,78,56,54,u):bez(54,54+(54-56)*k,52,51,u);
  return {camera,target,fov,region:'town' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:n===1?['city-establishing','demo','demoCat']:['demo','demoCat']};
 }
 // 06/07 are deliberately authored ONCE in the dedicated camera block
 // below; earlier duplicate returns silently bypassed every later fix.
 // Closing time is a two-subject shot: Mocha's real muzzle AND the hinged
 // Episode 01 café door. Mocha-only framing omitted the closing action.
 if(n===24){
  const camera:V3=[5.35,1.75,8.0],target:V3=[2.48,.85,4.75],fov=68;
  return {camera,target,fov,region:'outside' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:['mocha','episode01-cafe-door']};
 }
 // Story-locked geography: the house is the Episode 01 HOME, not café B-roll.
 if(s.room==='house'){
  const n=s.shot.sequence;
  // The former shot27 camera looked from INSIDE the house into the opaque
  // threshold: actual 540p frames 1653-1703 showed an empty closed doorway.
  // Film the real outward run from the PORCH instead; do not alter 25-26.
  // Actual full-source 0cab445 frame sequence 1653-1703 proves Mocha
  // exits, but grows into a giant near-lens cutout by the end. Pull the
  // porch camera BACK along the same exterior ray, preserving the open
  // Episode01 door and leaving room for the full running silhouette.
  const camera:V3=n===25?[3.90,1.72,14.92]:
   n===26?[3.78,1.73,14.83]:[4.75,1.82,8.30];
  const target:V3=n===26?[1.38,.46,13.70]:
    n===27?[3.30,.76,11.45]:[s.mocha.position[0],.86,s.mocha.position[2]];
  const fov=n===26?63:n===27?78:72;
  return {camera,target,fov,region:'house' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:n===26?['essie-home-bed-empty','mocha']:['mocha','episode01-house']};
 }
 // Three distinct alleys within the SAME narration beat: hard editorial cuts
 // are intentional at one-third/two-thirds. No interpolation between districts.
 if(n===30){
  const index=s.searchAlleyIndex??0;
  const anchors:V3[]=[[-18.5,0,2.55],[18.5,0,2.55],[-9.15,0,3.05]];
  const a=anchors[index],local=clamp(s.u*3-index,0,1);
  const camera:V3=[a[0]+.06,1.75,a[2]+3.30-.20*easeTrack(local)];
  const target:V3=[a[0],.78,a[2]+.17];
  const fov=68;
  return {camera,target,fov,region:'alley' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:30,selectedIds:['mocha','search-alley-'+(index+1)]};
 }
 // Show the market set from the pedestrian approach rather than aiming at
 // generic storefronts with the new stalls outside the portrait field.
 if(n===29){
  const camera:V3=[-5.15,1.97,8.45],target:V3=[-7.25,.86,5.30],fov=75;
  return {camera,target,fov,region:'market' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:29,selectedIds:['mocha','market-stalls']};
 }
 if(n===18||n===22){
  const p=n===18?s.mocha.position:s.essie.position;
  const camera:V3=[p[0]+.75,1.75,p[2]+2.5];
  const target:V3=[p[0],.64,p[2]];
  const fov=72;
  return {camera,target,fov,region:(n===18?'outside':'essie') as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:n===18?['mocha','essie-outside']:['essie','essie-cafe-bed']};
 }
 // 03 continues the APPROVED kitten three-quarter orientation from
 // frame 104: no arbitrary top-down snap as the living body becomes paper.
 if(n===3){
  const u=easeTrack(s.u),p=s.demoBox;
  const camera:V3=[p[0]+1.16-.24*u,1.70-.13*u,p[2]+1.66-.26*u];
  const target:V3=[p[0],.36-.08*u,p[2]];
  const fov=51-2.5*u;
  return {camera,target,fov,region:'town' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:['demo','demoCat']};
 }
 // Shot04 now really contains THREE different physical cartons, TWO
 // independent cat-to-box jumps, and Mocha's continuous walk as witness.
 if(n===4||n===5){
  // One continuous run along multiple storefronts: no hidden midpoint cut
  // and no camera reset when the ordinary-box beat starts.
  const x=s.mocha.position[0]+.55;
  const camera:V3=[x,1.80,9.20],target:V3=[x,.75,5.75],fov=78;
  return {camera,target,fov,region:'town' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:n===4?['mocha','street-box-A','street-box-B']:['mocha','ordinary-box']};
 }
 // LOCK RESTING-CAT PERSPECTIVE: Episode 01 cats are illustrated,
 // not full volumetric anatomy. Automatic fit and overhead cameras showed
 // them as narrow billboards in huge empty boxes. Aim along each box's
 // physical floor plane, keeping face + shoulders readable above the rim.
 // Leave approved Shot 01/02 crane and all unrelated cuts untouched.
 if(n===6){
  // V7: The V6 camera at Z=4.66 was OUTSIDE the solid cafe front wall
  // (Z=4.2). Actual V6 footage therefore showed 88 blank wall frames.
  // Use a portrait-safe three-quarter camera INSIDE the room, closer than
  // the front wall but far enough to show Latte's full jump and box stripes.
  // Portrait width must hold a side-approach cat AND the striped box.
  // Position stays inside the café façade (z<4.2); the entire travel
  // occurs at almost constant depth, eliminating perspective size pops.
  const pan=easeTrack((s.u-.35)/.26);
  const camera:V3=[-.95-.85*pan,2.35,4.07];
  const target:V3=[-.90-.85*pan,.90,2.10];
  const fov=112;
  return {camera,target,fov,region:'latte' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:['latte','striped-cardboard-box']};
 }
 if(n===7){
  // Left-side camera avoids the table/chair which previously blocked Mocha.
  // 07A closer Essie invitation, 07B both figures and actual refusal walk.
  const invite=s.shot.id==='07A';
  const pan=invite?0:easeTrack(s.u)*.16;
  const camera:V3=invite?[-.53,1.62,2.45]:[1.00+pan,1.85,3.90];
  const target:V3=invite?[.10,.80,.12]:[1.00+pan,.78,.64];
  const fov=invite?72:106;
  return {camera,target,fov,region:'essie' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:invite?['essie','box-space']:['essie','mocha','refusal']};
 }
 if(n===21){
  // Keep both lead faces inside the frame instead of cropping Mocha at right.
  const camera:V3=[.80,1.90,3.60],target:V3=[.65,.73,.65],fov=80;
  return {camera,target,fov,region:'essie' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:['essie','mocha','essie-box']};
 }
 if(n===19){
  const p=s.essieBox,camera:V3=[p[0]+.48,1.60,p[2]+2.80-.15*easeTrack(s.u)];
  const target:V3=[p[0]+.20,.68,p[2]+.10],fov=65;
  return {camera,target,fov,region:'essie' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:['essie','box']};
 }
 if([35,37,38,39].includes(n)){
  const p=s.essieBox;
  // The old camera was behind the NEGATIVE-z carton wall: only ears
  // were visible in source frames 2295, 2355, 2422. Reverse to the
  // open-front side from the alley mouth, a grounded 3/4 portrait view.
  const distance=n===35?2.75:n===37?2.42:n===38?2.32:2.42;
  const height=n===35?1.68:n===37?1.55:n===38?1.53:1.55;
  const camera:V3=[p[0]+.58,height,
   p[2]+distance-.14*easeTrack(s.u)];
  const target:V3=[p[0],.70,p[2]+.04];
  const fov=n===35?63:n===37?60:n===38?59:62;
  return {camera,target,fov,region:'alley' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:['essie','box']};
 }
 // Rescue is one connected spatial action. The same camera axis holds
 // across 49/50/51 instead of orbiting behind the carton or framing empty lane.
 if(n===49||n===50||n===51||n===52){
  // Hold the same side of the alley throughout the cure and physical tumble.
  // Higher sightline sees the intact rim; no wall shortening or card resizing.
  const intimate=n===52?easeTrack(s.u):0;
  const camera:V3=[-9.15,2.25-.60*intimate,6.35-.18*intimate];
  const target:V3=[-9.15,.95,2.30+.55*intimate];
  const fov=74-2*intimate;
  return {camera,target,fov,region:'alley' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:['mocha','essie','rescue-box']};
 }
 // Physical box-contact coverage: the previous automatic tight crop
 // cut off Mocha's muzzle in the paw/box POV (12–13) and partly cropped the
 // rescue two-shot (20). Keep the camera on its proven ray, pull back a
 // little, and bias the look-at toward his acting rather than empty carton.
 // This is a locked per-shot frame, never a frame-by-frame auto-fit zoom.
 // Actual 63-frame current-source shot12 (#44257023131, shard 0)
 // is blocked by an opaque vertical café partition for ALL eight sampled
 // motion frames. Shot11's adjacent established camera ray visibly clears
 // the partition and shows Mocha + Latte's box. Match that axis rather than
 // auto-fitting from behind the solid wall; the nose/flap contact still
 // needs a new moving-footage review.
 if(n===12){
  const camera:V3=[-1.95,1.80,4.00],target:V3=[-.80,.82,2.78],fov=75;
  return {camera,target,fov,region:'latte' as Region,
   framing:projections(corners(focusSet(s)),target,camera,fov),
   shot:n,selectedIds:['mocha','latte-box-flaps']};
 }
 if(n===13||n===20){
  const mid=Math.floor((s.shot.start+s.shot.end-1)/2);
  const midState=sampleShotState(mid,[s.shot]);
  const fitted=fit(midState);
  const favor=n===13?.25:.12;
  const target:V3=blend3(fitted.target,
   [midState.mocha.position[0],.68,midState.mocha.position[2]],favor);
  const pull=n===13?1.27:1.15;
  const camera:V3=[
   target[0]+(fitted.camera[0]-fitted.target[0])*pull,
   target[1]+(fitted.camera[1]-fitted.target[1])*pull,
   target[2]+(fitted.camera[2]-fitted.target[2])*pull
  ];
  const fov=Math.min(82,fitted.fov+(n===13?13:10));
  return {...fitted,camera,target,fov,
   framing:projections(corners(focusSet(s)),target,camera,fov)};
 }
 // 46 deliberately cuts inside the shot to two brief café memories.
 // 58–60 have a single explicitly choreographed, cut-continuous finale.
 if(n===46||n>=58)return fit(s);
 const oneShot=[s.shot];
 if(DOLLY_TRACK_SHOTS.has(n)){
  const from=fit(sampleShotState(s.shot.start,oneShot));
  const to=fit(sampleShotState(s.shot.end-1,oneShot));
  const u=easeTrack(s.u);
  const camera=blend3(from.camera,to.camera,u);
  const target=blend3(from.target,to.target,u);
  const fov=from.fov+(to.fov-from.fov)*u;
  return {...from,camera,target,fov,
   framing:projections(corners(focusSet(s)),target,camera,fov)};
 }
 // On held reaction shots, keep the established lens but give the
 // audience one deliberate, gentle motivated push. The previous complete
 // film had many 2–3-second image-identical frames; the story became a
 // slide show despite successful CI. Never dynamically refit per frame.
 const middle=Math.floor((s.shot.start+s.shot.end-1)/2);
 const held=fit(sampleShotState(middle,oneShot));
 const livingHoldShots=new Set([10,15,17,18,22,26,31,34,40,44,47,51,52]);
 if(livingHoldShots.has(n)){
  const progress=easeTrack(s.u);
  const dx=held.target[0]-held.camera[0];
  const dy=held.target[1]-held.camera[1];
  const dz=held.target[2]-held.camera[2];
  const length=Math.hypot(dx,dy,dz)||1;
  const push=.20*progress; // meters, not a focal-length or actor scale pop
  const camera:V3=[
   held.camera[0]+push*dx/length,
   held.camera[1]+push*dy/length,
   held.camera[2]+push*dz/length
  ];
  return {...held,camera,
   framing:projections(corners(focusSet(s)),held.target,camera,held.fov)};
 }
 return {...held,
  framing:projections(corners(focusSet(s)),held.target,held.camera,held.fov)};
}

export function directEpisodeCamera(s:State){
 if(s.story?.camera)return {...s.story.camera,region:region(s),shot:s.shot.sequence,selectedIds:focusSet(s).map(f=>f.id),framing:projections(corners(focusSet(s)),s.story.camera.target,s.story.camera.camera,s.story.camera.fov)};
 const base=authoredEpisodeCamera(s);
 if(![40,41,42,44,47,48].includes(s.shot.sequence))return base;
 // Match the small foreground clearance move, preserving subject/lens scale.
 const camera:V3=[base.camera[0],base.camera[1],base.camera[2]+.36];
 const target:V3=[base.target[0],base.target[1],base.target[2]+.36];
 return {...base,camera,target,framing:projections(corners(focusSet(s)),target,camera,base.fov)};
}
