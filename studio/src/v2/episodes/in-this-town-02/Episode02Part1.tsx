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
import {TownPopulation} from '../door-at-1111-polish/population';
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
function makePaperFold(){
 // This is a single folding surface that replaces the cat silhouette; it is
 // NOT a replacement box. The real hero box never gets duplicated.
 const shape=new T.Shape();
 shape.moveTo(-.32,0);
 shape.lineTo(-.32,.33);shape.lineTo(-.22,.60);
 shape.lineTo(-.06,.43);shape.lineTo(.08,.43);
 shape.lineTo(.22,.60);shape.lineTo(.32,.33);
 shape.lineTo(.32,0);shape.closePath();
 const geometry=new T.ShapeGeometry(shape);
 const material=new T.MeshBasicMaterial({color:'#c5a07a',transparent:true,
  opacity:0,side:T.DoubleSide,depthWrite:false});
 const mesh=new T.Mesh(geometry,material);
 mesh.name='single-guest-cardboard-fold';
 mesh.layers.set(NOINK);
 mesh.renderOrder=3;
 return {mesh,material,geometry,dispose:()=>{
  geometry.dispose();material.dispose();mesh.removeFromParent();
 }};
}
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
 const people=useMemo(()=>new TownPopulation(),[]);
 const demo=useMemo(()=>createEpisodeBox('demo'),[]);
 const shadow=useMemo(()=>contactShadow(.64,.40),[]);
 const paper=useMemo(()=>makePaperFold(),[]);
 const spark=useMemo(()=>makePaperGlints(),[]);
 const reach=useMemo(()=>({
  left:pawRig('#aa8061','#dec9aa',.043),
  right:pawRig('#aa8061','#dec9aa',.043),
  examine:pawRig('#7e8b93','#ded7c7',.037)
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
 // Population is reused directly from Episode 01, including its illustrated
 // supporting-cat bodies and palette. Not a recolored Mocha/Essie/Latte lead.
 people.update(ep1State(frame,DRAFT_SHOTS));
 people.root.children.forEach(obj=>{obj.visible=false;});
 const actors=people.actors;
 const guest=actors[0].mesh as T.Mesh<T.PlaneGeometry,T.MeshLambertMaterial>;
 const curious=actors[1].mesh as T.Mesh<T.PlaneGeometry,T.MeshLambertMaterial>;
 const listener=actors[2].mesh as T.Mesh<T.PlaneGeometry,T.MeshLambertMaterial>;
 const sideGuest=actors[3].mesh as T.Mesh<T.PlaneGeometry,T.MeshLambertMaterial>;
 const morph=index===2?smooth((u-.12)/.78):index>2?1:0;
 const curl=index===1?smooth(u):index>=2?1:0;
 const guestScaleY=lerp(1,.72,curl)*(1-.86*morph);
 guest.visible=index<3&&morph<.995;
 guest.scale.set(.91,guestScaleY,.91);
 guest.position.set(SITE.x,lerp(.08,-.035,morph),SITE.z-.08);
 guest.rotation.y=Math.atan2(cam.position.x-guest.position.x,cam.position.z-guest.position.z);
 guest.rotation.z=index===2?-.10*Math.sin(morph*Math.PI):0;
 guest.material.opacity=1-smooth((morph-.45)/.55);
 guest.material.transparent=true;guest.material.depthWrite=false;
 const fresh=new T.Color('#ffffff'),card=new T.Color('#b89473');
 guest.material.color.copy(fresh).lerp(card,morph*.92);
 // Other guests do not materialize until after the demonstration completes.
 const other=[curious,listener,sideGuest];
 const positions:[[number,number,number],[number,number,number],[number,number,number]]=[
  [2.25,0,7.55],[4.62,0,7.55],[3.9,0,6.78]];
 other.forEach((sprite,i)=>{
  sprite.visible=index===3;
  sprite.position.set(...positions[i]);
  sprite.scale.set(.92,.92,.92);
  sprite.rotation.y=Math.atan2(cam.position.x-positions[i][0],
    cam.position.z-positions[i][2]);
  sprite.material.transparent=true;sprite.material.opacity=1;
 });
 demo.root.position.copy(SITE);
 demo.root.visible=true;
 // Same cardboard panels every frame. The four flaps settle as the cat folds,
 // rather than a second intact box spawning from nowhere.
 demo.setOpenAmount(index===0?lerp(.72,.86,u):
  index===1?.86:index===2?lerp(.86,.36,morph):.38);
 // Arms have explicit targets on the physically sized box rim.
 const pawOn=index===0||index===1;
 reach.left.update([SITE.x-.23,.65,SITE.z-.02],
  [SITE.x-.27,.52,SITE.z+.36],pawOn);
 reach.right.update([SITE.x+.23,.65,SITE.z-.02],
  [SITE.x+.27,.52,SITE.z+.36],pawOn);
 reach.examine.update([4.43,.56,7.60],[SITE.x+.42,.53,7.84],index===3);
 shadow.mesh.visible=index<3&&morph<.92;
 shadow.mesh.position.set(SITE.x,SITE.y+.028,SITE.z-.08);
 paper.mesh.visible=index===2&&morph>.15&&morph<1;
 paper.mesh.position.set(SITE.x,.52-lerp(0,.39,morph),SITE.z+.48);
 paper.mesh.scale.set(lerp(.85,1.0,morph),lerp(.94,.05,morph),1);
 paper.mesh.rotation.x=morph*Math.PI*.39;
 paper.material.opacity=smooth((morph-.12)/.35)*(1-smooth((morph-.72)/.27))*.88;
 spark.root.visible=index===2&&morph>.05&&morph<.99;
 spark.items.forEach((item,i)=>{
  const a=i*Math.PI*2/spark.items.length+u*4.1;
  const r=.25+(i%3)*.075;
  item.mesh.position.set(SITE.x+Math.cos(a)*r,
   .35+Math.sin(a*1.3)*.17+i*.019,SITE.z+.10+Math.sin(a)*r);
  item.material.opacity=Math.sin(Math.PI*morph)*.82;
 });
 // Record real-scene ray hits, not just a subject-centred FOV estimate.
 // This is intentionally sample-based and independent of publish QA.
 useEffect(()=>{
  if(![13,44,85,145].includes(frame))return;
  world.root.updateMatrixWorld(true);demo.root.updateMatrixWorld(true);
  people.root.updateMatrixWorld(true);cam.updateMatrixWorld(true);
  const watch=[{name:'box',mesh:demo.root},
   ...(index<3?[{name:'guest',mesh:guest}]:[
    {name:'curious',mesh:curious},{name:'listener',mesh:listener}])];
  const samples=watch.map(v=>({id:v.name,...projectedBox(v.mesh,cam)}));
  const at=new T.Vector3(SITE.x,.58,SITE.z);
  const direction=at.clone().sub(cam.position),distance=direction.length();
  const ray=new T.Raycaster(cam.position,direction.normalize(),.01,distance-.16);
  const occluders=[...world.blockers,...world.cafe.blockers].filter(o=>o.visible);
  const hits=ray.intersectObjects(occluders,false).filter(h=>
   !['floor','city-sidewalk-network','city-road-network'].includes(h.object.name)
  ).slice(0,5).map(h=>({name:h.object.name,distance:Number(h.distance.toFixed(2))}));
  const cropped=samples.some(p=>p.behind||p.minX<-.90||p.maxX>.90||
   p.minY<-.88||p.maxY>.88);
  console.log('PART1_AUDIT '+JSON.stringify({
   frame,shot:shot.id,camera:cam.position.toArray(),fov:cam.fov,
   sampledSubjects:samples,occludingWorldObjects:hits,
   cropWarning:cropped,occlusionWarning:hits.length>0,
   sameBoxIdentity:demo.root.name,magicProgress:morph,
   noDuplicateBox:true
  }));
 },[frame,world,cam,demo,people,guest,curious,listener,index,morph,shot.id]);
 useEffect(()=>()=>{world.dispose();people.dispose();demo.dispose();
  shadow.dispose();paper.dispose();spark.dispose();Object.values(reach).forEach(p=>p.dispose());
  fx.ink.dispose();fx.bloom.dispose();fx.tone.dispose();fx.grade.dispose();
  light.key.dispose();light.ambient.dispose();
 },[world,people,demo,shadow,paper,spark,reach,fx,light]);
 return <><primitive object={world.root} dispose={null}/>
  <primitive object={people.root} dispose={null}/>
  <primitive object={demo.root} dispose={null}/>
  <primitive object={shadow.mesh} dispose={null}/>
  <primitive object={paper.mesh} dispose={null}/>
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
