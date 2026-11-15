import * as T from 'three';
import {createWalkingLegs} from './walkingLegs';
import {headDropPixels} from './contacts';
import {createCatCard} from '../../cats/Cat';
import {drawCat} from '../../cats/drawCat';
import {CatId} from '../../cats/designs';
import {CatPose} from '../../cats/pose';
import {Actor,EpisodeState,mix,beat,lerp} from './timeline';
import {cardShade} from '../../../videos/bridge/cardshade';
import {NOINK} from '../../../videos/bridge/ink';
import {V3} from '../../cafe/config';

/** Locked body/head artwork with separate world-anchored walking legs. */
export function createEpisodeCat(id:CatId){
 const card=createCatCard(id,1.52),walking=createWalkingLegs(id),canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1100;
 const g=canvas.getContext('2d',{willReadFrequently:true})!,texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
 card.mesh.material.map=texture;card.mesh.material.transparent=false;card.mesh.material.alphaTest=.25;card.mesh.material.depthWrite=true;card.mesh.material=cardShade(card.mesh.material);card.mesh.layers.set(NOINK);card.mesh.name=`episode-${id}`;
 const nativeRotations=new Map([[g,g.rotate.bind(g)]]);
 const nativeTranslations=new Map([[g,g.translate.bind(g)]]);
 const nativeScales=new Map([[g,g.scale.bind(g)]]);
 function render(ctx:CanvasRenderingContext2D,actor:Actor,s:EpisodeState,pose:Partial<CatPose>){
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,500,550);
  const crouch=id==='latte'?beat(s.t,77.5,79)*(1-beat(s.t,83,84)):0;ctx.setTransform(2,0,0,2*(1-.18*crouch),0,2*480*.18*crouch);
  const original=nativeTranslations.get(ctx)!,scale=nativeScales.get(ctx)!;
  // Retain the approved torso paths/palette; remove the legacy pancake squash in locomotion.
  ctx.scale=(x,y)=>scale(actor.moving&&y===.68?x-.25+.25*Math.abs(pose.yaw??0):x,actor.moving&&y===.68?.82:y);
  let leg=0,rotation=0;const nativeRotate=nativeRotations.get(ctx)!;
  // Use the approved expression silhouettes with continuous ear gestures.
  const desiredEar=(id==='latte'?.68:0)*actor.emotion,drawnEar=pose.expression==='scared'?.68:pose.expression==='happy'?-.06:0;
  ctx.rotate=(angle:number)=>{const n=rotation++;nativeRotate(angle+(n===2?-1:n===3?1:0)*(desiredEar-drawnEar));};
  ctx.translate=(x:number,y:number)=>{
   if(actor.moving&&y===0&&Math.abs(x)<180&&leg<4){
    leg++;original(x,0);scale(0,0); // These exact silhouettes now live on the planted 3D leg cards.
   }else original(x,y+(id==='essie'&&y>190&&y<245&&x>=0&&x<100?headDropPixels(s,'essie'):0));
  };
  try{drawCat(ctx,id,pose);}finally{ctx.translate=original;ctx.rotate=nativeRotate;ctx.scale=scale;}
 }
 return {...card,texture,legs:walking.root,updateActor:(a:Actor,s:EpisodeState)=>{
  const amount=a.emotion,pose:Partial<CatPose>={...a.pose,expression:a.pose.expression??(id==='mocha'&&s.shot.number>=59?'happy':'neutral'),...(id==='latte'?{}:{blink:Math.max(a.pose.blink??0,amount*.7)})};
  if(id==='latte'){const sign=(pose.yaw??0)<0?-1:1;if(Math.abs(pose.yaw??0)+(pose.headTurn??0)*sign<.035)pose.headTurn=(.035-Math.abs(pose.yaw??0))*sign;}
  if(id==='latte'&&amount>=.60&&pose.expression!=='surprised')pose.expression='scared';
  if(id==='latte'&&[38,43].includes(s.shot.number))pose.blink=Math.max(pose.blink??0,Math.max(0,1-Math.abs(s.u-.23)/.055));
  render(g,a,s,pose);
  texture.needsUpdate=true;card.mesh.position.set(...a.position);card.mesh.rotation.y=Math.atan2(s.camera[0]-a.position[0],s.camera[2]-a.position[2]);const p=a.position,inside=p[2]<4.25,spill=inside?1:Math.max(0,1-Math.hypot(p[0]+1,p[2]-4.5)/4);card.mesh.material.color.setRGB(lerp(.75,1.02,spill),lerp(.84,.96,spill),lerp(.98,.85,spill));walking.update(a,s.camera,card.mesh.material.color);
 },dispose:()=>{texture.dispose();walking.dispose();card.dispose();}};
}
export function contactShadow(width=.9,depth=.5){
 const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d')!,gradient=g.createRadialGradient(64,64,1,64,64,63);gradient.addColorStop(0,'rgba(20,22,30,.47)');gradient.addColorStop(.5,'rgba(20,22,30,.20)');gradient.addColorStop(1,'rgba(20,22,30,0)');g.fillStyle=gradient;g.fillRect(0,0,128,128);
 const texture=new T.CanvasTexture(cv),mat=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:T.DoubleSide}),mesh=new T.Mesh(new T.PlaneGeometry(width,depth),mat);mesh.rotation.x=-Math.PI/2;mesh.layers.set(NOINK);return {mesh,dispose:()=>{texture.dispose();mat.dispose();mesh.geometry.dispose();}};
}
export function pawRig(color:string,sock:string,r=.045){
 const group=new T.Group(),material=new T.MeshBasicMaterial({color}),toeMaterial=new T.MeshBasicMaterial({color:sock}),ink=new T.MeshBasicMaterial({color:'#292737',side:T.BackSide});
 const upper=new T.Mesh(new T.CylinderGeometry(r,r,1,12),material),lower=new T.Mesh(new T.CylinderGeometry(r*.85,r,1,12),material),toe=new T.Mesh(new T.SphereGeometry(r*1.3,16,12),toeMaterial);group.add(upper,lower,toe);
 for(const m of [upper,lower,toe]){const edge=new T.Mesh(m.geometry,ink);edge.scale.setScalar(1.12);m.add(edge);}group.traverse(o=>o.layers.set(NOINK));
 const place=(mesh:T.Mesh,a:T.Vector3,b:T.Vector3)=>{mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());mesh.scale.y=a.distanceTo(b);};
 return {group,update:(a:V3,b:V3,visible:boolean)=>{group.visible=visible;const start=new T.Vector3(...a),end=new T.Vector3(...b),middle=start.clone().lerp(end,.5);middle.y+=r*1.7;place(upper,start,middle);place(lower,middle,end);toe.position.copy(end);},dispose:()=>{upper.geometry.dispose();lower.geometry.dispose();toe.geometry.dispose();material.dispose();toeMaterial.dispose();ink.dispose();}};
}
