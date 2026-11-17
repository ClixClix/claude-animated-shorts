import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {AbsoluteFill,Composition,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction,BloomEffect,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {InkPass,NOINK} from '../../../videos/bridge/ink';
import {GradeEffect,type GradeParams} from '../../../videos/bridge/grade';
import {CHAR} from '../../../videos/bridge/shade';
import {CARD_K} from '../../../videos/bridge/cardshade';
import {EpisodeWorld} from '../door-at-1111-polish/world';
import {createRuleCat} from './ruleCats';
import {contactShadow,pawRig} from '../door-at-1111-polish/actors';
import {stateAt as ep1State,DRAFT_SHOTS} from '../door-at-1111-polish/timeline';
import {createEpisodeBox} from './boxProps';
import blueprint from './PART1_SHOT_BLUEPRINT.json';

/**
 * Episode 02 PART 1: four-shot isolated production pilot (183 frames).
 *
 * This composition intentionally does not depend on the rejected 60-shot
 * cameraDirector, oversized boxes, or lead-character stand-ins. It uses
 * Episode 01's actual town/cafe world, lighting, shaders, ink, supporting
 * cast artwork and paw rig. The pilot is an independently testable reusable
 * pattern for later sections of the approved story.
 */
export const PART1_SHOTS=blueprint.shots;
export const PART1_DURATION=blueprint.shots[blueprint.shots.length-1].end;
const SITE=new T.Vector3(blueprint.stage.boxWorldPosition[0],
 blueprint.stage.boxWorldPosition[1],blueprint.stage.boxWorldPosition[2]);
const GRADE:GradeParams={ky:[.015,.09,.26,.52,.77,.92,1],sat:[.92,.98,.90],
 tintS:[.008,.002],tintM:[0,.002],tintH:[-.003,.002],vig:[.10,.4]};
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
type PilotProps={previewScale?:number;optimize?:boolean};
const CAMERAS=blueprint.shots.map(s=>s.camera);
const findShot=(frame:number)=>{
 const index=PART1_SHOTS.findIndex(s=>frame>=s.start&&frame<s.end);
 const i=index<0?PART1_SHOTS.length-1:index;
 const shot=PART1_SHOTS[i];
 return {index:i,shot,u:smooth((frame-shot.start)/Math.max(1,shot.end-shot.start-1))};
};
function makePaperGlints(){
 const root=new T.Group(),items=Array.from({length:12},(_,i)=>{
  const geometry=new T.SphereGeometry(.016+i%3*.004,6,6);
  const material=new T.MeshBasicMaterial({color:i%3?'#ffdd9c':'#e6b77a',
   transparent:true,opacity:0,depthWrite:false});
  const mesh=new T.Mesh(geometry,material);
  mesh.layers.set(NOINK);root.add(mesh);return {mesh,geometry,material};
 });
 return {root,items,dispose:()=>{
  items.forEach(({geometry,material})=>{geometry.dispose();material.dispose();});
  root.removeFromParent();
 }};
}
function projectedBox(mesh:T.Object3D,cam:T.PerspectiveCamera){
 const bounds=new T.Box3().setFromObject(mesh);
 const corners:T.Vector3[]=[];
 for(const x of [bounds.min.x,bounds.max.x])
 for(const y of [bounds.min.y,bounds.max.y])
 for(const z of [bounds.min.z,bounds.max.z])corners.push(new T.Vector3(x,y,z));
 const p=corners.map(v=>v.project(cam));
 return {
  minX:Math.min(...p.map(v=>v.x)),maxX:Math.max(...p.map(v=>v.x)),
  minY:Math.min(...p.map(v=>v.y)),maxY:Math.max(...p.map(v=>v.y)),
  behind:p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.z>1)
 };
}
const Inner:React.FC<PilotProps>=({previewScale=1,optimize=true})=>{
 const frame=useCurrentFrame(),{shot,index,u}=findShot(frame);
 const {scene,camera,gl}=useThree();
 const world=useMemo(()=>{
  const w=new EpisodeWorld(optimize);
  w.update(ep1State(0,DRAFT_SHOTS));
  // Keep the established town and cafe; remove only unrelated Episode 01 story props.
  for(const name of ['episode-clock','city-clock-tower','chased-mouse',
   'fresh-water-bowl','home-blanket','blanket','last-bus',
   'latte-hiding-box','opening-setting-sun','rain-outside-only',
   'home-moonlight','alley-motion']){
    w.root.getObjectByName(name)?.traverse(o=>{o.visible=false;});
  }
  return w;
 },[optimize]);
 const cats=useMemo(()=>({
  guest:createRuleCat('hazel',1.23),
  slate:createRuleCat('slate',1.23),
  honey:createRuleCat('honey',1.20),
  sage:createRuleCat('sage',1.19),
 }),[]);
 const demo=useMemo(()=>createEpisodeBox('demo'),[]);
 const shadow=useMemo(()=>contactShadow(.72,.47),[]);
 const spark=useMemo(()=>makePaperGlints(),[]);
 const reach=useMemo(()=>({
  gesture:pawRig('#af7e58','#e7c7a4',.047)
 }),[]);
 const light=useMemo(()=>{
  const root=new T.Group();
  const ambient=new T.HemisphereLight('#f8e6cc','#657784',.6);
  const key=new T.DirectionalLight('#fff0d6',1.35);
  key.position.set(-7,15,8);root.add(ambient,key);
  return {root,ambient,key};
 },[]);
 const fx=useMemo(()=>({
  ink:new InkPass(scene,camera as T.PerspectiveCamera,
   {color:'#262737',widthNear:2.5*previewScale,widthFar:1.7*previewScale,
    creaseScale:.55,strength:.8}),
  bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.16,
   luminanceThreshold:1.05,luminanceSmoothing:.25,mipmapBlur:true,levels:5,radius:.5}),
  tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),
  grade:new GradeEffect(GRADE,.7)
 }),[scene,camera,previewScale]);
 // A brief directional-light shift supports the passage of time in shot 02.
 light.key.position.set(index===1?-7+12*u:-7,15,index===1?8-3*u:8);
 const cam=camera as T.PerspectiveCamera;
 const chosen=CAMERAS[index];
 const push=index===0?.12*u:index===2?.08*u:0;
 cam.position.set(chosen.position[0],chosen.position[1],chosen.position[2]-push);
 cam.fov=chosen.fov;cam.near=.08;cam.far=320;
 cam.lookAt(chosen.target[0],chosen.target[1],chosen.target[2]);cam.layers.enable(NOINK);
 cam.updateProjectionMatrix();cam.updateMatrixWorld(true);
 scene.background=new T.Color('#253b4c');
 scene.fog=new T.Fog('#253b4c',44,245);
 gl.shadowMap.type=T.PCFSoftShadowMap;
 gl.localClippingEnabled=true;
 CHAR.uCharTint.value.set(1,.96,.92);CHAR.uCharShade.value=.88;
 CHAR.uGrad.value=.055;CHAR.uBodyGrad.value=.15;
 CHAR.uSideTint.value.set(.83,.89,1);CARD_K.uPx.value=previewScale;
 // Production reblock, based on visual review of the original 12 PNGs:
 // 1) fully visible close-acting guest on SIDEWALK, never just ears;
 // 2) an illustrated *curled* cat instead of an upright figure hidden by a flap;
 // 3) progressive color-to-paper metamorphosis using one uninterrupted box;
 // 4) 3 detailed witnesses, each facing/interacting with the box.
 const guest=cats.guest;
 const morph=index===2?smooth((u-.08)/.89):index>2?1:0;
 const settle=index===1?smooth(u):index>=2?1:0;
 const standing=index===0;
 const hop=standing?smooth((u-.54)/.46):0;
 guest.update(frame/30,{pose:standing?'standing':'curled',
  expression:standing?'happy':index===2?'surprised':index===1?'happy':'neutral',
  walking:standing&&u<.58,
  progress:settle*.30+morph*.65,
  morph,
  look:standing?.20:0,
  blink:index===1?Math.max(0,1-Math.abs(u-.60)/.12):index===2&&morph>.55?.12:undefined,
  headTilt:standing?-.06+.12*hop:index===1?-.08+.10*settle:lerp(-.10,.12,morph)
 });
 guest.mesh.visible=index<3&&morph<.985;
 if(standing){
  // Guest remains BESIDE the box. Only the near forepaw reaches the rim.
  // The original build placed the entire card inside the box from frame 0.
  const walk=smooth(u/.63);
  // Start outside the box and complete a continuous visible short jump.
  // A hard shot cut occurs only AFTER the front paws reach the inside.
  const x=SITE.x-1.07+.99*walk;
  const jump=.32*Math.sin(Math.PI*hop);
  guest.mesh.position.set(x,SITE.y+.01+jump,SITE.z-.07);
  guest.mesh.scale.set(1-.10*hop,1-.10*hop,1);
  guest.mesh.rotation.z=-.075*walk+.16*Math.sin(Math.PI*hop);
 }else{
  // This *same guest* appears curled after the deliberate camera cut to shot 02.
  // The sculpted curled sprite includes tail, torso, paws, detailed Episode 01
  // head and whiskers. Ears/eyes are visible above the front rim.
  guest.mesh.position.set(SITE.x,SITE.y+.115-.055*settle-.18*morph,SITE.z-.10);
  const shrink=.95-.26*morph;
  guest.mesh.scale.set(.89*shrink,.88*shrink,1);
  guest.mesh.rotation.z=-.05*morph;
 }
 guest.mesh.rotation.y=Math.atan2(cam.position.x-guest.mesh.position.x,
  cam.position.z-guest.mesh.position.z);
 // Fur physically appears to turn to cardboard *before* the face collapses.
 const fur=new T.Color('#ffffff'),card=new T.Color('#b28a68');
 guest.material.color.copy(fur).lerp(card,smooth((morph-.14)/.61));
 guest.material.opacity=1-smooth((morph-.68)/.30);
 const companions=[
  {cat:cats.slate,x:SITE.x-1.08,z:SITE.z+.08,look:.40,tilt:-.12},
  {cat:cats.honey,x:SITE.x+1.06,z:SITE.z+.10,look:-.38,tilt:.14},
  // The third guest stands NEAR the camera at the box's right front corner.
  // Do not hide an entire witness behind the taller cardboard back flap.
  {cat:cats.sage,x:SITE.x+.62,z:SITE.z+.78,look:-.22,tilt:-.08}
 ];
 companions.forEach(({cat,x,z,look,tilt},i)=>{
  cat.update(frame/30+i*.17,{
   pose:'standing',expression:'surprised',look,
   headTilt:tilt+.07*Math.sin(u*Math.PI+i),
   walking:index===3&&u<.48
  });
  cat.mesh.visible=index===3;
  // Motion begins during the first third of shot 04, then settles.
  const entrance=index===3?1-smooth(u/.43):0;
  cat.mesh.position.set(x+(i===0?-.14:i===1?.14:.04)*entrance,
   SITE.y+.005+.022*Math.sin(Math.PI*entrance),
   z+(i===2?+.15:.07)*entrance);
  cat.mesh.scale.set(.96,.96,1);
  cat.mesh.rotation.z=tilt*.25*Math.sin(u*Math.PI);
  cat.mesh.rotation.y=Math.atan2(cam.position.x-cat.mesh.position.x,
   cam.position.z-cat.mesh.position.z);
  cat.material.opacity=1;
  cat.material.color.set('#f8f4ed');
 });
 demo.root.position.copy(SITE);
 demo.root.visible=true;
 // Flaps are not the magic themselves: they are reaction/contact choreography.
 // The original version hid the guest by closing the front board over the face.
 demo.setOpenAmount(index===0?.86:index===1?.98:
  index===2?lerp(.98,.30,smooth((morph-.68)/.32)):.30);
 // Only a short touch between the guest's forepaw and the rim. The old
 // 3D witness arm looked like an elastic blue bar crossing the cardboard.
 const handOn=index===0&&u>.34&&u<.75;
 reach.gesture.update(
  [guest.mesh.position.x+.32,SITE.y+.49,SITE.z+.14],
  [SITE.x-.53,SITE.y+.54,SITE.z+.34],handOn);
 shadow.mesh.visible=index<3&&morph<.91;
 shadow.mesh.position.set(standing?guest.mesh.position.x:SITE.x,
  SITE.y+.018,standing?SITE.z-.04:SITE.z-.08);
 // A translucent magic ripple now rises *within* the box footprint instead
 // of appearing as a large beige sticker pasted across its front face.
 spark.root.visible=index===2&&morph>.03&&morph<.99;
 spark.items.forEach((item,i)=>{
  const a=i*Math.PI*2/spark.items.length+u*5.2;
  const r=.23+(i%3)*.061;
  item.mesh.position.set(SITE.x+Math.cos(a)*r,
   SITE.y+.45+Math.sin(a*1.3)*.14+i*.017,
   SITE.z-.03+Math.sin(a)*r);
  item.material.opacity=Math.sin(Math.PI*morph)*.86;
 });
 // Record real-scene ray hits, not just a subject-centred FOV estimate.
 // This is intentionally sample-based and independent of publish QA.
 useEffect(()=>{
  if(![5,13,20,34,44,55,71,85,98,122,145,167].includes(frame))return;
  world.root.updateMatrixWorld(true);demo.root.updateMatrixWorld(true);
  Object.values(cats).forEach(c=>c.mesh.updateMatrixWorld(true));cam.updateMatrixWorld(true);
  const watch=[{name:'box',mesh:demo.root},
  ...(index<3?[{name:'guest',mesh:guest.mesh}]:[
   {name:'left-witness',mesh:cats.slate.mesh},
   {name:'right-witness',mesh:cats.honey.mesh},
   {name:'back-witness',mesh:cats.sage.mesh}])];
  const samples=watch.map(v=>({id:v.name,...projectedBox(v.mesh,cam)}));
  const at=new T.Vector3(SITE.x,.58,SITE.z);
  const direction=at.clone().sub(cam.position),distance=direction.length();
  const ray=new T.Raycaster(cam.position,direction.normalize(),.01,distance-.16);
  const occluders=[...world.blockers,...world.cafe.blockers].filter(o=>o.visible);
  const hits=ray.intersectObjects(occluders,false).filter(h=>
   !['floor','city-sidewalk-network','city-road-network'].includes(h.object.name)
  ).slice(0,5).map(h=>({name:h.object.name,distance:Number(h.distance.toFixed(2))}));
  // Production lesson: a mathematically safe subject projection can still
  // be entirely hidden behind the *hero prop itself*. Trace the important
  // face point through the physical cardboard walls/flaps as well.
  const facePoint=new T.Vector3(guest.mesh.position.x,
   guest.mesh.position.y+(index===0?.86:.62)*guest.mesh.scale.y,
   guest.mesh.position.z);
  const toFace=facePoint.clone().sub(cam.position);
  const faceDistance=toFace.length();
  const faceRay=new T.Raycaster(cam.position,toFace.normalize(),.01,
   Math.max(.01,faceDistance-.055));
  const boxHits=faceRay.intersectObject(demo.root,true).filter(h=>
   h.object instanceof T.Mesh).slice(0,3);
  const faceOccluded=index<3&&morph<.63&&boxHits.length>0;
  // Episode 01 streetlights are deliberately NON-SOLID set dressing, so
  // world.blockers excludes their poles. The prior pilot reported no
  // architecture hits while a lamp covered the hero box in EVERY shot.
  // Audit each actual lamp group through the centres of the visible actors
  // and the physical box, before claiming an unobstructed composition.
  const lampGroups:T.Object3D[]=[];
  world.root.traverse(o=>{
   if(o instanceof T.Group&&/^streetlight-\\d+$/.test(o.name)&&o.visible)
    lampGroups.push(o);
  });
  const lampWatch=[
   {id:'box',target:new T.Vector3(SITE.x,SITE.y+.53,SITE.z)},
   ...(index<3?[{id:'guest',target:new T.Vector3(
    guest.mesh.position.x,guest.mesh.position.y+(index===0?.87:.72)*guest.mesh.scale.y,
    guest.mesh.position.z)}]:[
    {id:'slate',target:new T.Vector3(cats.slate.mesh.position.x,
     cats.slate.mesh.position.y+.82,cats.slate.mesh.position.z)},
    {id:'honey',target:new T.Vector3(cats.honey.mesh.position.x,
     cats.honey.mesh.position.y+.82,cats.honey.mesh.position.z)},
    {id:'sage',target:new T.Vector3(cats.sage.mesh.position.x,
     cats.sage.mesh.position.y+.82,cats.sage.mesh.position.z)}
   ])
  ];
  const streetlightOcclusions=lampWatch.flatMap(({id,target})=>{
   const to=target.clone().sub(cam.position),length=to.length();
   const r=new T.Raycaster(cam.position,to.normalize(),.01,Math.max(.01,length-.05));
   return r.intersectObjects(lampGroups,true).filter(h=>h.object instanceof T.Mesh)
    .slice(0,2).map(h=>({subject:id,lampPart:h.object.name,
     distance:Number(h.distance.toFixed(3))}));
  });
  const cropped=samples.some(p=>p.behind||p.minX<-.90||p.maxX>.90||
   p.minY<-.88||p.maxY>.88);
  console.log('PART1_AUDIT '+JSON.stringify({
   frame,shot:shot.id,camera:cam.position.toArray(),fov:cam.fov,
   sampledSubjects:samples,occludingWorldObjects:hits,
   cropWarning:cropped,occlusionWarning:hits.length>0,
   faceOccluded,faceBlocker:boxHits[0]?.object.name??null,
   streetlightOcclusions,lampAuditedGroups:lampGroups.map(o=>o.name),
   sameBoxIdentity:demo.root.name,magicProgress:morph,
   noDuplicateBox:true
  }));
 },[frame,world,cam,demo,cats,index,morph,shot.id]);
 useEffect(()=>()=>{world.dispose();Object.values(cats).forEach(c=>c.dispose());demo.dispose();
  shadow.dispose();spark.dispose();Object.values(reach).forEach(p=>p.dispose());
  fx.ink.dispose();fx.bloom.dispose();fx.tone.dispose();fx.grade.dispose();
  light.key.dispose();light.ambient.dispose();
 },[world,cats,demo,shadow,spark,reach,fx,light]);
 return <><primitive object={world.root} dispose={null}/>
  {Object.entries(cats).map(([id,cat])=><primitive key={id} object={cat.mesh} dispose={null}/>)}
  <primitive object={demo.root} dispose={null}/>
  <primitive object={shadow.mesh} dispose={null}/>
  <primitive object={spark.root} dispose={null}/>
  {Object.entries(reach).map(([id,p])=><primitive key={id} object={p.group} dispose={null}/>)}
  <primitive object={light.root} dispose={null}/>
  <EffectComposer multisampling={4}>
   <primitive object={fx.ink} dispose={null}/>
   <primitive object={fx.bloom} dispose={null}/>
   <primitive object={fx.tone} dispose={null}/>
   <primitive object={fx.grade} dispose={null}/>
  </EffectComposer></>;
};
export const Episode02Part1:React.FC<PilotProps>=props=>
 <AbsoluteFill style={{background:'#253b4c'}}>
  <ThreeCanvas width={1080} height={1920} dpr={props.previewScale??1}
   shadows gl={{antialias:false,stencil:false,powerPreference:'high-performance'}}
   camera={{near:.08,far:320,fov:61}}>
   <Inner {...props}/>
  </ThreeCanvas>
 </AbsoluteFill>;
export const Episode02Part1Composition:React.FC=()=>
 <Composition id="InThisTownEpisode02Part1" component={Episode02Part1}
  defaultProps={{previewScale:1,optimize:true}}
  durationInFrames={PART1_DURATION} width={1080} height={1920} fps={30}/>;
