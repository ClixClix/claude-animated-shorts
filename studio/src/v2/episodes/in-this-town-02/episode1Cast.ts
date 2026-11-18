import * as T from 'three';
import {createEpisodeCat,contactShadow} from '../door-at-1111-polish/actors';
import {DRAFT_SHOTS,stateAt as episode1State,supportHeight,
 type Actor,type EpisodeState} from '../door-at-1111-polish/timeline';
import type {CatId} from '../../cats/designs';
import type {V3} from '../../cafe/config';
import type {ActorPose,State} from './timeline';
import type {CatBehavior} from './catBehaviors';

/**
 * Actual Episode 01 character implementation — not a re-illustration.
 *
 * The same createEpisodeCat draws each approved full-head/full-body canvas,
 * card shader, planted four-leg cards, whiskers and cat-identity markings.
 * Episode 02 supplies a new STORY trajectory while Episode 01 continues
 * owning all designs, geometry and physical walking leg artwork.
 */
type Episode1Cat=ReturnType<typeof createEpisodeCat>;
const BASE=episode1State(0,DRAFT_SHOTS);
const HALF_WIDTH=.145;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const vec=(x:number,y:number,z:number):V3=>[x,y,z];

function bridgeActor(
 id:CatId,pose:ActorPose,next:ActorPose,s:State
):Actor{
 const p=pose.position;
 const delta=vec(next.position[0]-p[0],0,next.position[2]-p[2]);
 const length=Math.hypot(delta[0],delta[2]);
 const moving=pose.walking&&length>.00005;
 const dir:V3=length>.00005?vec(delta[0]/length,0,delta[2]/length):[1,0,0];
 const side:V3=[-dir[2],0,dir[0]];
 const seed=id==='latte'?0:id==='mocha'?1:2;
 // Tie foot cycles to actual travel in the 2-second Shot 05 avoidance:
 // previously the paws kept cycling at constant 2.6Hz while the body
 // eased to a stop, creating visible skating and treadmill motion.
 const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
 const travel=s.shot.sequence===5?
   .65*smooth(s.u/.40)+.56*smooth((s.u-.48)/.40):
   s.t*.82;
 const cycle=travel/.32*Math.PI*2;
 const stepIntensity=clamp(length*30/.62);
 const camOffset=vec(s.camera[0]-p[0],0,s.camera[2]-p[2]);
 const d=Math.hypot(camOffset[0],camOffset[2])||1;
 const camRight=vec(camOffset[2]/d,0,-camOffset[0]/d);
 const movingYaw=moving?Math.max(-.62,Math.min(.62,
   (dir[0]*camRight[0]+dir[2]*camRight[2])*.57)):.06;
 const feet:V3[]=[];
 const footKeys:string[]=[];
 for(let i=0;i<4;i++){
  // CRITICAL: match Episode 01 walkingLegs.anatomicalHips indexing EXACTLY.
  // Its leg indices are [left-front, left-back, right-front, right-back].
  // Episode 02 previously generated [front-left, front-right, back-left,
  // back-right], linking diagonally opposite hips/paws and causing long
  // crossed legs or skating as the cats turned.
  const fore=i%2===0?-.18:.18;
  const lat=i<2?-HALF_WIDTH:HALF_WIDTH;
  const phase=cycle+(i===0||i===3?0:Math.PI);
  const move=moving?.085*stepIntensity*Math.sin(phase):0;
  const lift=moving?.045*stepIntensity*Math.max(0,Math.cos(phase)):0;
  const x=p[0]+dir[0]*(fore+move)+side[0]*lat;
  const z=p[2]+dir[2]*(fore+move)+side[2]*lat;
  const surface=Math.max(
   supportHeight([x,p[1],z],seed),
   p[1]-(moving?.03:0)
  );
  feet.push([x,surface+lift,z]);
  footKeys.push('ep02-'+i+((moving&&lift>.007)?':swing':':stance'));
 }
 const expr=pose.emotion;
 return {
  feet,footKeys,heading:dir,position:[...p] as V3,
  moving,travel,emotion:expr==='scared'?1:expr==='sad'?.5:0,
  pose:{
   walking:moving,gait:cycle,
   yaw:movingYaw,
   expression:expr,headTurn:pose.headTurn,gazeX:pose.headTurn,
   gazeY:pose.gazeY,
   headTilt:expr==='sad'?-.12:expr==='scared'?.09:expr==='concerned'?.13:expr==='happy'?-.035:0,
   breath:Math.sin(s.t*1.8+seed)*.25,
   tail:Math.sin(s.t*1.35+seed)*.26,
   blink:Math.max(0,1-Math.abs(((s.t+seed*.41)%3.1)-2.78)/.11)
  }
 };
}
export function createEpisode1CastCat(id:CatId){
 const card:Episode1Cat=createEpisodeCat(id);
 const shadow=contactShadow();
 shadow.mesh.name='episode02-'+id+'-episode01-ground-shadow';
 // BOX-REST ART: Composite only existing Episode 01 illustrated anatomy
 // (source tail, horizontal torso, head, forepaws) into one tucked silhouette.
 // A pitched full-height 1.52m upright billboard never becomes a curled cat;
 // it protrudes through the .48–.56m carton rim from raised cameras.
 // Episode 01 original rig/texture and walking animation remain unchanged.
 const restCanvas=document.createElement('canvas');
 restCanvas.width=1000;restCanvas.height=1100;
 const restContext=restCanvas.getContext('2d')!;
 const restTexture=new T.CanvasTexture(restCanvas);
 restTexture.colorSpace=T.SRGBColorSpace;restTexture.anisotropy=8;
 const renderRest=(time:number)=>{
  const src=card.texture.image as HTMLCanvasElement;
  const g=restContext;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,1000,1100);
  g.save();g.scale(2,2);
  // Rear body/haunch stretches along the *bottom* of its carton,
  // rather than standing above the flap as a flat vertical sticker.
  g.drawImage(src,276*2,284*2,125*2,180*2,286,326,111,123);
  const breathing=Math.sin(time*2.1);
  g.drawImage(src,145*2,270*2,243*2,205*2,
   131,329-4*breathing,272,116+5*breathing);
  // Original Episode 01 eyes, ear shapes, markings, muzzle and whiskers.
  // The face is lifted only enough to remain legible above the front rim.
  const breath=4.2*Math.sin(time*2.1+.22);
  g.drawImage(src,125*2,63*2,260*2,251*2,115,130+breath,267,211);
  // Both actual painted forepaws tuck below the chin, touching the bed
  // of the carton instead of extending out through its side walls.
  g.drawImage(src,172*2,383*2,166*2,103*2,
   178,402+1.6*Math.sin(time*1.9),155,65);
  g.restore();restTexture.needsUpdate=true;
 };
 const update=(pose:ActorPose,next:ActorPose,s:State,camera:T.PerspectiveCamera,behavior:CatBehavior|null=null)=>{
  // Using a neutral Episode 01 state avoids executing its *story-specific*
  // 'door at 11:11' expressions, nose pushes, timed scares or head drops
  // while retaining every Episode 01 asset/rig, shade and toe/contact system.
  const ep1:EpisodeState={...BASE,shot:DRAFT_SHOTS[0],frame:0,t:0,u:0,
   camera:camera.position.toArray() as V3,
   target:[...s.target] as V3};
  // Head and body are the actual Episode 01 artwork. Express contact
  // through a subtle feline nose/muzzle lean — NEVER an extended arm.
  const toward=behavior?new T.Vector3(
   behavior.target[0]-pose.position[0],0,
   behavior.target[2]-pose.position[2]):new T.Vector3();
  const dist=toward.length();
  const cameraForward=new T.Vector3(
   camera.position.x-pose.position[0],0,camera.position.z-pose.position[2]).normalize();
  const cameraRight=new T.Vector3(cameraForward.z,0,-cameraForward.x);
  const faceTurn=behavior&&dist>.01?
   Math.max(-.55,Math.min(.55,toward.dot(cameraRight)/dist*.42))*behavior.intensity:0;
  const actingPose:ActorPose=behavior?{
   ...pose,headTurn:pose.headTurn+faceTurn,
   gazeY:pose.gazeY-.28*behavior.intensity
  }:pose;
  const a=bridgeActor(id,actingPose,next,s);
  const n=s.shot.sequence;
  // A jumping cat must remain the FULL original Episode01 silhouette until
  // its paws actually land. The old unconditional shot-06 rest texture made
  // Latte appear as a giant detached head above an empty striped carton.
  // The same problem recurred at the final three-cat jump: none of the cats
  // ever switched to the supported tucked pose after landing.
  const finaleLanded=n===60&&(
    (id==='mocha'&&s.u>=.56)||
    (id==='essie'&&s.u>=.70)||
    (id==='latte'&&s.u>=.84));
  const restingInBox=(id==='latte'&&n===6&&s.u>=.70)||
    (id==='essie'&&(n===7||[19,35].includes(n)&&s.u>=.72||[37,38,39].includes(n)))||
    (id==='mocha'&&n===50)||finaleLanded;
  // In the rescue close-up he must remain tucked *inside* the same
  // physical carton. A standing 1.52m card cannot fit the 0.56m wall,
  // and jumping out before Essie reforms made the visual rule unclear.
  // Resting original art is built AFTER updateActor refreshes the source
  // image, and before the next draw; no duplicated mesh/crossfade.

  if(id==='essie'&&s.shot.sequence===35)
   a.pose.blink=Math.max(a.pose.blink??0,clamp((s.u-.49)/.38));
  if(behavior){
   a.pose.headTilt=(a.pose.headTilt??0)-.16*behavior.intensity;
   a.pose.blink=Math.max(a.pose.blink??0,
    behavior.mode==='muzzle-comfort'?.46*behavior.intensity:0);
  }
  card.updateActor(a,ep1);
  if(restingInBox)renderRest(s.t);
  const activeTexture=restingInBox?restTexture:card.texture;
  if(card.mesh.material.map!==activeTexture){
   card.mesh.material.map=activeTexture;
   card.mesh.material.needsUpdate=true;
  }
  if(behavior&&dist>.01){
   // Forepaws remain planted via the Episode01 walking rig; only the
   // chest/head image makes a tiny approach and lower-to-sniff gesture.
   const push=Math.min(.10,dist*.12)*behavior.intensity;
   toward.multiplyScalar(push/dist);
   card.mesh.position.add(toward);
   card.mesh.position.y-=.045*behavior.intensity;
  }
  const alpha=clamp(1-pose.morph);
  // Explicit limit: 02 still needs a purpose-built transformation. We do
  // NOT scale/stretch the approved Episode 01 artwork into a fake box.
  card.mesh.visible=pose.visible&&alpha>.08;
  // Transformation must VISIBLY advance from original living feline art into
  // the SAME cardboard box, rather than remaining an inert front-facing card
  // until an abrupt hide. This deforms ONLY Episode 02's actor instance.
  // No replacement silhouette, limbs, or change to the Episode 01 asset.
  const fold=clamp((pose.morph-.38)/.60);
  const paper=fold*fold*(3-2*fold);
  card.mesh.scale.set(
   pose.scale*(1-.08*paper),
   pose.scale*(1-.30*paper),
   pose.scale
  );
  // The original illustrated cat stands about 1.52m tall, while the real
  // carton wall is only ~0.5m. The rest-only artwork reuses Episode01's
  // head, torso and paws but must occupy a compact, physically supported
  // vertical silhouette. Do NOT scale the jumping/walking cat this way.
  if(restingInBox)card.mesh.scale.y*=.57;
  // The paper edges settle toward the inside; preserve above-floor visibility
  // while it shrinks. Clipping and perceived fold quality still need real frames.
  card.mesh.position.y+=.045*paper;
  // The approved Episode 01 figures are upright illustrated cards. From
  // high box angles they collapse to narrow, upright faces instead of reading
  // as a cat curled on its side. Recline ONLY the resting box poses, retaining
  // the original silhouette/artwork, measured scale and ground contact.
  // Rest composition already curls the SAME Episode01 art in its painted
  // canvas. Do not apply a second -0.38 pitch that turns the face edge-on,
  // makes the paws hover and changes apparent size with camera height.
  card.mesh.rotation.x=(restingInBox?-.08:0)-.18*paper;
  if(restingInBox){
   // Real box floors at y=.044; leave ~1cm above the cardboard bottom.
   // Keep painted head/eyes above the front rim without scaling a full
   // 1.52m cat down into a miniature.
   card.mesh.position.y=Math.max(card.mesh.position.y,.13);
  }
  // Preserve the recognisable Episode 01 face and markings until the FINAL
  // fold. The previous aggressive pitch/alpha produced a melted pancake in
  // actual moving shot 38 (44146167639), not a readable paper transformation.
  const finalFade=clamp((pose.morph-.70)/.30);
  card.mesh.material.transparent=finalFade>.01;
  card.mesh.material.depthWrite=finalFade<=.01;
  card.mesh.material.opacity=1-.38*finalFade;
  // Feline crouch, nose-led airborne lean and compact body during the leap.
  // Never add a human arm or replace the approved illustrated cat asset.
  const hop=n===59?clamp((s.u-.24)/.50):s.u;
  const airborne=id==='mocha'&&[49,50,59].includes(n)?
   Math.sin(Math.PI*hop):0;
  const crouch=id==='mocha'&&n===59?
   Math.sin(Math.PI*clamp((s.u-.04)/.20)):0;
  card.mesh.rotation.z=(n===50?.22:-.34)*airborne;
  card.mesh.scale.x*=1+.10*airborne;
  card.mesh.scale.y*=1-.12*airborne-.10*crouch;
  card.legs.visible=card.mesh.visible&&a.moving;
  shadow.mesh.visible=card.mesh.visible;
  const supportY=supportHeight(pose.position,id==='latte'?0:id==='mocha'?1:2)+.008;
  const insideBox=(id==='mocha'&&(n===50||n===60||(n===59&&s.u>.75)))||
   (id==='essie'&&[7,19,35,37,38,39,50,59,60].includes(n))||
   (id==='latte'&&[6,55,59,60].includes(n));
  shadow.mesh.position.set(
   pose.position[0],insideBox?Math.max(supportY,.055):supportY,
   pose.position[2]);
  shadow.mesh.scale.setScalar(pose.scale);
 };
 const dispose=()=>{card.dispose();shadow.dispose();restTexture.dispose();};
 return {id,card,shadow,update,dispose};
}
