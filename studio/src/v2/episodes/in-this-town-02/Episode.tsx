import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {AbsoluteFill,Composition,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction,BloomEffect,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {InkPass,NOINK} from '../../../videos/bridge/ink';
import {GradeEffect} from '../../../videos/bridge/grade';
import {EPISODE1_STYLE} from '../../series/episode1Style';
import type {V3} from '../../cafe/config';
import {createKitten} from '../../animation/kitten';
import {storyAt as kittenStoryAt} from '../../animation/timeline';
import {TownPopulation} from '../door-at-1111-polish/population';
import {createEpisode1CastCat} from './episode1Cast';
import {createCurledSourceKitten} from './ruleCats';
import {LensBlur} from '../../../videos/bridge/lensblur';
import {CHAR} from '../../../videos/bridge/shade';
import {CARD_K} from '../../../videos/bridge/cardshade';
import {EpisodeWorld} from '../door-at-1111-polish/world';
import {catBehaviorFor} from './catBehaviors';
import {stateAt as previousEpisodeState,DRAFT_SHOTS} from '../door-at-1111-polish/timeline';
import {createEpisodeBox} from './boxProps';
import {directEpisodeCamera} from './cameraDirector';
import {SCRATCH_EDIT,stateAt,clamp,ease,type EpisodeEdit,type ActorPose,type State} from './timeline';

export type BoxEpisodeProps=EpisodeEdit&{previewScale?:number;optimize?:boolean;audioApproved?:boolean};

/** All three principal cats now come directly from the APPROVED Episode 01 createEpisodeCat rig.
 * See episode1Cast.ts. No new lead silhouettes or custom card shaders exist here.
 */
/** Separate episode-only narrative props; never alter permanent café fixtures. */
function createStoryProps(){
 const root=new T.Group();root.name='episode02-story-props';
 const geometries:T.BufferGeometry[]=[];
 const materials:T.Material[]=[];
 const textures:T.Texture[]=[];
 const board=new T.Group();board.name='episode02-town-cure-instructions';
 board.position.set(.1,0,6.1);
 const surface=document.createElement('canvas');surface.width=1024;surface.height=640;
 const g=surface.getContext('2d')!;
 g.fillStyle='#f7e8c5';g.fillRect(0,0,1024,640);
 g.strokeStyle='#4b5e65';g.lineWidth=32;g.strokeRect(18,18,988,604);
 g.textAlign='center';g.fillStyle='#253d4d';g.font='bold 74px Arial';g.fillText('HOW TO HELP',512,110);
 g.font='bold 54px Arial';g.fillText('TURN A BOX BACK INTO A CAT',512,176);
 const iconCat=(x:number,y:number,color:string)=>{
  g.fillStyle=color;g.beginPath();g.ellipse(x,y,61,66,0,0,Math.PI*2);g.fill();
  g.beginPath();g.moveTo(x-57,y-31);g.lineTo(x-56,y-105);g.lineTo(x-10,y-65);
  g.lineTo(x+10,y-65);g.lineTo(x+55,y-106);g.lineTo(x+57,y-31);g.closePath();g.fill();
  g.fillStyle='#f9e8cd';g.beginPath();g.arc(x-20,y-3,6,0,Math.PI*2);g.arc(x+20,y-3,6,0,Math.PI*2);g.fill();
 };
 const iconBox=(x:number,y:number)=>{
  g.fillStyle='#b98d62';g.fillRect(x-87,y-55,174,126);
  g.strokeStyle='#453d3f';g.lineWidth=7;g.strokeRect(x-87,y-55,174,126);
  g.beginPath();g.moveTo(x-87,y-55);g.lineTo(x-112,y-90);g.lineTo(x+95,y-90);g.lineTo(x+87,y-55);g.closePath();g.stroke();
 };
 iconBox(206,364);iconCat(206,335,'#777e8a');
 iconBox(514,364);iconCat(507,320,'#d0b8a8');iconCat(548,356,'#5b646d');
 iconCat(818,328,'#777e8a');iconCat(876,365,'#d0b8a8');
 g.fillStyle='#bd7656';g.font='bold 94px Arial';g.fillText('→',360,376);g.fillText('→',668,376);
 g.fillStyle='#253d4d';g.font='bold 46px Arial';
 g.fillText('BOXED',206,530);g.fillText('JOIN THEM',518,530);g.fillText('TOGETHER',847,530);
 const texture=new T.CanvasTexture(surface);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);
 const boardMat=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});materials.push(boardMat);
 const boardGeom=new T.PlaneGeometry(3.15,1.95);geometries.push(boardGeom);
 const panel=new T.Mesh(boardGeom,boardMat);panel.name='episode02-cure-visual-panel';
 panel.position.set(0,2.0,0);panel.layers.set(NOINK);board.add(panel);
 const standMaterial=new T.MeshStandardMaterial({color:'#58635e',roughness:.8});materials.push(standMaterial);
 for(const x of [-1.25,1.25]){
  const geo=new T.BoxGeometry(.09,1.35,.12);geometries.push(geo);
  const stand=new T.Mesh(geo,standMaterial);stand.position.set(x,.70,-.08);board.add(stand);
 }
 root.add(board);

 const sign=new T.Group();sign.name='episode02-closed-sign';
 sign.position.set(2.25,2.15,3.65);sign.rotation.y=Math.PI;
 const signCanvas=document.createElement('canvas');signCanvas.width=560;signCanvas.height=240;
 const sc=signCanvas.getContext('2d')!;
 sc.fillStyle='#355961';sc.fillRect(0,0,560,240);sc.strokeStyle='#e0c38d';sc.lineWidth=22;sc.strokeRect(12,12,536,216);
 sc.font='bold 116px Arial';sc.textAlign='center';sc.textBaseline='middle';sc.fillStyle='#fbefd5';sc.fillText('CLOSED',280,124);
 const st=new T.CanvasTexture(signCanvas);st.colorSpace=T.SRGBColorSpace;textures.push(st);
 const sm=new T.MeshBasicMaterial({map:st,side:T.DoubleSide});materials.push(sm);
 const sg=new T.PlaneGeometry(.68,.29);geometries.push(sg);
 const signMesh=new T.Mesh(sg,sm);signMesh.layers.set(NOINK);sign.add(signMesh);root.add(sign);

 const treat=new T.Group();treat.name='episode02-latte-fish-treat';
 treat.position.set(-1.85,0,2.73);
 const plateMat=new T.MeshStandardMaterial({color:'#d4cdb3',roughness:.85});materials.push(plateMat);
 const plateGeo=new T.CylinderGeometry(.22,.22,.035,18);geometries.push(plateGeo);
 const plate=new T.Mesh(plateGeo,plateMat);plate.position.y=.025;treat.add(plate);
 const crumbMat=new T.MeshStandardMaterial({color:'#b57f56',roughness:.9});materials.push(crumbMat);
 for(let i=0;i<5;i++){const geo=new T.SphereGeometry(.045,7,5);geometries.push(geo);
  const piece=new T.Mesh(geo,crumbMat);piece.position.set(Math.cos(i*2.4)*.10,.07,Math.sin(i*2.4)*.10);treat.add(piece);}
 root.add(treat);
 return {root,board,sign,treat,dispose:()=>{root.removeFromParent();for(const geo of geometries)geo.dispose();
  for(const mat of materials)mat.dispose();for(const tex of textures)tex.dispose();}};
}

const Inner:React.FC<BoxEpisodeProps>=({shots,previewScale=1,optimize=true})=>{
 const frame=useCurrentFrame(),s=stateAt(frame,shots),{scene,camera,gl}=useThree();
 const n=s.shot.sequence;
 const world=useMemo(()=>{
  // Reuse the actual complete Episode 01 city/café geometry. No second café instance.
  const w=new EpisodeWorld(optimize);
  const stable=previousEpisodeState(0,DRAFT_SHOTS);
  w.update(stable);
  // Preserve Episode 01's established café geometry AND original alley
  // dumpster, service details and storage for the Episode 02 search scenes.
  // Reuse existing streetlights and shelter, but shot cameras must avoid them.
  // We only suppress assets tied to Episode 01's unrelated story scenes.
  // Disable ONLY props belonging to Episode 01's clock/shelter/kitten plot.
  // Leaving them alive inside Episode 02 causes unrelated giant landmarks and
  // physical clutter to block already-narrow portrait compositions.
  for(const n of ['chased-mouse','home-blanket','blanket','fresh-water-bowl',
    'last-bus','latte-hiding-box','welcome-sign','alley-motion',
    'opening-setting-sun','rain-outside-only','door-open-plaque',
    'episode-clock','city-clock-tower','backup-lantern','latte-home',
    'home-interior-finish','home-low-bookcase',
    'home-cat-tower','latte-cat-bed',
    'home-food','home-water','home-moonlight'])
      w.root.getObjectByName(n)?.traverse(o=>{o.visible=false;});
  // No attempt to modify the original source files or cache.
  return w;
 },[optimize]);
 const boxes=useMemo(()=>({
  latte:createEpisodeBox('latte'),essie:createEpisodeBox('essie'),shared:createEpisodeBox('shared'),
  demo:createEpisodeBox('demo')
 }),[]);
 boxes.demo.root.name='EPISODE02_RULE_DEMO_BOX';
 const characters=useMemo(()=>({
  mocha:createEpisode1CastCat('mocha'),
  essie:createEpisode1CastCat('essie'),
  latte:createEpisode1CastCat('latte')
 }),[]);
 // The *anonymous* demonstration uses Episode 01's actual kitten animation
 // rather than recoloring Essie or inventing another paper-puppet cat.
 const demoKitten=useMemo(()=>createKitten(),[]);
 // The approved opening keeps its original kitten unchanged. The box close-ups
 // use an original-ink curled counterpart with the same coat and eye palette.
 const curledKitten=useMemo(()=>createCurledSourceKitten(
  (demoKitten.mesh.material as T.MeshLambertMaterial).map!
 ),[demoKitten]);
 // Exactly the existing Episode 01 supporting cats, as background guests only.
 const townspeople=useMemo(()=>new TownPopulation(),[]);
 // No detached forelimb/hand rigs. Cats interact with boxes using their
 // original Episode 01 heads, noses, mouths and natural planted paws.
 const dust=useMemo(()=>{
  const root=new T.Group();root.name='episode02-cardboard-magical-fold';
  const arr=Array.from({length:22},(_,i)=>{
   const geo=new T.PlaneGeometry(.08+(i%4)*.015,.055+(i%3)*.015);
   const mat=new T.MeshBasicMaterial({color:i%3===0?'#f6dc99':'#d1a36f',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});
   const mesh=new T.Mesh(geo,mat);mesh.layers.set(NOINK);mesh.rotation.z=i*.48;root.add(mesh);return{mesh,geo,mat};
  });return {root,arr};
 },[]);
 const props=useMemo(()=>createStoryProps(),[]);
 const atmosphere=useMemo(()=>{
  const sun=new T.DirectionalLight('#fff0d0',2.5);
  sun.position.set(-14,28,18);sun.name='episode02-morning-sun';
  const night=new T.PointLight('#f8c98b',22,9,2);
  night.name='episode02-alley-key';night.position.set(-8.7,3.1,1.8);
  return {root:new T.Group(),sun,night};
 },[]);
 const effects=useMemo(()=>({
  ink:new InkPass(scene,camera as T.PerspectiveCamera,
    {...EPISODE1_STYLE.ink,widthNear:EPISODE1_STYLE.ink.widthNear*previewScale,
     widthFar:EPISODE1_STYLE.ink.widthFar*previewScale}),
  bloom:new BloomEffect({blendFunction:BlendFunction.ADD,...EPISODE1_STYLE.bloom}),
  tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),
  grade:new GradeEffect(EPISODE1_STYLE.grade,.7),
  lens:new LensBlur({...EPISODE1_STYLE.lens})
 }),[scene,camera,previewScale]);
 atmosphere.root.add(atmosphere.sun,atmosphere.night);
 const cam=camera as T.PerspectiveCamera;
 // Central 9:16-safe director. Per-shot arbitrary coordinates were originally
 // framed for a much wider field and placed several alley cameras inside the
 // west-side shop, producing extreme crop and solid-wall occlusion.
 const directed=directEpisodeCamera(s);
 cam.position.set(...directed.camera);
 cam.fov=directed.fov;cam.near=.08;cam.far=320;
 cam.lookAt(...directed.target);cam.updateProjectionMatrix();cam.updateMatrixWorld();
 cam.layers.enable(NOINK);
 effects.lens.focus=new T.Vector3(...directed.target).sub(cam.position).dot(cam.getWorldDirection(new T.Vector3()));
 effects.lens.cInf=s.blur;
 // New daytime palette is story-specific; night reuses Episode 01's exact base.
 scene.background=new T.Color(s.daylight?'#9dbec7':EPISODE1_STYLE.nightBackground);
 scene.fog=new T.Fog(scene.background.clone(),44,245);
 gl.shadowMap.type=T.PCFSoftShadowMap;
 gl.localClippingEnabled=true;
 atmosphere.sun.intensity=s.daylight?2.9:.3;
 atmosphere.night.intensity=s.room==='alley'?26:s.daylight?0:9;
 CHAR.uCharTint.value.set(...EPISODE1_STYLE.character.tint);
 CHAR.uCharShade.value=EPISODE1_STYLE.character.shade;
 CHAR.uGrad.value=EPISODE1_STYLE.character.gradient;
 CHAR.uBodyGrad.value=EPISODE1_STYLE.character.bodyGradient;
 CHAR.uSideTint.value.set(...EPISODE1_STYLE.character.sideTint);
 CARD_K.uPx.value=previewScale;
 // Open the existing hinged door fully against the wall for the return
 // sprint, rather than letting its leaf cut through Mocha and Essie.
 world.door.rotation.y=s.shot.sequence===24?-.3:s.shot.sequence===27?-1.18:s.shot.sequence>=53?-Math.PI/2:0;
 // The return shot tracks through the already-open entrance. Mask only
 // its swung-open leaf, which still cut across both cats in real 540p footage.
 world.door.visible=s.shot.sequence!==53;
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
 if(announcementLamp)announcementLamp.visible=!(n===56||n===57); // episode02-announcement-lamp
 // Episode01's permanent plant is retained everywhere except the close-up
 // jump/cuddle, where real 25-frame cloud QA proved its leaves block Mocha.
 // Cinematic foreground masking changes shot visibility, not original assets.
 const foregroundPlant=world.cafe.fixtures.get('entrance-plant');
 if(foregroundPlant)foregroundPlant.visible=!(s.shot.sequence>=58&&s.shot.sequence<=60);
 const boxArray=[
  {key:'latte',obj:boxes.latte,pos:s.latteBox,visible:s.show.latte,flap:s.flap.latte},
  {key:'essie',obj:boxes.essie,pos:s.essieBox,visible:s.show.essie,flap:s.flap.essie},
  {key:'shared',obj:boxes.shared,pos:s.sharedBox,visible:s.show.shared,flap:s.flap.shared},
  {key:'demo',obj:boxes.demo,pos:s.demoBox,visible:s.show.demo,flap:s.flap.demo},
 ] as const;
 for(const b of boxArray){b.obj.root.position.set(...b.pos);b.obj.root.visible=b.visible;b.obj.setOpenAmount(b.flap);}
 // Shot 02: tiny side flap reaction when the living kitten resettles.
 // Keep the same carton and clear face; never lift a wall into the lens.
 if(n===2){
  const wobble=Math.sin(Math.PI*s.u)*Math.sin(2*Math.PI*s.u);
  boxes.demo.flaps.right.rotation.z-=.065*wobble;
 }
 // The striped box must twitch visibly in shot 10, not remain frozen.
 if(s.shot.sequence===10){
  const twitch=ease((s.u-.46)/.12)*(1-ease((s.u-.60)/.15));
  boxes.latte.flaps.front.rotation.x+=.30*twitch;
 }
 // Mocha nudges two REAL flaps sequentially while his original Episode01
 // muzzle approaches the rim; no human-like paws or floating flap opening.
 if(s.shot.sequence===12){
  const first=ease((s.u-.18)/.30),second=ease((s.u-.55)/.30);
  const angle=Math.PI*.92;
  boxes.latte.flaps.front.rotation.x=angle*(.80+.17*first);
  boxes.latte.flaps.left.rotation.z=angle*(.80+.17*second);
 }
  // The shared box's left flap folds DOWN along the outside wall, rather
  // than extending into Mocha's hesitant approach and masking his face.
  // Keep the same physical flap and original Episode01 scene assets.
  if(s.shot.sequence>=58&&s.shot.sequence<=60)
   boxes.shared.flaps.left.rotation.z=1.5*Math.PI;
 // Drive the EXACT Episode 01 actor/cards from Episode 02's approved story
 // timing. Their silhouettes, whiskers, tail and separate foot drawings never
 // get replaced by the failed Episode 02 "oval body / stick legs" renderer.
 // Keep forward gait/foot-heading sampling inside THIS shot. Reading the next
 // shot on its preceding final frame can flip Episode01 paw directions once.
 const next=stateAt(Math.min(frame+1,s.shot.end-1),shots);
 characters.mocha.update(s.mocha,next.mocha,s,cam,catBehaviorFor(s,'mocha'));
 characters.essie.update(s.essie,next.essie,s,cam,catBehaviorFor(s,'essie'));
 characters.latte.update(s.latte,next.latte,s,cam,catBehaviorFor(s,'latte'));
 const kittenState={
  ...kittenStoryAt(0),
  frame:s.frame,
  // Do not inherit Episode01 shot-1 world-space foot targets in the box demo;
  // they projected as giant diagonal legs over the kitten's face.
  shot:2 as const,
  camera:directed.camera,target:directed.target,
  kitten:[...s.demoCat.position] as V3,
  kittenFear:s.demoCat.emotion==='scared'?1:0,
  kittenSmile:s.demoCat.emotion==='happy'?1:0,
  kittenLook:s.demoCat.headTurn,
  kittenWalking:s.demoCat.walking?1:0,
  kittenGait:s.t*7,kittenLift:0,
  kittenBlink:n===2?Math.max(0,1-Math.abs(s.u-.64)/.20):0
 };
 demoKitten.update(kittenState,s.frame);
 demoKitten.mesh.visible=s.demoCat.visible&&s.demoCat.morph<.95&&n!==2&&n!==3;
 demoKitten.mesh.position.set(...s.demoCat.position);
 // Physical paper-fold acting in shot 03: hold the actual Episode01 kitten
 // visibly above the rim first, then fold/sink into its ONE persistent box.
 // Earlier movie showed only ears disappearing with no readable cause.
 const demoFold=n===3?s.demoCat.morph:0;
 demoKitten.mesh.scale.set(.95*(1-.12*demoFold),
  .95*(1-.50*demoFold),.95);
 if(n===3)demoKitten.mesh.position.y-=.12*demoFold;
 // The rule-cat remains the approved illustrated kitten, not a substitute
 // 3-D toy. Gently recline its real card inside the physical box so the
 // raised shot-02 angle sees a supported body/face rather than an edge-on slab.
 demoKitten.mesh.rotation.x=n===3?-.42-.26*demoFold:n===2?-.42:0;
 demoKitten.mesh.rotation.y=Math.atan2(cam.position.x-s.demoCat.position[0],
  cam.position.z-s.demoCat.position[2]);
 // Actual 21-frame proof showed a tiny upright kitten throughout Shot 02.
 // Reuse the approved illustration technique, now with a horizontal curled
 // torso, resting paws and a lifted recognizable face inside SAME box.
 curledKitten.mesh.visible=n===2||n===3;
 if(curledKitten.mesh.visible){
  const fold=n===3?s.demoCat.morph:0;
  curledKitten.update(s.t,{pose:'curled',expression:n===3?'scared':'neutral',
   progress:n===2?.14+.23*ease(s.u):.35+.40*fold,
   // Real 21-frame action: breathing, blink, head and ear adjustment,
   // distinct tail curl and paw settle; source art stays identical to Shot 1.
   beat:n===2?s.u:0,
   morph:fold});
  // The physical carton stays .88 × .77 metres: increase kitten occupancy,
  // not box size. Use the same starting scale in Shot 03 for continuity.
  const breath=n===2?Math.sin(Math.PI*s.u):0;
  curledKitten.mesh.position.set(s.demoBox[0],.057+.007*breath-.10*fold,s.demoBox[2]);
  curledKitten.mesh.rotation.y=Math.atan2(cam.position.x-s.demoBox[0],
   cam.position.z-s.demoBox[2]);
  curledKitten.mesh.rotation.x=-.28;
  curledKitten.mesh.scale.setScalar(1.40*(1-.36*fold));
 }
 // Episode 01's background supporting-cat asset set. Do not promote their
 // simplified drawings to close-up leading actors; keep them as background.
 // Episode 01's supporting-cast art is unchanged, but Episode 02 must
 // advance its clock. Previously every guest was drawn at frame zero and
 // the entire city appeared abandoned except for three announcement shots.
 const ep1CrowdState={...previousEpisodeState(0,DRAFT_SHOTS),
  frame:s.frame,t:s.t,camera:directed.camera,target:directed.target};
 townspeople.update(ep1CrowdState);
 const outsideBusy=n<=5||n===8||n===56||n===57;
 // Preserve daytime patrons in wide shots; the foreground guest in 11/14
 // otherwise covers half of Mocha's face in the real tight reaction frames.
 const cafeBusy=n>=6&&n<=23&&n!==11&&n!==14;
 const audienceOn=n===4||n===56||n===57;
 // Deterministic sidewalk motion, not random positions on each render frame.
 // Keep everyone off the road and away from the hero's box contact.
 const wrap=(x:number,span:number)=>((x%span)+span)%span;
 const walkA=-6+wrap(s.t*.43,11);
 const walkB=6-wrap(s.t*.31,10);
 const announcementTime=Math.max(0,(s.frame-3483)/30);
 const streetSpots:V3[]=audienceOn?
  (n===4?[[.55,.03,6.45],[2.9,.03,6.2],[3.8,.03,6.75]]:
   // Daytime cure announcement: shoppers walk near shops, not through the
   // sign or the three leads. Night alley shots retain NO crowd.
   [[-2.15+.11*announcementTime,.03,5.55],
    [3.95-.10*announcementTime,.03,5.60],
    [-3.30+.08*announcementTime,.03,5.55]]):
  [[walkA,.03,5.02],[walkB,.03,5.02],[-6.4,.03,12.55]];
 // One standing café patron walks the clear right-side aisle while two
 // others remain seated. The aisle x=3.15 clears the chair/table footprints
 // ending at x≈2.65; its travel stays inside the x=4 café wall.
 const cafeAisleZ=-1.25+1.20*(1+Math.sin(s.t*.29));
 const spots:V3[]=outsideBusy?
   (audienceOn?streetSpots:
    [...streetSpots,[walkA-1.2,.03,12.55],[walkB+.7,.03,12.55]]):
   cafeBusy?[[2.38,.51,-2.14],[.96,.51,2.13],[3.15,.03,cafeAisleZ]]:[];
 townspeople.root.visible=spots.length>0;
 townspeople.actors.forEach((c,i)=>{
  const isGuest=i<spots.length;c.mesh.visible=isGuest;
  // Each Episode 01 extra is paired with its own shadow directly after
  // its mesh in TownPopulation.root. Keep contacts with their actor.
  const actorIndex=townspeople.root.children.indexOf(c.mesh);
  const shadow=townspeople.root.children[actorIndex+1];
  if(shadow)shadow.visible=isGuest;
  if(isGuest){
   const p=spots[i];c.mesh.position.set(...p);
   if(shadow)shadow.position.set(p[0],p[1]+.006,p[2]);
   c.mesh.rotation.y=Math.atan2(cam.position.x-p[0],
    cam.position.z-p[2]);
  }
 });
 // Reuse ORIGINAL Episode 01 car meshes throughout the connected district.
 // Their prior fixed t=0 update froze them in place in Episode 02.
 // Main-road lanes are at z=7.45 and z=9.45, clear of cat sidewalks.
 const roadLife=n<=5||n===8||n===28||n===56||n===57;
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
 props.board.visible=n===57;
 props.sign.visible=n===24;
 props.treat.visible=n===16;
 // Face-based contact above drives the interaction. No detached arm,
 // artificial elbow, or hand-like grip is added in any story shot.
 const activeMorph=s.morph.essie>0&&s.morph.essie<1?{p:s.essieBox,v:s.morph.essie}:
  s.morph.demo>0&&s.morph.demo<1?{p:s.demoBox,v:s.morph.demo}:
  s.shot.sequence===50?{p:s.essieBox,v:1-ease(s.u)}:
  s.shot.sequence===55?{p:s.latteBox,v:1-ease(s.u)}:null;
 dust.root.visible=!!activeMorph;
 if(activeMorph){
  for(let i=0;i<dust.arr.length;i++){
   const e=dust.arr[i],theta=i*2.399+frame*.07,rad=.20+(i%5)*.11;
   e.mesh.position.set(activeMorph.p[0]+Math.cos(theta)*rad,
     .35+Math.sin(theta+frame*.06)*.13+i*.013,
     activeMorph.p[2]+Math.sin(theta)*rad);
   e.mesh.rotation.z=theta;
   e.mat.opacity=Math.sin(Math.PI*clamp(activeMorph.v))*.48;
  }
 }
 useEffect(()=>()=>{world.dispose();for(const b of Object.values(boxes))b.dispose();
  Object.values(characters).forEach(c=>c.dispose());
  demoKitten.dispose();curledKitten.dispose();
  townspeople.dispose();
  for(const p of dust.arr){p.geo.dispose();p.mat.dispose();}
  props.dispose();atmosphere.sun.dispose();atmosphere.night.dispose();
  effects.ink.dispose();effects.bloom.dispose();effects.tone.dispose();
  effects.grade.dispose();effects.lens.dispose();
 },[world,boxes,characters,demoKitten,curledKitten,townspeople,dust,atmosphere,effects,props]);
 return <><primitive object={world.root} dispose={null}/>
  <primitive object={atmosphere.root} dispose={null}/>
  {Object.values(boxes).map(b=><primitive key={b.root.name} object={b.root} dispose={null}/>)}
  {Object.values(characters).map(c=>
   <React.Fragment key={c.id}>
    <primitive object={c.card.mesh} dispose={null}/>
    <primitive object={c.card.legs} dispose={null}/>
    <primitive object={c.shadow.mesh} dispose={null}/>
   </React.Fragment>)}
  <primitive object={demoKitten.mesh} dispose={null}/>
  <primitive object={curledKitten.mesh} dispose={null}/>
  <primitive object={townspeople.root} dispose={null}/>
  <primitive object={props.root} dispose={null}/>
  <primitive object={dust.root} dispose={null}/>
  <EffectComposer multisampling={4}>
   <primitive object={effects.ink} dispose={null}/>
   <primitive object={effects.bloom} dispose={null}/>
   <primitive object={effects.tone} dispose={null}/>
   <primitive object={effects.grade} dispose={null}/>
   <primitive object={effects.lens} dispose={null}/>
  </EffectComposer>
 </>;
};
const Captions:React.FC<{captions:NonNullable<BoxEpisodeProps['captions']>}>=({captions})=>{
 const frame=useCurrentFrame();
 const cue=captions.find(c=>frame>=c.start&&frame<c.end);
 return cue?<div style={{position:'absolute',left:90,right:90,bottom:500,textAlign:'center',
  fontFamily:'Arial, sans-serif',fontSize:64,fontWeight:800,lineHeight:1.16,
  color:'#fff9ed',WebkitTextStroke:'3px #18202a',paintOrder:'stroke fill',
  textShadow:'0 3px 8px #101820',pointerEvents:'none'}}>{cue.text}</div>:null;
};
export const BoxEpisode:React.FC<BoxEpisodeProps>=props=>{
 const frame=useCurrentFrame();
 // The entrance plant is baked into static batches. Preserve the exact
 // Episode01 geometry, but render it unbatched for the three finale shots.
 const useBatch=(props.optimize??true)&&stateAt(frame,props.shots).shot.sequence<58;
 return <AbsoluteFill style={{background:'#172b46'}}>
 <ThreeCanvas width={1080} height={1920} dpr={props.previewScale??1}
  shadows gl={{antialias:false,stencil:false,powerPreference:'high-performance',toneMappingExposure:1}}
  camera={{near:.08,far:320,fov:48}}>
  <Inner {...props} optimize={useBatch}/>
 </ThreeCanvas>
 <Captions captions={props.captions??[]}/>
</AbsoluteFill>;
};
export const BoxEpisodeComposition:React.FC=()=>{
 const props:BoxEpisodeProps={...SCRATCH_EDIT,previewScale:1,optimize:true,audioApproved:false};
 return <Composition id="InThisTownEpisode02Box" component={BoxEpisode} defaultProps={props}
  calculateMetadata={({props:p})=>({durationInFrames:p.shots.at(-1)?.end??3876})}
  durationInFrames={3876} width={1080} height={1920} fps={30}/>;
};
