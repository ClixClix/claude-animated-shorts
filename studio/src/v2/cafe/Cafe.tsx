import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction,BloomEffect,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {InkPass,NOINK} from '../../videos/bridge/ink';
import {LensBlur} from '../../videos/bridge/lensblur';
import {GradeEffect,GradeParams} from '../../videos/bridge/grade';
import {createCatCard} from '../cats/Cat';
import {cardShade, CARD_K} from '../../videos/bridge/cardshade';
import {CHAR} from '../../videos/bridge/shade';
import {catMotion} from '../cats/pose';
import {CAT_PLACEMENTS,SHOTS,ShotId} from './config';
import {CafeEnvironment} from './environment';
import {layoutChecks,layoutFingerprint} from './layout';

const CAFE_GRADE:GradeParams={ky:[0.015,0.09,0.26,0.52,0.77,0.92,1],sat:[0.92,0.98,0.90],tintS:[0.008,0.002],tintM:[0,0.002],tintH:[-0.003,0.002],vig:[0.10,0.4]};
function contactTexture(){
 const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d')!;
 const gr=g.createRadialGradient(64,64,3,64,64,63);gr.addColorStop(0,'rgba(25,20,32,0.48)');gr.addColorStop(0.45,'rgba(25,20,32,0.25)');gr.addColorStop(1,'rgba(25,20,32,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);return new T.CanvasTexture(cv);
}
/** World is instantiated once; shots select a camera and facial performance only. */
const CafeInner:React.FC<{shot:ShotId}>=({shot})=>{
 const {camera,scene,gl}=useThree();const frame=useCurrentFrame();
 const spec=SHOTS.find(s=>s.id===shot)!;
 const environment=useMemo(()=>new CafeEnvironment(),[]);
 const cast=useMemo(()=>CAT_PLACEMENTS.map(p=>{
   const card=createCatCard(p.id,p.height);card.mesh.name=`cat-${p.id}`;
   card.mesh.position.set(...p.position);card.mesh.layers.set(NOINK);card.mesh.renderOrder=1;
   card.mesh.material.depthWrite=true;card.mesh.material.alphaTest=0.25;card.mesh.material.transparent=false;
   card.mesh.material=cardShade(card.mesh.material);
   card.mesh.castShadow=true;card.mesh.receiveShadow=true;
   const tex=contactTexture();const material=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:T.DoubleSide});
   const blob=new T.Mesh(new T.PlaneGeometry(0.90,0.52),material);blob.name=`cat-${p.id}-contact`;blob.rotation.x=-Math.PI/2;blob.position.set(p.position[0],p.position[1]+0.008,p.position[2]);blob.layers.set(NOINK);blob.renderOrder=0.5;
   return {card,blob,tex,material,placement:p};
 }),[]);
 const fx=useMemo(()=>({ink:new InkPass(scene,camera as T.PerspectiveCamera,{color:'#262737',widthNear:2.5,widthFar:1.7,creaseScale:0.55,strength:0.8}),
   lens:new LensBlur({maxCoC:8,nearScale:0.5}),
   bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:0.18,luminanceThreshold:1.05,luminanceSmoothing:0.25,mipmapBlur:true,levels:5,radius:0.5}),
   tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),grade:new GradeEffect(CAFE_GRADE,0.7)}),[scene,camera]);
 const cam=camera as T.PerspectiveCamera;
 cam.position.set(...spec.position);cam.fov=spec.fov;cam.near=0.08;cam.far=120;cam.lookAt(...spec.target);cam.layers.enable(NOINK);cam.updateProjectionMatrix();cam.updateMatrixWorld();
 CHAR.uCharTint.value.set(1,0.96,0.92);CHAR.uCharShade.value=0.88;CHAR.uGrad.value=0.035;CHAR.uBodyGrad.value=0.11;CHAR.uSideTint.value.set(0.90,0.94,1.0);CARD_K.uPx.value=1;
 scene.background=new T.Color('#14283c');scene.fog=new T.Fog('#21364a',22,70);gl.shadowMap.type=T.PCFSoftShadowMap;
 fx.lens.focus=new T.Vector3(...spec.focus).sub(cam.position).dot(cam.getWorldDirection(new T.Vector3()));fx.lens.cInf=spec.blur;
 cast.forEach(({card,placement},i)=>{
   // Yaw-only billboard. World foot anchors never move, including during idle breaths/blinks.
   card.mesh.rotation.y=Math.atan2(cam.position.x-placement.position[0],cam.position.z-placement.position[2]);
   const entrance=new T.Vector3(2.25,1.3,4.2).sub(new T.Vector3(...placement.position));
   const right=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion);
   const look=entrance.normalize().dot(right);
   card.update({...catMotion(frame/30,'idle',i),yaw:shot==='essie-closeup'&&placement.id==='essie'?0.18:placement.heading,
     ...(shot==='essie-closeup'&&placement.id==='essie'?{expression:'concerned' as const,gazeX:look*0.8,headTilt:-0.055}:{} )});
 });
 useEffect(()=>{
   const checks=layoutChecks();if(checks.some(c=>!c.pass))throw new Error(JSON.stringify(checks.filter(c=>!c.pass)));
   environment.root.updateMatrixWorld(true);cast.forEach(c=>{c.card.mesh.updateMatrixWorld(true);c.blob.updateMatrixWorld(true);});
   const visibility=spec.required.map(id=>{
     const c=CAT_PLACEMENTS.find(c=>c.id===id);
     const object=c?cast.find(x=>x.placement.id===id)!.card.mesh:environment.fixtures.get(id)??environment.root.getObjectByName(id);
     if(!object)throw new Error(`Missing story object ${id}`);
     const centre=c?new T.Vector3(c.position[0],c.position[1]+0.77,c.position[2]):new T.Box3().setFromObject(object).getCenter(new T.Vector3());
     const ndc=centre.clone().project(cam);
     const delta=centre.clone().sub(cam.position),distance=delta.length();
     const ray=new T.Raycaster(cam.position,delta.normalize(),0.09,distance-0.03);
     const hits=ray.intersectObjects(environment.blockers,false).filter(hit=>{
       let p:T.Object3D|null=hit.object;while(p){if(p===object)return false;p=p.parent;}return true;
     });
     return {id,inFrame:Math.abs(ndc.x)<0.96&&Math.abs(ndc.y)<0.96&&ndc.z<1,ndc:[ndc.x,ndc.y],occluder:hits[0]?.object.name??null};
   });
   const assets:{name:string;problem:string}[]=[];environment.root.traverse(o=>{
     if(o instanceof T.Mesh){if(!o.geometry.getAttribute('position')?.count)assets.push({name:o.name,problem:'empty geometry'});
       const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m)assets.push({name:o.name,problem:'missing material'});
         const map=(m as T.MeshStandardMaterial).map;if(map&&!map.image)assets.push({name:o.name,problem:'missing texture image'});}}
   });
   const cameraHits=environment.blockers.filter(m=>new T.Box3().setFromObject(m).containsPoint(cam.position)).map(m=>m.name);
   const geometryState:string[]=[];let meshCount=0;
   environment.root.traverse(o=>{
     const mesh=o as T.Mesh;const m=mesh.material as T.MeshStandardMaterial|undefined;
     if(o instanceof T.Mesh)meshCount++;
     geometryState.push(JSON.stringify([o.name,o.type,o.position.toArray(),o.quaternion.toArray(),o.scale.toArray(),
       o instanceof T.Mesh?[mesh.geometry.type,mesh.geometry.getAttribute('position').count,m?.type,m?.color?.getHexString()]:null]));
   });
   let signature=2166136261;for(const ch of geometryState.join('|'))signature=Math.imul(signature^ch.charCodeAt(0),16777619)>>>0;
   const fixtureTransforms=[...environment.fixtures].map(([id,o])=>({id,position:o.position.toArray(),rotation:o.rotation.y,role:o.userData.role}));
   const audit={shot,checks,visibility,assets,cameraHits,meshCount,geometrySignature:signature.toString(16),fixtureTransforms,fingerprint:layoutFingerprint(),fixtureIds:[...environment.fixtures.keys()],cats:CAT_PLACEMENTS.map(c=>({id:c.id,position:c.position,height:c.height,support:c.support}))};
   (window as unknown as {__CAFE_AUDIT:unknown}).__CAFE_AUDIT=audit;
   console.log('CAFE_AUDIT '+JSON.stringify(audit));
 },[environment,cast,shot,cam,spec]);
 useEffect(()=>()=>{environment.dispose();cast.forEach(c=>{c.card.dispose();c.blob.geometry.dispose();c.material.dispose();c.tex.dispose();});fx.ink.dispose();fx.lens.pre.dispose();fx.lens.main.dispose();fx.bloom.dispose();fx.tone.dispose();fx.grade.dispose();},[environment,cast,fx]);
 return <><primitive object={environment.root} dispose={null}/>{cast.map(c=><React.Fragment key={c.placement.id}><primitive object={c.card.mesh} dispose={null}/><primitive object={c.blob} dispose={null}/></React.Fragment>)}
 <EffectComposer multisampling={4}>{[
   <primitive key="ink" object={fx.ink} dispose={null}/>,
   ...(spec.blur>0?[<primitive key="pre" object={fx.lens.pre} dispose={null}/>,<primitive key="lens" object={fx.lens.main} dispose={null}/>]:[]),
   <primitive key="bloom" object={fx.bloom} dispose={null}/>,<primitive key="tone" object={fx.tone} dispose={null}/>,<primitive key="grade" object={fx.grade} dispose={null}/>,
 ]}</EffectComposer></>;
};
export const CafeShot:React.FC<{shot:ShotId}>=({shot})=><AbsoluteFill style={{background:'#14283c'}}>
 <ThreeCanvas width={1080} height={1920} shadows dpr={1} gl={{antialias:false,stencil:false,powerPreference:'high-performance',toneMappingExposure:1}} camera={{fov:50,near:0.08,far:120}}><CafeInner shot={shot}/></ThreeCanvas>
</AbsoluteFill>;
