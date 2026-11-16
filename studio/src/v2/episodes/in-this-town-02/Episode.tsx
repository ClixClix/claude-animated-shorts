import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {AbsoluteFill,Composition,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction,BloomEffect,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {InkPass,NOINK} from '../../../videos/bridge/ink';
import {GradeEffect,GradeParams} from '../../../videos/bridge/grade';
import {createCatCard} from '../../cats/Cat';
import {catMotion} from '../../cats/pose';
import type {CatId} from '../../cats/designs';
import type {V3} from '../../cafe/config';
import {cardShade} from '../../../videos/bridge/cardshade';
import {CHAR} from '../../../videos/bridge/shade';
import {CARD_K} from '../../../videos/bridge/cardshade';
import {EpisodeWorld} from '../door-at-1111-polish/world';
import {pawRig} from '../door-at-1111-polish/actors';
import {stateAt as previousEpisodeState,DRAFT_SHOTS} from '../door-at-1111-polish/timeline';
import {createEpisodeBox} from './boxProps';
import {SCRATCH_EDIT,stateAt,clamp,ease,type EpisodeEdit,type ActorPose,type State} from './timeline';

const GRADE:GradeParams={ky:[.015,.09,.26,.52,.77,.92,1],sat:[.92,.98,.90],tintS:[.008,.002],tintM:[0,.002],tintH:[-.003,.002],vig:[.10,.4]};
export type BoxEpisodeProps=EpisodeEdit&{previewScale?:number;optimize?:boolean;audioApproved?:boolean};

type Card=ReturnType<typeof createCatCard>;
type Character={id:string;card:Card;newMaterial:T.MeshLambertMaterial;contact:T.Mesh;contactMaterial:T.MeshBasicMaterial;contactGeometry:T.PlaneGeometry};

function makeCharacter(id:string,design:CatId,shading='#ffffff'):Character{
 const card=createCatCard(design,1.45);
 const mat=cardShade(card.mesh.material);
 card.mesh.material=mat;
 mat.side=T.DoubleSide;
 mat.transparent=true;
 mat.depthWrite=false;
 mat.alphaTest=.025;
 mat.color.set(shading);
 card.mesh.name='episode02-'+id;
 card.mesh.layers.set(NOINK);
 const cv=document.createElement('canvas');cv.width=cv.height=128;
 const ctx=cv.getContext('2d')!;
 const grad=ctx.createRadialGradient(64,64,6,64,64,63);
 grad.addColorStop(0,'rgba(32,26,37,0.45)');grad.addColorStop(.58,'rgba(32,26,37,0.18)');grad.addColorStop(1,'rgba(32,26,37,0)');
 ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
 const tex=new T.CanvasTexture(cv);
 const contactMaterial=new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.67,depthWrite:false,side:T.DoubleSide});
 const contactGeometry=new T.PlaneGeometry(.90,.55);
 const contact=new T.Mesh(contactGeometry,contactMaterial);
 contact.name='episode02-'+id+'-floor-contact';
 contact.rotation.x=-Math.PI/2;contact.layers.set(NOINK);
 // Textures are explicitly disposed by the scene effect cleanup.
 return {id,card,newMaterial:mat,contact,contactMaterial,contactGeometry};
}
function updateCharacter(ch:Character,pose:ActorPose,s:State,camera:T.PerspectiveCamera){
 const {card,contact}=ch;
 const p=pose.position,m=clamp(pose.morph);
 card.update({...catMotion(s.t,pose.walking?'walk':'idle',ch.id.length*.07),
  expression:pose.emotion,headTurn:pose.headTurn,gazeY:pose.gazeY,
  headTilt:(pose.emotion==='scared'?.12:pose.emotion==='happy'?-.03:0),
  yaw:pose.walking?.38:0});
 card.mesh.visible=pose.visible&&m<1;
 card.mesh.position.set(p[0],p[1],p[2]);
 const alpha=1-ease(m);
 ch.newMaterial.opacity=Math.max(.02,alpha);
 // Morph is progressive and deterministic. It compresses the original 2D cat silhouette
 // into the box rim while animated cardboard flaps close. No second cat model spawns.
 card.mesh.scale.set((1+.22*m)*pose.scale,(1-.96*m)*pose.scale,1);
 card.mesh.rotation.y=Math.atan2(camera.position.x-p[0],camera.position.z-p[2]);
 card.mesh.rotation.z=(ch.id==='essie'?-.18:.14)*Math.sin(m*Math.PI);
 contact.visible=card.mesh.visible&&m<.9;
 contact.position.set(p[0],p[1]+.012,p[2]);contactMaterialOpacity(ch.contactMaterial,(1-m)*.62);
}
function contactMaterialOpacity(m:T.MeshBasicMaterial,opacity:number){m.opacity=opacity;}

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
 g.font='bold 54px Arial';g.fillText('A CAT BECOME A CAT AGAIN',512,176);
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
 sign.position.set(2.35,2.45,4.60);
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
 const world=useMemo(()=>{
  // Reuse the actual complete Episode 01 city/café geometry. No second café instance.
  const w=new EpisodeWorld(optimize);
  const stable=previousEpisodeState(0,DRAFT_SHOTS);
  w.update(stable);
  for(const n of ['chased-mouse','home-blanket','blanket','fresh-water-bowl','last-bus',
    'latte-hiding-box','welcome-sign','alley-motion','opening-setting-sun','rain-outside-only',
    'door-open-plaque'])w.root.getObjectByName(n)?.traverse(o=>o.visible=false);
  // No attempt to modify the original source files or cache.
  return w;
 },[optimize]);
 const boxes=useMemo(()=>({
  latte:createEpisodeBox('latte'),essie:createEpisodeBox('essie'),shared:createEpisodeBox('shared'),
  demo:createEpisodeBox('essie')
 }),[]);
 boxes.demo.root.name='EPISODE02_RULE_DEMO_BOX';
 const characters=useMemo(()=>({
  mocha:makeCharacter('mocha','mocha'),essie:makeCharacter('essie','essie'),
  latte:makeCharacter('latte','latte'),demo:makeCharacter('rule-demo','essie','#b9a3ae'),
  audience:[makeCharacter('audience-a','latte','#d6c4d1'),makeCharacter('audience-b','essie','#b3a7a0'),
    makeCharacter('audience-c','mocha','#ddb8a9')]
 }),[]);
 const paws=useMemo(()=>({
  mocha:pawRig('#92958d','#fff8e8',.053),
  essie:pawRig('#303039','#f3eddf',.046),
  latte:pawRig('#eadbc0','#5b4944',.047),
 }),[]);
 const gesture=(a:V3,b:V3,active:boolean,id:'mocha'|'essie'|'latte')=>{
  const start:[number,number,number]=[a[0]-.10,a[1]+.52,a[2]];
  paws[id].update(start,b,active);
 };
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
    {color:'#262737',widthNear:2.5*previewScale,widthFar:1.7*previewScale,creaseScale:.55,strength:.8}),
  bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.18,luminanceThreshold:1.08,
    luminanceSmoothing:.25,mipmapBlur:true,levels:5,radius:.5}),
  tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),
  grade:new GradeEffect(GRADE,.7)
 }),[scene,camera,previewScale]);
 atmosphere.root.add(atmosphere.sun,atmosphere.night);
 const cam=camera as T.PerspectiveCamera;
 const camPosition=new T.Vector3(...s.camera);
 // Only subtle motivated pushes on stable cuts; the magic shots are camera-locked.
 if(![3,38,39,49,50,51,54,55].includes(s.shot.sequence)){
  const dir=new T.Vector3(...s.target).sub(camPosition).normalize();
  camPosition.addScaledVector(dir,ease(s.u)*.22);
 }
 cam.position.copy(camPosition);cam.fov=s.fov;cam.near=.08;cam.far=320;
 cam.lookAt(...s.target);cam.updateProjectionMatrix();cam.updateMatrixWorld();
 cam.layers.enable(NOINK);
 scene.background=new T.Color(s.daylight?'#9dbec7':'#172b46');
 scene.fog=new T.Fog(scene.background.clone(),44,245);
 gl.shadowMap.type=T.PCFSoftShadowMap;
 gl.localClippingEnabled=true;
 atmosphere.sun.intensity=s.daylight?2.9:.3;
 atmosphere.night.intensity=s.room==='alley'?26:s.daylight?0:9;
 CHAR.uCharTint.value.set(1,.96,.92);CHAR.uCharShade.value=.88;
 CHAR.uGrad.value=.055;CHAR.uBodyGrad.value=.15;CHAR.uSideTint.value.set(.83,.89,1);
 CARD_K.uPx.value=previewScale;
 world.door.rotation.y=s.shot.sequence===24?-.3:s.shot.sequence===27?-1.18:s.shot.sequence>=53?-1.18:0;
 const boxArray=[
  {key:'latte',obj:boxes.latte,pos:s.latteBox,visible:s.show.latte,flap:s.flap.latte},
  {key:'essie',obj:boxes.essie,pos:s.essieBox,visible:s.show.essie,flap:s.flap.essie},
  {key:'shared',obj:boxes.shared,pos:s.sharedBox,visible:s.show.shared,flap:s.flap.shared},
  {key:'demo',obj:boxes.demo,pos:s.demoBox,visible:s.show.demo,flap:s.flap.demo},
 ] as const;
 for(const b of boxArray){b.obj.root.position.set(...b.pos);b.obj.root.visible=b.visible;b.obj.setOpenAmount(b.flap);}
 updateCharacter(characters.mocha,s.mocha,s,cam);
 updateCharacter(characters.essie,s.essie,s,cam);
 updateCharacter(characters.latte,s.latte,s,cam);
 updateCharacter(characters.demo,s.demoCat,s,cam);
 for(let i=0;i<3;i++){
  const c=characters.audience[i],n=s.shot.sequence;
  const active=n===4||n===56||n===57;
  const positions:V3[]=n===4?[[1.9,0,7.2],[4.9,0,8.1],[4.8,0,6.7]]:
    [[-1.8,0,7.1],[-.2,0,8.1],[3.3,0,8.3]];
  updateCharacter(c,{position:positions[i],visible:active,walking:false,emotion:n===4?'surprised':'happy',headTurn:0,scale:.84,morph:0,gazeY:0},s,cam);
 }
 const n=s.shot.sequence;
 props.board.visible=n===57;
 props.sign.visible=n===24;
 props.treat.visible=n===16;
 const mp=s.mocha.position,ep=s.essie.position,lp=s.latte.position;
 let mochaTarget:V3=[mp[0]-.25,mp[1]+.34,mp[2]+.16];
 let essieTarget:V3=[ep[0]-.2,ep[1]+.33,ep[2]+.14];
 let latteTarget:V3=[lp[0]-.2,lp[1]+.35,lp[2]+.15];
 let mochaReach=false,essieReach=false,latteReach=false;
 if([12,16,41,48,49,54,59].includes(n)){
  const box=n<=16?s.latteBox:n<=49?s.essieBox:n===54?s.latteBox:s.sharedBox;
  const top=n<=16?.72:n<=49?.84:n===54?.72:.90;
  mochaTarget=[box[0]+.35,box[1]+top,box[2]+.25];
  mochaReach=true;
 }
 if(n===20){mochaTarget=[ep[0]-.16,ep[1]+.6,ep[2]+.05];mochaReach=true;}
 if(n===33){mochaTarget=[mp[0]-.4,mp[1]+.75,mp[2]-.28];mochaReach=true;}
 if(n===42||n===51){mochaTarget=[s.essieBox[0]+.55,.6,s.essieBox[2]+.05];mochaReach=true;}
 if(n===32){
  essieTarget=[s.essieBox[0]+.52,.49,s.essieBox[2]+.35];essieReach=true;
 }
 if(n===54){
  essieTarget=[s.latteBox[0]+.26,.77,s.latteBox[2]+.33];essieReach=true;
 }
 if(n===55){
  latteTarget=[mp[0]+.04,.62,mp[2]-.07];latteReach=true;
 }
 gesture(mp,mochaTarget,mochaReach&&s.mocha.visible,'mocha');
 gesture(ep,essieTarget,essieReach&&s.essie.visible,'essie');
 gesture(lp,latteTarget,latteReach&&s.latte.visible,'latte');
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
  for(const c of [characters.mocha,characters.essie,characters.latte,characters.demo,...characters.audience]){
   c.card.dispose();c.newMaterial.dispose();c.contactMaterial.map?.dispose();
   c.contactMaterial.dispose();c.contactGeometry.dispose();
  }
  for(const p of dust.arr){p.geo.dispose();p.mat.dispose();}
  Object.values(paws).forEach(p=>p.dispose());
  props.dispose();atmosphere.sun.dispose();atmosphere.night.dispose();
  effects.ink.dispose();effects.bloom.dispose();effects.tone.dispose();effects.grade.dispose();
 },[world,boxes,characters,dust,atmosphere,effects,paws,props]);
 return <><primitive object={world.root} dispose={null}/>
  <primitive object={atmosphere.root} dispose={null}/>
  {Object.values(boxes).map(b=><primitive key={b.root.name} object={b.root} dispose={null}/>)}
  {[characters.mocha,characters.essie,characters.latte,characters.demo,...characters.audience].map(c=>
   <React.Fragment key={c.id}><primitive object={c.card.mesh} dispose={null}/>
    <primitive object={c.contact} dispose={null}/></React.Fragment>)}
  {Object.entries(paws).map(([id,p])=><primitive key={id} object={p.group} dispose={null}/>)}
  <primitive object={props.root} dispose={null}/>
  <primitive object={dust.root} dispose={null}/>
  <EffectComposer multisampling={4}>
   <primitive object={effects.ink} dispose={null}/>
   <primitive object={effects.bloom} dispose={null}/>
   <primitive object={effects.tone} dispose={null}/>
   <primitive object={effects.grade} dispose={null}/>
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
export const BoxEpisode:React.FC<BoxEpisodeProps>=props=><AbsoluteFill style={{background:'#172b46'}}>
 <ThreeCanvas width={1080} height={1920} dpr={props.previewScale??1}
  shadows gl={{antialias:false,stencil:false,powerPreference:'high-performance',toneMappingExposure:1}}
  camera={{near:.08,far:320,fov:48}}>
  <Inner {...props}/>
 </ThreeCanvas>
 <Captions captions={props.captions??[]}/>
</AbsoluteFill>;
export const BoxEpisodeComposition:React.FC=()=>{
 const props:BoxEpisodeProps={...SCRATCH_EDIT,previewScale:1,optimize:true,audioApproved:false};
 return <Composition id="InThisTownEpisode02Box" component={BoxEpisode} defaultProps={props}
  calculateMetadata={({props:p})=>({durationInFrames:p.shots.at(-1)?.end??3876})}
  durationInFrames={3876} width={1080} height={1920} fps={30}/>;
};
