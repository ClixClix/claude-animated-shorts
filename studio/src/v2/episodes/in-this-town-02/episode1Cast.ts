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
 id:CatId,pose:ActorPose,prior:ActorPose,next:ActorPose,s:State,
 actualCamera:[number,number,number]
):Actor{
 const p=pose.position;
 const delta=vec(next.position[0]-prior.position[0],0,next.position[2]-prior.position[2]);
 const length=Math.hypot(delta[0],delta[2]);
 // Do not flicker the paw rig off during near-zero frame differences.
 // Animation presence is authored explicitly by the episode timeline.
 const moving=pose.walking&&!([49,50,51].includes(s.shot.sequence)&&s.u>.80);
 const dir:V3=length>.0003?vec(delta[0]/length,0,delta[2]/length):
   (s.shot.sequence===4?[-1,0,0]:[1,0,0]);
 const side:V3=[-dir[2],0,dir[0]];
 const seed=id==='latte'?0:id==='mocha'?1:2;
 // Tie foot cycles to actual travel in the 2-second Shot 05 avoidance:
 // previously the paws kept cycling at constant 2.6Hz while the body
 // eased to a stop, creating visible skating and treadmill motion.
 const travel=s.t*([4,5,27,36,53].includes(s.shot.sequence)?.68:.44); // 1.4 Hz deliberate footfalls; no rapid vibration.
 const cycle=travel/.32*Math.PI*2;
 const stepIntensity=moving?.65*clamp(length/.20):0; // Fade toward a planted stance as Mocha pauses; no flickering rig.
 const camOffset=vec(actualCamera[0]-p[0],0,actualCamera[2]-p[2]);
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
  const move=moving?.055*stepIntensity*Math.sin(phase):0;
  const lift=moving?.030*stepIntensity*Math.max(0,Math.cos(phase)):0;
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
   // Almost-still when resting: no oscillator competing with the box pose.
   breath:Math.sin(s.t*.85+seed)*(id==='mocha'?.055:.12),
   tail:Math.sin(s.t*.90+seed)*(id==='mocha'?.08:.13),
   blink:pose.sleeping?1:Math.max(0,1-Math.abs(((s.t+seed*.41)%3.1)-2.78)/.11)
  }
 };
}
export function createEpisode1CastCat(id:CatId){
 const card:Episode1Cat=createEpisodeCat(id);
 const shadow=contactShadow();
 const earReveal=new T.Plane(new T.Vector3(0,1,0),0);
 shadow.mesh.name='episode02-'+id+'-episode01-ground-shadow';
 // Living/resting cats always retain the original Episode 01 texture.
 const update=(pose:ActorPose,prior:ActorPose,next:ActorPose,s:State,camera:T.PerspectiveCamera,behavior:CatBehavior|null=null)=>{
  // Using a neutral Episode 01 state avoids executing its *story-specific*
  // 'door at 11:11' expressions, nose pushes, timed scares or head drops
  // while retaining every Episode 01 asset/rig, shade and toe/contact system.
  const ep1:EpisodeState={...BASE,shot:DRAFT_SHOTS[0],frame:0,t:0,u:0,
   camera:camera.position.toArray() as V3,
   // Match the camera that actually renders, not the unused scratch storyboard.
   target:camera.position.clone().add(camera.getWorldDirection(new T.Vector3()).multiplyScalar(3)).toArray() as V3};
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
  const a=bridgeActor(id,actingPose,prior,next,s,camera.position.toArray() as [number,number,number]);
  const n=s.shot.sequence;
  const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
  if(id==='essie'&&s.shot.sequence===35)
   a.pose.blink=Math.max(a.pose.blink??0,clamp((s.u-.49)/.38));
  if(behavior){
   a.pose.headTilt=(a.pose.headTilt??0)-.16*behavior.intensity;
   a.pose.blink=Math.max(a.pose.blink??0,
    behavior.mode==='muzzle-comfort'?.46*behavior.intensity:0);
  }
  card.updateActor(a,ep1);
  if(card.mesh.material.map!==card.texture){
   card.mesh.material.map=card.texture;
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
  card.mesh.position.y+=.045*paper;
  card.mesh.rotation.x=(pose.lean??0)-.18*paper;
  // Preserve the recognisable Episode 01 face and markings until the FINAL
  // fold. The previous aggressive pitch/alpha produced a melted pancake in
  // actual moving shot 38 (44146167639), not a readable paper transformation.
  const finalFade=clamp((pose.morph-.70)/.30);
  card.mesh.material.transparent=finalFade>.01;
  card.mesh.material.depthWrite=finalFade<=.01;
  card.mesh.material.opacity=1-.38*finalFade;
  // Restrained contact lean; living artwork has no per-shot size modifier.
  const cuddle=[51,52].includes(n)?(n===52?1:smooth((s.u-.85)/.13)):0;
  card.mesh.rotation.z=(id==='mocha'?-.07:id==='essie'?.07:0)*cuddle;
  if(id==='essie'&&n===50){
   earReveal.constant=-(.98-.93*smooth((s.u-.58)/.36));
   if(!card.mesh.material.clippingPlanes?.length){card.mesh.material.clippingPlanes=[earReveal];card.mesh.material.needsUpdate=true;}
  }else if(card.mesh.material.clippingPlanes?.length){card.mesh.material.clippingPlanes=[];card.mesh.material.needsUpdate=true;}
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
 const dispose=()=>{card.dispose();shadow.dispose();};
 return {id,card,shadow,update,dispose};
}
