import * as T from 'three';
import {createCatCard} from '../../cats/Cat';
import {drawCat} from '../../cats/drawCat';
import {CatId} from '../../cats/designs';
import {CatPose} from '../../cats/pose';
import {Actor,EpisodeState,mix} from './timeline';
import {cardShade} from '../../../videos/bridge/cardshade';
import {NOINK} from '../../../videos/bridge/ink';
import {V3} from '../../cafe/config';

/** Adapter around the locked drawing: preserves art; projects planted world-space feet. */
export function createEpisodeCat(id:CatId){
 const card=createCatCard(id,1.52),canvas=document.createElement('canvas'),other=document.createElement('canvas');canvas.width=other.width=1000;canvas.height=other.height=1100;
 const g=canvas.getContext('2d')!,h=other.getContext('2d')!,texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
 card.mesh.material.map=texture;card.mesh.material.transparent=false;card.mesh.material.alphaTest=.25;card.mesh.material.depthWrite=true;card.mesh.material=cardShade(card.mesh.material);card.mesh.layers.set(NOINK);card.mesh.name=`episode-${id}`;
 const nativeRotations=new Map([[g,g.rotate.bind(g)],[h,h.rotate.bind(h)]]);
 const nativeTranslations=new Map([[g,g.translate.bind(g)],[h,h.translate.bind(h)]]);
 function render(ctx:CanvasRenderingContext2D,actor:Actor,s:EpisodeState,pose:Partial<CatPose>){
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,500,550);
  const original=nativeTranslations.get(ctx)!,root=new T.Vector3(...actor.position),camera=new T.Vector3(...s.camera),normal=camera.clone().sub(root);normal.y=0;normal.normalize();const right=new T.Vector3(normal.z,0,-normal.x),sign=(pose.yaw??0)<0?-1:1;
  let leg=0,rotation=0;const nativeRotate=nativeRotations.get(ctx)!;
  // Keep a single ear silhouette while facial expressions dissolve. Artwork endpoints stay exact.
  const desiredEar=(id==='latte'?.68:0)*actor.emotion,drawnEar=pose.expression==='scared'?.68:pose.expression==='happy'?-.06:0;
  ctx.rotate=(angle:number)=>{const n=rotation++;nativeRotate(angle+(n===2?-1:n===3?1:0)*(desiredEar-drawnEar));};
  ctx.translate=(x:number,y:number)=>{
   if(actor.moving&&y===0&&Math.abs(x)<180&&leg<4){
    const index=leg++,foot=new T.Vector3(...actor.feet[index]),ray=foot.clone().sub(camera),k=normal.dot(root.clone().sub(camera))/normal.dot(ray),local=camera.clone().addScaledVector(ray,k).sub(root);
    const phase=[0,Math.PI,Math.PI,0][index],lift=Math.max(0,Math.cos((pose.gait??0)+phase))*13;
    original(local.dot(right)*550/1.52/sign,480-local.y*550/1.52-(483-lift));
   }else original(x,y);
  };
  try{drawCat(ctx,id,pose);}finally{ctx.translate=original;ctx.rotate=nativeRotate;}
 }
 return {...card,texture,updateActor:(a:Actor,s:EpisodeState)=>{
  const amount=a.emotion,pose={...a.pose,expression:(id==='mocha'&&s.shot.number>=59?'happy':'neutral') as 'happy'|'neutral',...(id==='latte'?{}:{blink:Math.max(a.pose.blink??0,amount*.7)})};render(g,a,s,pose);
  if(id==='latte'&&amount>0){render(h,a,s,{...pose,expression:'scared'});g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-in';g.fillStyle=`rgba(0,0,0,${1-amount})`;g.fillRect(0,0,1000,1100);g.globalCompositeOperation='lighter';g.globalAlpha=amount;g.drawImage(other,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';}
  texture.needsUpdate=true;card.mesh.position.set(...a.position);card.mesh.rotation.y=Math.atan2(s.camera[0]-a.position[0],s.camera[2]-a.position[2]);
 },dispose:()=>{texture.dispose();card.dispose();}};
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
