import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction,BloomEffect,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {CafeEnvironment} from '../cafe/environment';
import {CAT_PLACEMENTS} from '../cafe/config';
import {createCatCard} from '../cats/Cat';
import {catMotion} from '../cats/pose';
import {cardShade,CARD_K} from '../../videos/bridge/cardshade';
import {CHAR} from '../../videos/bridge/shade';
import {InkPass,NOINK} from '../../videos/bridge/ink';
import {LensBlur} from '../../videos/bridge/lensblur';
import {GradeEffect,GradeParams} from '../../videos/bridge/grade';
import {createKitten} from './kitten';
import {createEssieActing,createPaw} from './acting';
import {storyAt,StoryState} from './timeline';
const GRADE:GradeParams={ky:[0.015,0.09,0.26,0.52,0.77,0.92,1],sat:[0.92,0.98,0.90],tintS:[0.008,0.002],tintM:[0,0.002],tintH:[-0.003,0.002],vig:[0.10,0.4]};
function contact(){
 const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d')!;const gr=g.createRadialGradient(64,64,3,64,64,63);gr.addColorStop(0,'rgba(25,20,32,0.48)');gr.addColorStop(0.45,'rgba(25,20,32,0.25)');gr.addColorStop(1,'rgba(25,20,32,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
 const tex=new T.CanvasTexture(cv),mat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:T.DoubleSide});
 const mesh=new T.Mesh(new T.PlaneGeometry(0.9,0.52),mat);mesh.rotation.x=-Math.PI/2;mesh.layers.set(NOINK);mesh.renderOrder=0.5;
 return {mesh,dispose:()=>{mesh.geometry.dispose();mat.dispose();tex.dispose();}};
}
function doorRig(env:CafeEnvironment){
 const entrance=env.root.getObjectByName('entrance') as T.Group;env.root.updateMatrixWorld(true);
 const pivot=new T.Group();pivot.name='story-door-hinge';pivot.position.x=-0.725;entrance.add(pivot);env.root.updateMatrixWorld(true);
 const leaf=entrance.children.filter(c=>c!==pivot&&(c.name.endsWith('/glass')||Math.abs(c.position.x+0.02)<0.001||Math.abs(c.position.y-0.24)<0.001||Math.abs(c.position.x-0.48)<0.001||Math.abs(c.position.y-2.3)<0.001));
 for(const child of leaf)pivot.attach(child);
 return {pivot,parts:leaf};
}
type SceneTiming={state?:StoryState;motionFrame?:number};
const Inner:React.FC<SceneTiming>=({state,motionFrame})=>{
 const renderFrame=useCurrentFrame(),s=state??storyAt(renderFrame),frame=s.frame,ambientFrame=motionFrame??frame;const {camera,scene,gl}=useThree();
 const world=useMemo(()=>{
   const env=new CafeEnvironment();const door=doorRig(env);const cup=env.fixtures.get('service-mug')!;
   const cast=CAT_PLACEMENTS.map(p=>{
     const card=createCatCard(p.id,p.height);card.mesh.name=`story-${p.id}`;card.mesh.position.set(...p.position);card.mesh.layers.set(NOINK);card.mesh.material.depthWrite=true;card.mesh.material.alphaTest=0.25;card.mesh.material.transparent=false;card.mesh.material=cardShade(card.mesh.material);card.mesh.castShadow=card.mesh.receiveShadow=true;
     const shadow=contact();shadow.mesh.position.set(p.position[0],p.position[1]+0.008,p.position[2]);shadow.mesh.name=`${p.id}-contact`;return {placement:p,card,shadow};
   });
   const acting=createEssieActing();const essie=cast.find(c=>c.placement.id==='essie')!;essie.card.mesh.material.map=acting.texture;
   const kitten=createKitten();kitten.mesh.layers.set(NOINK);const kittenShadow=contact();kittenShadow.mesh.scale.set(0.54,0.54,1);
   const paw=createPaw();
   const steam=new T.Group();steam.name='cup-warmth';const steamMat=new T.LineBasicMaterial({color:'#fff1d6',transparent:true,opacity:0.24,depthWrite:false});
   for(let i=0;i<3;i++){const line=new T.Line(new T.BufferGeometry().setFromPoints(Array.from({length:17},(_,j)=>new T.Vector3(0,j/16*0.15,0))),steamMat);line.layers.set(NOINK);steam.add(line);}
   return {env,door,cup,cast,acting,kitten,kittenShadow,paw,steam,steamMat};
 },[]);
 const fx=useMemo(()=>({ink:new InkPass(scene,camera as T.PerspectiveCamera,{color:'#262737',widthNear:2.5,widthFar:1.7,creaseScale:0.55,strength:0.8}),lens:new LensBlur({maxCoC:8,nearScale:0.5}),bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:0.18,luminanceThreshold:1.05,luminanceSmoothing:0.25,mipmapBlur:true,levels:5,radius:0.5}),tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),grade:new GradeEffect(GRADE,0.7)}),[scene,camera]);
 const cam=camera as T.PerspectiveCamera;cam.position.set(...s.camera);cam.fov=s.fov;cam.lookAt(...s.target);cam.layers.enable(NOINK);cam.updateProjectionMatrix();cam.updateMatrixWorld();
 scene.background=new T.Color('#14283c');scene.fog=new T.Fog('#21364a',22,70);gl.shadowMap.type=T.PCFSoftShadowMap;
 CHAR.uCharTint.value.set(1,0.96,0.92);CHAR.uCharShade.value=0.88;CHAR.uGrad.value=0.035;CHAR.uBodyGrad.value=0.11;CHAR.uSideTint.value.set(0.90,0.94,1.0);CARD_K.uPx.value=1;
 fx.lens.focus=new T.Vector3(...s.target).sub(cam.position).dot(cam.getWorldDirection(new T.Vector3()));fx.lens.cInf=s.blur;
 world.door.pivot.rotation.y=s.door;world.cup.position.set(...s.cup);
 for(const c of world.cast){const isEssie=c.placement.id==='essie';
   if(isEssie){c.card.mesh.position.set(...s.essie);world.acting.update(s);}else c.card.update({...catMotion(ambientFrame/30,'idle',c.placement.id==='mocha'?0:2),yaw:c.placement.heading,tail:0.03*Math.sin(ambientFrame/30)});
   c.card.mesh.rotation.y=Math.atan2(cam.position.x-c.card.mesh.position.x,cam.position.z-c.card.mesh.position.z);
   c.shadow.mesh.position.set(c.card.mesh.position.x,c.card.mesh.position.y+0.008,c.card.mesh.position.z);
 }
 world.kitten.update(s,ambientFrame);world.kitten.mesh.position.set(...s.kitten);world.kitten.mesh.rotation.y=Math.atan2(cam.position.x-s.kitten[0],cam.position.z-s.kitten[2]);
 world.kittenShadow.mesh.position.set(s.kitten[0],(frame>=105?1.12:0)+0.008,s.kitten[2]);world.kittenShadow.mesh.visible=!(frame>=81&&frame<104);
 world.paw.update(s);world.steam.position.set(s.cup[0],s.cup[1]+0.205,s.cup[2]);
 world.steam.children.forEach((o,i)=>{const points=(o as T.Line).geometry.getAttribute('position');for(let j=0;j<points.count;j++){const t=j/(points.count-1);points.setXYZ(j,(i-1)*0.035+Math.sin(t*5-ambientFrame/30*1.2+i)*0.012*t,t*0.15,0.01*i);}points.needsUpdate=true;});
 useEffect(()=>{
   world.env.root.updateMatrixWorld(true);world.cast.forEach(c=>c.card.mesh.updateMatrixWorld(true));world.kitten.mesh.updateMatrixWorld(true);
   const points=[{id:'kitten',v:new T.Vector3(s.kitten[0],s.kitten[1]+0.36,s.kitten[2])},
     {id:'essie',v:new T.Vector3(s.essie[0],s.essie[1]+0.77,s.essie[2])},{id:'cup',v:new T.Vector3(s.cup[0],s.cup[1]+0.13,s.cup[2])}];
   const req=s.shot===1?['kitten']:s.shot===2?['essie']:['kitten','essie','cup'];
   const visibility=points.filter(p=>req.includes(p.id)).map(p=>{
     const n=p.v.clone().project(cam);const d=p.v.clone().sub(cam.position);const distance=d.length();const ray=new T.Raycaster(cam.position,d.normalize(),0.08,distance-0.04);
     const hits=ray.intersectObjects(world.env.blockers,false).filter(h=>{let o:T.Object3D|null=h.object;while(o){if(o===world.cup&&p.id==='cup')return false;o=o.parent;}return true;});
     return {id:p.id,inFrame:Math.abs(n.x)<0.94&&Math.abs(n.y)<0.94&&n.z<1,ndc:[n.x,n.y],occluder:hits[0]?.object.name??null};
   });
   const cameraHits=world.env.blockers.filter(m=>new T.Box3().setFromObject(m).containsPoint(cam.position)).map(m=>m.name);
   const audit={frame,renderFrame,shot:s.shot,visibility,cameraHits,cup:s.cup,kitten:s.kitten,essie:s.essie,paw:s.paw,contact:s.contact,reach:s.reach,door:s.door};
   (window as unknown as {__ANIM_AUDIT:unknown}).__ANIM_AUDIT=audit;console.log('ANIM_AUDIT '+JSON.stringify(audit));
 },[frame,renderFrame,world,cam]);
 useEffect(()=>()=>{world.env.dispose();world.cast.forEach(c=>{c.card.dispose();c.shadow.dispose();});world.acting.dispose();world.kitten.dispose();world.kittenShadow.dispose();world.paw.dispose();world.steam.children.forEach(o=>(o as T.Line).geometry.dispose());world.steamMat.dispose();fx.ink.dispose();fx.lens.pre.dispose();fx.lens.main.dispose();fx.bloom.dispose();fx.tone.dispose();fx.grade.dispose();},[world,fx]);
 return <><primitive object={world.env.root} dispose={null}/>{world.cast.map(c=><React.Fragment key={c.placement.id}><primitive object={c.card.mesh} dispose={null}/><primitive object={c.shadow.mesh} dispose={null}/></React.Fragment>)}
 <primitive object={world.kitten.mesh} dispose={null}/><primitive object={world.kittenShadow.mesh} dispose={null}/><primitive object={world.paw.group} dispose={null}/><primitive object={world.steam} dispose={null}/>
 <EffectComposer multisampling={4}>{[<primitive key="ink" object={fx.ink} dispose={null}/>,<primitive key="lenspre" object={fx.lens.pre} dispose={null}/>,<primitive key="lens" object={fx.lens.main} dispose={null}/>,<primitive key="bloom" object={fx.bloom} dispose={null}/>,<primitive key="tone" object={fx.tone} dispose={null}/>,<primitive key="grade" object={fx.grade} dispose={null}/>]}</EffectComposer></>;
};
export const ALittleLight:React.FC<SceneTiming>=(props)=><AbsoluteFill style={{background:'#14283c'}}><ThreeCanvas width={1080} height={1920} shadows dpr={1} gl={{antialias:false,stencil:false,powerPreference:'high-performance',toneMappingExposure:1}} camera={{fov:46,near:0.08,far:120}}><Inner {...props}/></ThreeCanvas></AbsoluteFill>;
