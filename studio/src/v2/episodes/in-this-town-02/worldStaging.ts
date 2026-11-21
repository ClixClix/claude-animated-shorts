import type {EpisodeWorld} from '../door-at-1111-polish/world';
import type {State} from './timeline';
import {ease} from './timeline';

/** Exact episode-only occluder/door policy, shared with numerical ray QA. */
export function stageEpisodeWorld(world:EpisodeWorld,s:State,n=s.story?.displayBeat??s.shot.sequence){
 // Open the existing hinged door fully against the wall for the return
 // sprint, rather than letting its leaf cut through Mocha and Essie.
 // In shot 24 the physical Episode 01 café door swings from OPEN to CLOSED
  // only after Mocha reaches its nose plate. A stationary CLOSED sign is not
  // the action; leave the original hinged leaf and frame intact.
  const closingDoor=n===24?ease((s.u-.43)/.44):0;
  world.door.rotation.y=n===24?-1.10*(1-closingDoor):n===27?-1.18:n>=53?-Math.PI/2:0;
 // Shot 27 is the actual Episode01 HOUSE exit, not the cafe door. The
 // inherited Episode01 frame-zero house door was shut while Mocha ran
 // through its opaque leaf. Open only during the house entrance/exit beats.
 world.homeDoor.rotation.y=(n===25||n===27)?-Math.PI/2:0;
 // The return shot tracks through the already-open entrance. Mask only
 // its swung-open leaf, which still cut across both cats in real 540p footage.
 world.door.visible=true;
 if(s.story?.cafeDoor!==undefined)world.door.rotation.y=s.story.cafeDoor;
 if(s.story?.houseDoor!==undefined)world.homeDoor.rotation.y=s.story.houseDoor;
 // Shot 29 is already past the shelter, looking back toward the market.
 // The Episode01 bus-stop glass and poles otherwise occupy almost the
 // entire frame and erase Mocha for 30+ actual decoded frames. Preserve
 // the real shelter in establishing shot 28; exclude it from this cut.
 const shelter=world.props.get('bus-stop');
 if(shelter)shelter.visible=s.shot.sequence!==29;
 // The remaining dark pole in real shot29 (frames 1764–1817) is NOT the
 // shelter: it is Episode01's original lamp at x=-6,z=6.05. Those lamp
 // pieces are direct night-town children, not a named streetlight group.
 // Mask only this one foreground lamp during the walking cut; retain the
 // approved fixture everywhere else, including the shot28 establishing view.
 const nightTown=world.cafe.root.getObjectByName('night-town');
 for(const part of nightTown?.children??[]){
  if(Math.abs(part.position.x+6)<.01&&Math.abs(part.position.z-6.05)<.01)
   part.visible=n!==29;
 }
 // Episode01 streetlight-3 stands at x=0,z=6.05, physically inside the
 // Episode02 cure board at x=.1,z=6.1. Actual full-render shot 57 showed
 // its pole slicing through the instruction text and Essie's face; shot 56
 // also lost a lead silhouette behind it. Mask only these announcement cuts.
 // This does not modify the approved Episode01 lamp source or other shots.
 const announcementLamp=world.root.getObjectByName('streetlight-3');
 if(announcementLamp)announcementLamp.visible=![4,5,56,57,58].includes(n); // episode02-announcement-lamp
 // Episode01's permanent plant is retained everywhere except the close-up
 // jump/cuddle, where real 25-frame cloud QA proved its leaves block Mocha.
 // Cinematic foreground masking changes shot visibility, not original assets.
 const foregroundPlant=world.cafe.fixtures.get('entrance-plant');
 if(foregroundPlant)foregroundPlant.visible=!(s.shot.sequence>=58&&s.shot.sequence<=60);
 // V8: With batching disabled, masking these source fixtures now truly works.
 // Foreground chair/table intruded across Essie and Mocha in V5 07A/B.
 // As with Episode01 shot masking, only remove camera-blocking foreground
 // furniture for these two close-ups; other café shots remain untouched.
 for(const id of ['chair-front-west','chair-front-east','table-window-front','window-table-mug-front']){
  const fixture=world.cafe.fixtures.get(id);
  if(fixture)fixture.visible=n!==7;
 }
 // episode02-house-visible: restore Episode 01's exact house for Mocha's search.
 const atHouse=n===25||n===26;
 for(const id of ['latte-home','home-interior-finish','home-low-bookcase',
   'latte-cat-bed','home-food','home-water','home-moonlight']){
  const item=world.root.getObjectByName(id);if(item)item.visible=atHouse;
 }

 const wrap=(x:number,span:number)=>((x%span)+span)%span;
 // Reuse ORIGINAL Episode 01 car meshes throughout the connected district.
 // Their prior fixed t=0 update froze them in place in Episode 02.
 // Main-road lanes are at z=7.45 and z=9.45, clear of cat sidewalks.
 const roadLife=n<=3||n===8||n===28||n===56||n===57; // No foreground car masking Mocha in shot 58.
 for(let i=0;i<2;i++){
  const car=world.root.getObjectByName('passing-car-'+i);
  if(!car)continue;
  car.visible=roadLife;
  const x=i===0?-18+wrap(s.t*1.9,36):18-wrap(s.t*1.65+9,36);
  car.position.set(x,.03,i===0?9.45:7.45);
  car.rotation.y=i===0?Math.PI:0;
 }
 for(let i=0;i<6;i++){
  const car=world.root.getObjectByName('district-moving-car-'+i);
  if(!car)continue;
  car.visible=roadLife;
  const lane=[18,30,42,-18,-30,-42][i];
  const z=-68+wrap(s.t*(1.65+i*.12)+i*19,136);
  car.position.set(lane,.03,z);
  car.rotation.y=Math.PI/2;
 }
}
