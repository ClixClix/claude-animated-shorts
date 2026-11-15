import {TownPopulation} from './population';
import captions from './captions.json';
import React,{useEffect,useMemo} from 'react';
import edit from './edit.json';
import * as T from 'three';
import {AbsoluteFill,Composition,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction,BloomEffect,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {InkPass,NOINK} from '../../../videos/bridge/ink';
import {LensBlur} from '../../../videos/bridge/lensblur';
import {GradeEffect,GradeParams} from '../../../videos/bridge/grade';
import {CHAR} from '../../../videos/bridge/shade';
import {CARD_K} from '../../../videos/bridge/cardshade';
import {createKitten} from '../../animation/kitten';
import {storyAt} from '../../animation/timeline';
import {CatId} from '../../cats/designs';
import {V3} from '../../cafe/config';
import {EpisodeWorld} from './world';
import {checkEpisodeCamera} from './cameraQA';
import {createEpisodeCat,contactShadow,pawRig} from './actors';
import {EpisodeShot,DRAFT_SHOTS,DOOR_PUSH_WINDOWS,doorAngleAt,stateAt,validateShots,LANTERN,HOME,CLOCK,SIGN,KITTEN_WAIT,KITTEN_REST,KITTEN_PATH,pointByDistance,supportHeight,kittenRevealed,beat,mix,lerp,clamp} from './timeline';
const GRADE:GradeParams={ky:[.015,.09,.26,.52,.77,.92,1],sat:[.92,.98,.90],tintS:[.008,.002],tintM:[0,.002],tintH:[-.003,.002],vig:[.10,.4]};
export type EpisodeProps={previewScale?:number;optimize?:boolean;shots:EpisodeShot[];cues?:{taps:number[]}};
const Inner:React.FC<EpisodeProps>=({shots,cues,optimize=true,previewScale=1})=>{
 const frame=useCurrentFrame(),s=stateAt(frame,shots,cues?.taps),{camera,scene,gl}=useThree();
 if(cues&&s.shot.number!==47)s.kittenTap=Math.max(0,...cues.taps.map(f=>1-Math.abs(frame-f)/6));
 const w=useMemo(()=>new EpisodeWorld(optimize),[optimize]);
 const population=useMemo(()=>new TownPopulation(),[]);population.update(s);const earlierInsert=s.shot.number===58&&s.shot.variant===0||s.shot.number===59&&s.shot.variant===1;population.root.visible=!earlierInsert;
 const cast=useMemo(()=>(['mocha','essie','latte'] as CatId[]).map(id=>({id,card:createEpisodeCat(id),shadow:contactShadow()})),[]);
 const kitten=useMemo(()=>createKitten(),[]),kittenShadow=useMemo(()=>contactShadow(.42,.29),[]);
 const paws=useMemo(()=>({mocha:pawRig('#92958d','#fff8e8',.054),essie:pawRig('#303039','#eee6d7',.045),latte:pawRig('#c8b99f','#5a463f',.047),kitten:pawRig('#c6ad87','#fff0d1',.023)}),[]);
 const splashes=useMemo(()=>Array.from({length:2},()=>{const geo=new T.BufferGeometry().setFromPoints(Array.from({length:32},(_,i)=>new T.Vector3(Math.cos(i/32*Math.PI*2),Math.sin(i/32*Math.PI*2),0)));const mat=new T.LineBasicMaterial({color:'#aabdc8',transparent:true,opacity:.2,depthWrite:false});const line=new T.LineLoop(geo,mat);line.rotation.x=-Math.PI/2;line.layers.set(NOINK);return {line,mat};}),[]);
 const projected=useMemo(()=>{
  const mocha=cast.find(c=>c.id==='mocha')!.card;
  const planes=[new T.Plane(new T.Vector3(1,0,0),3.67),new T.Plane(new T.Vector3(-1,0,0),.77),new T.Plane(new T.Vector3(0,1,0),-.8),new T.Plane(new T.Vector3(0,-1,0),3.65)];
  const mat=new T.MeshBasicMaterial({map:mocha.texture,color:'#000000',transparent:true,opacity:.74,side:T.DoubleSide,depthWrite:false,clippingPlanes:planes});
  const cat=new T.Mesh(mocha.mesh.geometry.clone(),mat);cat.layers.set(NOINK);cat.renderOrder=2;
  const clothMat=new T.MeshBasicMaterial({color:'#151c28',transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false,clippingPlanes:planes});
  const cloth=new T.Mesh(w.blanket.geometry.clone(),clothMat);cloth.layers.set(NOINK);cloth.renderOrder=2;
  return {cat,cloth,mat,clothMat};
 },[cast,w]);
 const fx=useMemo(()=>({ink:new InkPass(scene,camera as T.PerspectiveCamera,{color:'#262737',widthNear:2.5*previewScale,widthFar:1.7*previewScale,creaseScale:.55,strength:.8}),lens:new LensBlur({maxCoC:8,nearScale:.5}),bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.18,luminanceThreshold:1.05,luminanceSmoothing:.25,mipmapBlur:true,levels:5,radius:.5}),tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),grade:new GradeEffect(GRADE,.7)}),[scene,camera]);
 const cam=camera as T.PerspectiveCamera;cam.position.set(...s.camera);cam.fov=s.fov;cam.near=.08;cam.far=220;cam.lookAt(...s.target);cam.layers.enable(NOINK);cam.updateProjectionMatrix();cam.updateMatrixWorld();
 const openingEnd=shots.filter(q=>q.number===1).at(-1)!.end,dusk=s.shot.number===1?1-beat(frame,0,openingEnd*.85):0;scene.background=new T.Color('#14283c').lerp(new T.Color('#aa756b'),dusk*.65);scene.fog=new T.Fog('#21364a',38,145);gl.shadowMap.type=T.PCFSoftShadowMap;gl.localClippingEnabled=true;
 CHAR.uCharTint.value.set(1,.96,.92);CHAR.uCharShade.value=.88;CHAR.uGrad.value=.055;CHAR.uBodyGrad.value=.15;CHAR.uSideTint.value.set(.80,.88,1);CARD_K.uPx.value=previewScale;
 fx.lens.focus=new T.Vector3(...s.target).sub(cam.position).dot(cam.getWorldDirection(new T.Vector3()));fx.lens.cInf=s.blur;
 w.update(s);
 // Exact influence-volume culling: finite-distance point lights contribute zero outside their sphere.
 // This preserves the light field while avoiding invisible lights in software-rendered close-ups.
 if(optimize){w.root.updateMatrixWorld(true);const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));w.root.traverse(o=>{if(o instanceof T.PointLight)o.visible=o.intensity>0&&(o.distance<=0||frustum.intersectsSphere(new T.Sphere(o.getWorldPosition(new T.Vector3()),o.distance)));});}

 cast.forEach(c=>{const a=s[c.id];c.card.updateActor(a,s);c.card.mesh.visible=(!earlierInsert||c.id==='mocha')&&(c.id==='latte'||s.shot.number>=50)&&!(c.id==='latte'&&[39,40,41].includes(s.shot.number))&&!(s.shot.number===59&&s.shot.variant===0);c.card.legs.visible=c.card.mesh.visible&&a.moving;c.shadow.mesh.visible=c.card.mesh.visible;c.shadow.mesh.position.set(a.position[0],supportHeight(a.position,c.id==='latte'?0:c.id==='essie'?2:1)+.008,a.position[2]);});
 for(let i=0;i<2;i++){const phase=(s.latte.travel/.32+i*.5)%1,u=phase/.18,p=s.latte.feet[i+2],splash=splashes[i];splash.line.visible=s.rain>0&&s.t>=39.5&&s.t<54&&phase<.18;splash.line.position.set(p[0],supportHeight(p,0)+.005,p[2]);splash.line.scale.setScalar(.035+.14*u);splash.mat.opacity=.30*(1-clamp(u));}
 const kid=s.kitten,feet:V3[]=[[-.045,0,0],[.045,0,0]].map((p,i)=>{
  if(!s.kittenWalking)return [kid[0]+p[0],kid[1],kid[2]] as V3;
  const length=Math.hypot(KITTEN_REST[0]-KITTEN_WAIT[0],KITTEN_REST[2]-KITTEN_WAIT[2]),cycle=s.kittenTravel/.18+i*.5,step=Math.floor(cycle),phase=cycle-step;
  const sample=(n:number)=>pointByDistance(Math.max(0,(n-i*.5+.3)*.18),KITTEN_PATH);
  const a=sample(step),b=sample(step+1),u=clamp((phase-.58)/.42),pos=phase<=.58?a:mix(a,b,u*u*(3-2*u));pos[0]+=p[0];pos[1]=supportHeight(pos,0);if(phase>.58)pos[1]+=Math.sin(Math.PI*u)*.03;return pos;
 });
 const ks={...storyAt(0),frame:s.t*30,shot:4 as const,camera:s.camera,target:s.target,kitten:kid,kittenFear:s.kittenFear,kittenSmile:s.kittenSmile,kittenBlink:Math.max(0,1-Math.abs((s.t%4.2)-3.9)/.09),kittenLook:0,kittenWalking:s.kittenWalking,kittenGait:s.kittenTravel/.18*Math.PI*2,kittenLift:s.shot.number===47?Math.max(0,kid[1]-.03):0};
 kitten.update(ks,frame,{feet:s.kittenWalking?undefined:feet,gazeX:s.t>123?-.45:.10,gazeY:s.shot.number===47?-.65:s.t>123?-.4:0,earDrop:s.kittenFear*.7,headTilt:s.t>123?-.08:0});// Episode-only wet-coat glints and a timed meow articulation; the original kitten component stays intact.
 const kc=kitten.mesh.material.map!.image as HTMLCanvasElement,kg=kc.getContext('2d')!;kg.save();kg.setTransform(2,0,0,2,0,0);kg.translate(210,0);
 const wet=1-beat(s.t,124,132);kg.globalAlpha=.52*wet;kg.strokeStyle='#b9d0d6';kg.lineWidth=1.2;kg.lineCap='round';
 for(const [x,y] of [[-64,338],[61,355],[-59,392],[58,419],[-43,375],[-31,155],[35,166],[-49,202],[52,223],[20,388]]){kg.beginPath();kg.moveTo(x,y);kg.lineTo(x-1,y+9);kg.stroke();}
 kg.globalAlpha=1;const meow=Math.max(0,...[83,94,122.7].map(t=>Math.sin(Math.PI*clamp((s.t-t)/.63))));
 if(meow>.02){kg.translate(0,244+Math.sin(frame/30*3.2)*(s.kittenFear?1.4:1));kg.rotate(s.t>123?-.08:0);kg.fillStyle='#fff0d1';kg.beginPath();kg.ellipse(0,50,19,9,0,0,Math.PI*2);kg.fill();kg.fillStyle='#674449';kg.strokeStyle='#292737';kg.lineWidth=2;kg.beginPath();kg.ellipse(0,49,4+2*meow,2+6*meow,0,0,Math.PI*2);kg.fill();kg.stroke();}
 kg.restore();kitten.mesh.material.map!.needsUpdate=true;
 kitten.mesh.position.set(...kid);kitten.mesh.rotation.y=Math.atan2(s.camera[0]-kid[0],s.camera[2]-kid[2]);kitten.mesh.visible=kittenRevealed(s)&&!earlierInsert;
 kittenShadow.mesh.visible=kitten.mesh.visible;kittenShadow.mesh.position.set(kid[0],s.shot.number===47?.038:kid[1]+.008,kid[2]);
 kitten.mesh.material.color.setRGB(lerp(.77,1,beat(s.t,119,125)),lerp(.83,1,beat(s.t,119,125)),lerp(.88,1,beat(s.t,119,125)));
 const h=w.handle(),tap=w.tapPoint(),pushPoint=w.pushPoint();
 const mp=s.mocha.position,ep=s.essie.position,lp=s.latte.position;
 const clothHand=new T.Vector3().fromBufferAttribute(w.blanket.geometry.getAttribute('position'),13).toArray() as V3;
 const carriesCloth=s.t>=108&&s.t<121.6,restHand:V3=carriesCloth?clothHand:[mp[0]+.22,mp[1]+.36,mp[2]+.08];
 const pushCycle=DOOR_PUSH_WINDOWS.find(([a,b])=>s.t>=a-.2&&s.t<=b+.4);
 let contactPoint=pushPoint.clone();if(pushCycle&&s.t>pushCycle[1]){const matrix=new T.Matrix4().compose(w.door.position,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-doorAngleAt(pushCycle[1])),w.door.scale);matrix.premultiply(w.door.parent!.matrixWorld);contactPoint=new T.Vector3(.90,.52,-.07).applyMatrix4(matrix);}
 const pushAmount=pushCycle?beat(s.t,pushCycle[0]-.2,pushCycle[0])*(1-beat(s.t,pushCycle[1],pushCycle[1]+.4)):0;
 const lightReach=beat(s.t,131.35,131.55)*(1-beat(s.t,131.7,132.0));
 paws.mocha.update([mp[0]-.15,mp[1]+.38,mp[2]+.08],lightReach>0?mix([mp[0]-.15,mp[1]+.38,mp[2]+.08],[-3.90,.7,1.25],lightReach):mix(restHand,contactPoint.toArray() as V3,pushAmount),lightReach>.01||pushAmount>.01&&s.shot.number>=50);
 const bowlHand:V3=[s.bowl[0]+.11,s.bowl[1]+.12,s.bowl[2]],release=beat(s.t,118.65,119.25);
 paws.essie.update([ep[0]-.08,ep[1]+.52,ep[2]],mix(bowlHand,[ep[0]-.15,ep[1]+.38,ep[2]],release),false);
 const shoulder:V3=[lp[0]+.16,lp[1]+.49,lp[2]-.04],rest:V3=[lp[0]+.20,lp[1]+.42,lp[2]-.04];
 const comfort=0,tremble=s.t>=91.5&&s.t<=94.5;
 paws.latte.update(tremble?[lp[0]+.16,lp[1]+.49,lp[2]+.03]:shoulder,tremble?[lp[0]+.10+Math.sin(s.t*25)*.008,lp[1]+.40+Math.sin(s.t*21)*.006,lp[2]+.12]:comfort>0?mix(rest,[kid[0]-.12,kid[1]+.22,kid[2]],comfort):mix(rest,[HOME.switch[0]-.14,HOME.switch[1],HOME.switch[2]],s.switchReach),comfort>.01||tremble);
 const kidRight=new T.Vector3(cam.position.z-kid[2],0,-(cam.position.x-kid[0])).normalize();
 const kittenShoulder:V3=[kid[0]-kidRight.x*.14,kid[1]+.21,kid[2]-kidRight.z*.14],kidRest:V3=[kid[0]-kidRight.x*.10,kid[1]+.12,kid[2]-kidRight.z*.10];
 paws.kitten.update(kittenShoulder,mix(kidRest,s.shot.number===47?mix(kidRest,h.toArray() as V3,.42):tap.toArray() as V3,s.kittenTap),false);
 // True perspective projection of Mocha's actual approved alpha silhouette and the actual blanket.
 // The source is the fixed backup lantern; no replacement monster is drawn.
 const source=new T.Vector3(LANTERN[0],LANTERN[1]+.30,LANTERN[2]),factor=(4.258-source.z)/(mp[2]-source.z);
 projected.cat.position.copy(source).addScaledVector(new T.Vector3(...mp).sub(source),factor);projected.cat.scale.setScalar(factor);projected.cat.rotation.set(0,0,0);
 const original=w.blanket.geometry.getAttribute('position'),dest=projected.cloth.geometry.getAttribute('position');
 for(let i=0;i<dest.count;i++){const p=new T.Vector3().fromBufferAttribute(original,i),f=(4.259-source.z)/Math.max(.08,p.z-source.z);p.sub(source).multiplyScalar(f).add(source);dest.setXYZ(i,p.x,p.y,p.z);}dest.needsUpdate=true;projected.cloth.geometry.computeBoundingBox();projected.cloth.geometry.computeBoundingSphere();
 projected.cat.visible=projected.cloth.visible=s.t<108;projected.mat.opacity=s.t<26.5?.46:.78;
 useEffect(()=>{
  w.root.updateMatrixWorld(true);population.root.updateMatrixWorld(true);cast.forEach(c=>c.card.mesh.updateMatrixWorld(true));kitten.mesh.updateMatrixWorld(true);
  const {visibility,cameraHits}=checkEpisodeCamera(w,s,cam,[...cast.map(c=>({id:c.id,mesh:c.card.mesh})),{id:'kitten',mesh:kitten.mesh},...population.actors]);
  const audit={frame,shot:s.shot.id,sourceShot:s.shot.number,baseFrame:s.t*30,camera:s.camera,target:s.target,visibility,cameraHits,latte:lp,mocha:mp,essie:ep,kitten:kid,feet:{latte:s.latte.feet,latteKeys:s.latte.footKeys},bowl:s.bowl,bowlContact:s.bowlContact,door:s.door,failed:s.failed,clock:s.clock,flashback:s.flashback,openerVisible:cast.find(c=>c.id==='mocha')!.card.mesh.visible||paws.mocha.group.visible,kittenVisible:kitten.mesh.visible,earlyInteriorVisible:s.shot.number<50&&(cast.find(c=>c.id==='essie')!.card.mesh.visible||population.actors.slice(2,4).some(c=>c.mesh.visible)),kittenPawVisible:paws.kitten.group.visible,streetResidentsVisible:population.actors.slice(0,2).some(c=>c.mesh.visible),shadow:{source:source.toArray(),sourceCharacter:'approved-mocha-texture',factor,blanket:'actual-cloth-geometry'},counterRoles:[...w.cafe.fixtures].filter(([,o])=>o.userData.role?.includes('counter')).map(([id,o])=>({id,role:o.userData.role}))};
  (window as unknown as {__EPISODE_AUDIT:unknown}).__EPISODE_AUDIT=audit;console.log('EPISODE_AUDIT '+JSON.stringify(audit));
 },[frame,w,cast,kitten,cam]);
 useEffect(()=>()=>{w.dispose();population.dispose();cast.forEach(c=>{c.card.dispose();c.shadow.dispose();});kitten.dispose();kittenShadow.dispose();Object.values(paws).forEach(p=>p.dispose());projected.cat.geometry.dispose();projected.cloth.geometry.dispose();projected.mat.dispose();projected.clothMat.dispose();fx.ink.dispose();fx.lens.pre.dispose();fx.lens.main.dispose();fx.bloom.dispose();fx.tone.dispose();fx.grade.dispose();splashes.forEach(p=>{p.line.geometry.dispose();p.mat.dispose();});},[w,cast,kitten,kittenShadow,paws,projected,fx,splashes]);
 return <><primitive object={population.root} dispose={null}/><primitive object={w.root} dispose={null}/>{cast.map(c=><React.Fragment key={c.id}><primitive object={c.card.legs} dispose={null}/><primitive object={c.card.mesh} dispose={null}/><primitive object={c.shadow.mesh} dispose={null}/></React.Fragment>)}<primitive object={kitten.mesh} dispose={null}/><primitive object={kittenShadow.mesh} dispose={null}/>{Object.entries(paws).map(([id,p])=><primitive key={id} object={p.group} dispose={null}/>)}{splashes.map((p,i)=><primitive key={'splash-'+i} object={p.line} dispose={null}/>)}<primitive object={projected.cat} dispose={null}/><primitive object={projected.cloth} dispose={null}/><EffectComposer multisampling={4}>{[<primitive key="ink" object={fx.ink} dispose={null}/>,...(s.blur>0?[<primitive key="pre" object={fx.lens.pre} dispose={null}/>,<primitive key="lens" object={fx.lens.main} dispose={null}/>]:[]),<primitive key="bloom" object={fx.bloom} dispose={null}/>,<primitive key="tone" object={fx.tone} dispose={null}/>,<primitive key="grade" object={fx.grade} dispose={null}/>]}</EffectComposer></>;
};
export const DoorEpisode:React.FC<EpisodeProps>=props=><AbsoluteFill style={{background:'#14283c'}}><ThreeCanvas width={1080} height={1920} dpr={props.previewScale??1} shadows gl={{antialias:false,stencil:false,powerPreference:'high-performance',toneMappingExposure:1}} camera={{near:.08,far:220,fov:48}}><Inner {...props}/></ThreeCanvas><EpisodeCaptions/></AbsoluteFill>;
export const DoorPolishComposition:React.FC=()=><Composition id="InThisTownTheDoorAt1111Polish" component={DoorEpisode} defaultProps={edit as EpisodeProps} calculateMetadata={({props})=>{validateShots(props.shots);return {durationInFrames:props.shots.at(-1)!.end};}} durationInFrames={edit.shots.at(-1)!.end} width={1080} height={1920} fps={30}/>;

const EpisodeCaptions:React.FC=()=>{const frame=useCurrentFrame(),cue=captions.find(c=>frame>=c.start&&frame<c.end);return cue?<div style={{position:'absolute',left:90,right:90,bottom:500,textAlign:'center',fontFamily:'Arial, sans-serif',fontSize:64,fontWeight:800,lineHeight:1.16,color:'#fff9ed',WebkitTextStroke:'3px #18202a',paintOrder:'stroke fill',textShadow:'0 3px 8px #101820',pointerEvents:'none'}}>{cue.text}</div>:null;};
