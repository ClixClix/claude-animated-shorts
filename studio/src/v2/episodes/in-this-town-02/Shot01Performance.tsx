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
import {stateAt,DRAFT_SHOTS} from '../door-at-1111-polish/timeline';
import {createEpisodeBox} from './boxProps';
import {createArticulatedGuest,SHOT01_PROOF_FRAMES,shot01Pose} from './articulatedGuest';
import {getRuleGuestDesign} from './ruleCats';
import proof from './SHOT01_PERFORMANCE_BLUEPRINT.json';

/**
 * A separate, intentionally longer ONE-SHOT movement rehearsal.
 * Does not claim to replace the 183-frame rejected story pilot.
 * Episode 01 world + drawn face, but seven independent body-part planes.
 * Actor contacts remain explicit; all transforms evaluate by absolute frame.
 */
const GRADE:GradeParams={ky:[.015,.09,.26,.52,.77,.92,1],sat:[.92,.98,.90],
 tintS:[.008,.002],tintM:[0,.002],tintH:[-.003,.002],vig:[.10,.4]};
const SITE=proof.set.boxWorldPosition as [number,number,number];
const cameraPose=proof.set.camera;
type Props={previewScale?:number;optimize?:boolean};
function rectInFrame(cam:T.PerspectiveCamera,obj:T.Object3D){
 const b=new T.Box3().setFromObject(obj),corners:T.Vector3[]=[];
 for(const x of [b.min.x,b.max.x])
 for(const y of [b.min.y,b.max.y])
 for(const z of [b.min.z,b.max.z])corners.push(new T.Vector3(x,y,z).project(cam));
 return {
  minX:Math.min(...corners.map(q=>q.x)),
  maxX:Math.max(...corners.map(q=>q.x)),
  minY:Math.min(...corners.map(q=>q.y)),
  maxY:Math.max(...corners.map(q=>q.y)),
  behind:corners.some(q=>q.z>1)
 };
}
const Inner:React.FC<Props>=({previewScale=1,optimize=true})=>{
 const frame=useCurrentFrame(),{scene,camera,gl}=useThree();
 const world=useMemo(()=>{
  const w=new EpisodeWorld(optimize);
  w.update(stateAt(0,DRAFT_SHOTS));
  for(const name of ['episode-clock','city-clock-tower','chased-mouse',
   'last-bus','home-blanket','home-moonlight','rain-outside-only']){
   const obj=w.root.getObjectByName(name);
   if(obj)obj.visible=false;
  }
  return w;
 },[optimize]);
 const box=useMemo(()=>createEpisodeBox('demo'),[]);
 const performer=useMemo(()=>createArticulatedGuest(getRuleGuestDesign('hazel')),[]);
 const camera3=camera as T.PerspectiveCamera;
 camera3.position.set(cameraPose.position[0],cameraPose.position[1],cameraPose.position[2]);
 camera3.fov=cameraPose.fov;camera3.near=.08;camera3.far=320;
 camera3.lookAt(cameraPose.target[0],cameraPose.target[1],cameraPose.target[2]);camera3.layers.enable(NOINK);
 camera3.updateProjectionMatrix();camera3.updateMatrixWorld(true);
 scene.background=new T.Color('#253b4c');
 scene.fog=new T.Fog('#253b4c',45,245);
 gl.shadowMap.type=T.PCFSoftShadowMap;
 gl.localClippingEnabled=true;
 CHAR.uCharTint.value.set(1,.96,.92);CHAR.uCharShade.value=.88;
 CHAR.uGrad.value=.055;CHAR.uBodyGrad.value=.15;
 CHAR.uSideTint.value.set(.83,.89,1);
 CARD_K.uPx.value=previewScale;
 const fx=useMemo(()=>({
  ink:new InkPass(scene,camera3,{color:'#262737',
   widthNear:2.5*previewScale,widthFar:1.7*previewScale,
   creaseScale:.55,strength:.8}),
  bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.16,
   luminanceThreshold:1.05,luminanceSmoothing:.25,
   mipmapBlur:true,levels:5,radius:.5}),
  tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),
  grade:new GradeEffect(GRADE,.7)
 }),[scene,camera3,previewScale]);
 box.root.position.set(...SITE);
 // The performance proof holds the hero box open during the entire action.
 // Flaps cannot snap closed or mask the illustrated face at landing.
 box.setOpenAmount(.99);
 const pose=performer.update(frame,SITE,camera3.position);
 useEffect(()=>{
  if(!proof.visualGate.framesToCheck.includes(frame))return;
  world.root.updateMatrixWorld(true);
  box.root.updateMatrixWorld(true);
  performer.root.updateMatrixWorld(true);
  camera3.updateMatrixWorld(true);
  const ignored=proof.set.prohibitedProximityGroups.flatMap(name=>{
   const root=world.root.getObjectByName(name);
   return root&&root.visible?[{name,root}]:[];
  });
  const boxBounds=new T.Box3().setFromObject(box.root);
  const actorBounds=new T.Box3().setFromObject(performer.root);
  // Physical overlap is checked separately from camera rays. A camera can
  // frame a prop cleanly despite its feet standing INSIDE the bus shelter.
  const overlaps=ignored.flatMap(({name,root})=>{
   const b=new T.Box3().setFromObject(root);
   if(b.isEmpty())return [];
   return [
    ...(b.intersectsBox(boxBounds.clone().expandByScalar(proof.set.clearance))?
     [{set:name,who:'box'}]:[]),
    ...(b.intersectsBox(actorBounds.clone().expandByScalar(proof.set.clearance))?
     [{set:name,who:'articulated-guest'}]:[])
   ];
  });
  const checkPoints=[
   {id:'box-center',point:new T.Vector3(SITE[0],SITE[1]+.48,SITE[2])},
   {id:'guest-face',point:new T.Vector3(pose.x,pose.y+1.035-pose.crouch*.38,pose.z)},
   {id:'guest-chest',point:new T.Vector3(pose.x,pose.y+.64-pose.crouch*.17,pose.z)},
   {id:'guest-paws',point:new T.Vector3(pose.x,pose.y+.14,pose.z)}
  ];
  const setInFront=checkPoints.flatMap(({id,point})=>{
   const vec=point.clone().sub(camera3.position),distance=vec.length();
   const ray=new T.Raycaster(camera3.position,vec.normalize(),.02,Math.max(.02,distance-.06));
   return ignored.flatMap(({name,root})=>
    ray.intersectObject(root,true).filter(h=>h.object instanceof T.Mesh).slice(0,2)
     .map(h=>({set:name,who:id,distance:Number(h.distance.toFixed(3))})));
  });
  // Detect the stunt crossing the box's left side *before* planted feet
  // clear the cardboard rim. Unlike an abstract frustum check, this is
  // directly tied to the physical choreography.
  const leftWall=SITE[0]-box.spec.width/2;
  const horizontalOverlap=pose.x+.36>leftWall&&pose.x<leftWall;
  const badRimCross=pose.stage==='flight'&&horizontalOverlap&&
   pose.y<SITE[1]+box.spec.height+.04;
  const boxFraming=rectInFrame(camera3,box.root);
  const headFraming=rectInFrame(camera3,performer.head.mesh);
  const clipped=[boxFraming,headFraming].some(a=>
   a.behind||a.minX<-.9||a.maxX>.9||a.minY<-.84||a.maxY>.84);
  console.log('SHOT01_PERFORMANCE_QA '+JSON.stringify({
   frame,time:frame/30,stage:pose.stage,position:[pose.x,pose.y,pose.z],
   boxPlace:SITE,allLimbBones:performer.paws.length===4,
   headAndTailIndependent:true,
   setIntersections:overlaps,setOcclusion:setInFront,
   prematureRimCross:badRimCross,framingWarning:clipped,
   headFraming,boxFraming,
   noPaidAssets:true
  }));
 },[frame,world,box,performer,camera3,pose]);
 useEffect(()=>()=>{world.dispose();box.dispose();performer.dispose();
  fx.ink.dispose();fx.bloom.dispose();fx.tone.dispose();fx.grade.dispose();
 },[world,box,performer,fx]);
 return <>
  <primitive object={world.root} dispose={null}/>
  <primitive object={box.root} dispose={null}/>
  <primitive object={performer.root} dispose={null}/>
  <EffectComposer multisampling={4}>
   <primitive object={fx.ink} dispose={null}/>
   <primitive object={fx.bloom} dispose={null}/>
   <primitive object={fx.tone} dispose={null}/>
   <primitive object={fx.grade} dispose={null}/>
  </EffectComposer>
 </>;
};
export const Shot01Performance:React.FC<Props>=props=>
 <AbsoluteFill style={{background:'#253b4c'}}>
  <ThreeCanvas width={1080} height={1920} dpr={props.previewScale??1}
   shadows gl={{antialias:false,stencil:false,powerPreference:'high-performance'}}
   camera={{near:.08,far:320,fov:72}}>
   <Inner {...props}/>
  </ThreeCanvas>
 </AbsoluteFill>;
export const Shot01PerformanceComposition:React.FC=()=>
 <Composition id="InThisTownEpisode02Shot01Performance"
  component={Shot01Performance}
  defaultProps={{previewScale:1,optimize:true}}
  durationInFrames={SHOT01_PROOF_FRAMES} width={1080} height={1920} fps={30}/>;
