import * as T from 'three';
import {drawCat} from '../../cats/drawCat';
import {catMotion,type CatPose} from '../../cats/pose';
import {type CatDesign} from '../../cats/designs';
import {cardShade} from '../../../videos/bridge/cardshade';
import {NOINK} from '../../../videos/bridge/ink';

/**
 * Reusable, independently animated 2.5D performer.
 * Head, barrel, tail and four legs are distinct, separately keyed planes.
 * The head comes from the approved Episode 01 Cat illustrator and is only
 * cropped to its own sprite, not redrawn as a generic circle.
 *
 * Frame evaluation is pure in absolute time: Remotion can render any frame
 * out of order and still obtain identical bone locations/contact state.
 */
export type GuestStage='approach'|'anticipate'|'flight'|'landing'|'settled';
export type GuestRigPose={
 x:number;y:number;z:number;stage:GuestStage;walk:number;
 crouch:number;flight:number;landing:number;headTilt:number;
 gaze:number;tail:number;visible:boolean;
};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const SHOT01_PROOF_FRAMES=78;
export const SHOT01_PROOF_FPS=30;

/** Four deliberate movement phases, 2.6 seconds, no one-frame teleport.
 *  The near-side box wall must be cleared before lateral entry.
 */
export function shot01Pose(frame:number,box:[number,number,number]):GuestRigPose{
 const t=Math.max(0,frame)/SHOT01_PROOF_FPS;
 const x=box[0],z=box[2];
 const approach=ease(t/.66);
 const crouch=ease((t-.66)/.27)*(1-ease((t-.92)/.11));
 const jump=clamp((t-.96)/.93);
 const flight=t>=.96&&t<1.89;
 const land=ease((t-1.89)/.30);
 const settle=ease((t-2.18)/.36);
 // Delay lateral motion until the feet are ABOVE the near cardboard rim.
 const progressed=flight?ease((jump-.18)/.76):t>=1.89?1:0;
 const jumpHeight=flight?.83*Math.sin(Math.PI*jump)+.06*ease((jump-.82)/.18):0;
 const sx=flight?mix(x-.96,x,progressed):t>=1.89?x:mix(x-1.25,x-.96,approach);
 const footHeight=t>=1.89?mix(.10,.085,land):.04+jumpHeight;
 return {
  x:sx,y:footHeight,z,
  stage:flight?'flight':t<.66?'approach':t<.96?'anticipate':t<2.19?'landing':'settled',
  walk:t<.66?1:0,crouch:crouch*.23+settle*.20,
  flight:flight?Math.sin(Math.PI*jump):0,
  landing:land,headTilt:flight?-.16*Math.sin(Math.PI*jump):mix(.03,-.09,settle),
  gaze:flight?.24:mix(.42,.12,approach),
  tail:t<.96?Math.sin(t*8)*.24:Math.sin(t*4)*.16,
  visible:true
 };
}

type Card={mesh:T.Mesh<T.PlaneGeometry,T.MeshLambertMaterial>;
 canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;
 texture:T.CanvasTexture;material:T.MeshLambertMaterial;dispose:()=>void};
function createCard(w:number,h:number,worldW:number,worldH:number,
 draw:(g:CanvasRenderingContext2D)=>void):Card{
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas 2D missing');
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 texture.anisotropy=8;
 const material=cardShade(new T.MeshLambertMaterial({
  map:texture,transparent:true,alphaTest:.055,side:T.DoubleSide,depthWrite:false
 }));
 const mesh=new T.Mesh(new T.PlaneGeometry(worldW,worldH),material);
 mesh.layers.set(NOINK);
 const redraw=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
  draw(ctx);texture.needsUpdate=true;};
 redraw();
 return {mesh,canvas,ctx,texture,material,dispose:()=>{
  mesh.removeFromParent();mesh.geometry.dispose();material.dispose();texture.dispose();
 }};
}
const ink='#292737';
function ell(g:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,
 fill:string|CanvasGradient,stroke=3.6){
 g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);
 g.fillStyle=fill;g.fill();if(stroke){g.lineWidth=stroke;g.strokeStyle=ink;g.stroke();}
}
function paintBody(g:CanvasRenderingContext2D,c:CatDesign){
 g.setTransform(2,0,0,2,0,0);
 const shade=g.createLinearGradient(45,55,220,236);
 shade.addColorStop(0,c.light);shade.addColorStop(.68,c.coat);
 shade.addColorStop(1,c.shadow);
 ell(g,128,133,101,106,shade,4.2);
 // Curved painted belly and chest ruff from Episode 01's palette/ink idiom.
 g.beginPath();g.moveTo(105,52);g.bezierCurveTo(76,86,61,158,101,215);
 g.bezierCurveTo(144,232,173,173,160,92);
 g.bezierCurveTo(140,75,122,66,105,52);
 g.closePath();g.fillStyle=c.bib;g.fill();
 g.strokeStyle=c.shadow;g.lineWidth=2.2;g.stroke();
 g.strokeStyle=c.shadow;g.lineWidth=3;
 g.beginPath();g.moveTo(48,125);g.quadraticCurveTo(46,170,78,205);
 g.moveTo(210,114);g.quadraticCurveTo(224,164,191,201);g.stroke();
}
function paintPaw(g:CanvasRenderingContext2D,c:CatDesign,far:boolean){
 g.setTransform(2,0,0,2,0,0);
 const color=far?c.shadow:c.coat;
 const gr=g.createLinearGradient(90,20,170,246);
 gr.addColorStop(0,far?c.coat:c.light);gr.addColorStop(1,color);
 g.beginPath();g.moveTo(102,24);g.quadraticCurveTo(76,40,89,93);
 g.lineTo(89,185);g.quadraticCurveTo(81,225,127,233);
 g.quadraticCurveTo(182,240,174,184);g.lineTo(163,74);
 g.quadraticCurveTo(158,25,102,24);g.closePath();
 g.fillStyle=gr;g.fill();g.strokeStyle=ink;g.lineWidth=5;g.stroke();
 g.beginPath();g.ellipse(130,210,49,25,0,0,Math.PI*2);
 g.fillStyle=c.bib;g.fill();g.lineWidth=2.6;g.stroke();
 g.beginPath();g.moveTo(118,212);g.lineTo(117,230);
 g.moveTo(141,213);g.lineTo(142,230);g.strokeStyle=c.shadow;g.stroke();
}
function paintTail(g:CanvasRenderingContext2D,c:CatDesign){
 g.setTransform(2,0,0,2,0,0);
 g.beginPath();g.moveTo(120,243);
 g.bezierCurveTo(52,211,52,148,92,117);
 g.bezierCurveTo(127,90,161,108,168,55);
 g.bezierCurveTo(175,37,212,32,217,63);
 g.bezierCurveTo(215,129,174,159,146,157);
 g.bezierCurveTo(126,182,150,223,145,243);
 g.closePath();g.fillStyle=c.coat;g.fill();
 g.strokeStyle=ink;g.lineWidth=5;g.stroke();
 g.beginPath();g.moveTo(140,224);g.bezierCurveTo(104,167,128,142,171,118);
 g.strokeStyle=c.light;g.lineWidth=4;g.stroke();
}

export function createArticulatedGuest(design:CatDesign){
 const root=new T.Group();root.name='episode02-articulated-guest';
 const torsoPivot=new T.Group();torsoPivot.name='torso-bone';root.add(torsoPivot);
 const torso=createCard(512,512,.75,.80,g=>paintBody(g,design));
 torso.mesh.name='painted-torso';torso.mesh.position.set(0,.56,0);
 torsoPivot.add(torso.mesh);
 const headPivot=new T.Group();headPivot.name='head-neck-bone';root.add(headPivot);
 headPivot.position.set(0,1.025,.055);
 const head=createCard(680,660,1.02,.99,()=>{});
 head.mesh.name='episode01-illustrated-head';head.mesh.position.set(0,0,.09);
 headPivot.add(head.mesh);
 const tailPivot=new T.Group();tailPivot.name='tail-bone';root.add(tailPivot);
 tailPivot.position.set(-.34,.61,-.06);
 const tail=createCard(512,512,.53,.61,g=>paintTail(g,design));
 tail.mesh.name='painted-tail';tail.mesh.position.set(-.18,.20,-.015);
 tailPivot.add(tail.mesh);
 type Paw={pivot:T.Group;card:Card;footX:number;far:boolean};
 const paws:Paw[]=Array.from({length:4},(_,i)=>{
  const far=i<2,footX=i%2===0?-.26:.25;
  const pivot=new T.Group();
  pivot.name='paw-bone-'+i;
  root.add(pivot);
  const card=createCard(512,512,.215,.34,g=>paintPaw(g,design,far));
  card.mesh.name='grounded-paw-'+i;
  card.mesh.position.set(0,.16,far?-.07:.1);
  pivot.add(card.mesh);
  return {pivot,card,footX,far};
 });
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
 const sh=shadowCanvas.getContext('2d')!;
 const radial=sh.createRadialGradient(64,64,4,64,64,61);
 radial.addColorStop(0,'rgba(24,24,29,.36)');
 radial.addColorStop(1,'rgba(24,24,29,0)');
 sh.fillStyle=radial;sh.fillRect(0,0,128,128);
 const shadowTexture=new T.CanvasTexture(shadowCanvas);
 const shadowMat=new T.MeshBasicMaterial({
  map:shadowTexture,transparent:true,depthWrite:false,side:T.DoubleSide
 });
 const shadow=new T.Mesh(new T.PlaneGeometry(.8,.52),shadowMat);
 shadow.name='ground-contact';shadow.layers.set(NOINK);
 shadow.rotation.x=-Math.PI/2;root.add(shadow);
 const update=(frame:number,box:[number,number,number],camera:T.Vector3)=>{
  const pose=shot01Pose(frame,box);
  root.visible=pose.visible;root.position.set(pose.x,pose.y,pose.z);
  root.rotation.y=Math.atan2(camera.x-pose.x,camera.z-pose.z);
  const t=frame/SHOT01_PROOF_FPS;
  const walkCycle=t*2*Math.PI*2.5;
  torsoPivot.position.y=-pose.crouch*.25+pose.flight*.055;
  torsoPivot.rotation.z=pose.flight?-.13:pose.crouch*.12;
  torso.mesh.scale.set(1+pose.crouch*.10,1-pose.crouch*.14,1);
  headPivot.position.y=1.025-pose.crouch*.38+pose.flight*.07-pose.landing*.07;
  headPivot.rotation.z=pose.headTilt;
  tailPivot.rotation.z=pose.tail+(pose.flight?-.24:0);
  paws.forEach(({pivot,footX,far},i)=>{
   const phase=walkCycle+(i===0||i===3?0:Math.PI);
   const stride=pose.walk*.095*Math.sin(phase);
   const lift=pose.walk*.07*Math.max(0,Math.cos(phase));
   const tuck=pose.flight*.16;
   pivot.position.set(footX+stride, lift+tuck,far?-.035:.085);
   pivot.rotation.z=pose.flight?(i%2?-.35:.38):0;
  });
  // Redraw ONLY the face texture; all other painted parts stay independently
  // articulated and anchored. Use the same approved Episode 01 head renderer.
  head.ctx.setTransform(1,0,0,1,0,0);head.ctx.clearRect(0,0,680,660);
  head.ctx.setTransform(2,0,0,2,-160,-60);
  const motion:Partial<CatPose>={
   ...catMotion(t,pose.walk?'walk':'idle',.18),
   expression:pose.stage==='flight'?'surprised':pose.stage==='settled'?'happy':'neutral',
   yaw:.06,headTurn:pose.gaze,headTilt:pose.headTilt*.6,
   gazeX:pose.gaze,blink:pose.stage==='anticipate'?.12:0
  };
  drawCat(head.ctx,'essie',motion,true,design);
  head.texture.needsUpdate=true;
  // Contact shadow stays on real sidewalk, shrinks/softens visually in flight.
  shadow.position.set(0,.018-pose.y,0);
  shadow.scale.setScalar(1-pose.flight*.30);
  return pose;
 };
 const dispose=()=>{
  head.dispose();torso.dispose();tail.dispose();
  for(const paw of paws)paw.card.dispose();
  shadow.geometry.dispose();shadowMat.dispose();shadowTexture.dispose();
  root.removeFromParent();
 };
 return {root,head,torso,paws,tail,update,dispose};
}
