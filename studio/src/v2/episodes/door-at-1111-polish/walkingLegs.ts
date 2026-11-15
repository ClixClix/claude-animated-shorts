import * as T from 'three';
import {DESIGNS,CatId} from '../../cats/designs';
import {cardShade} from '../../../videos/bridge/cardshade';
import {INK,mix} from '../../../videos/bridge/toon';
import {NOINK} from '../../../videos/bridge/ink';
import {supportHeight,type Actor} from './timeline';
import type {V3} from '../../cafe/config';

export function anatomicalHips(a:Actor):V3[]{
 const d=a.heading,right:V3=[-d[2],0,d[0]];
 return a.feet.map((_,i)=>{const fore=i%2?.18:-.18,side=i<2?-.145:.145;return [a.position[0]+d[0]*fore+right[0]*side,a.position[1]+110*1.52/550,a.position[2]+d[2]*fore+right[2]*side];});
}
/** A separate upright inked leg connects two real world anchors. Texture margins are
 * compensated: source pixel (0,370) is the hip and (0,483) is the toe, exactly. */
export function legCorners(hip:V3,foot:V3,camera:V3):V3[]{
 const dx=camera[0]-hip[0],dz=camera[2]-hip[2],length=Math.hypot(dx,dz)||1,right:V3=[dz/length,0,-dx/length];
 const bone=hip.map((v,i)=>v-foot[i]),bottom=foot.map((v,i)=>v-bone[i]*10/226),top=hip.map((v,i)=>v+bone[i]*20/226),half=32*1.52/550;
 return [bottom,top].flatMap(p=>[-1,1].map(side=>p.map((v,i)=>v+right[i]*half*side) as V3));
}
/** Reuses the locked leg silhouette, sock sizes and plum ink. No new lead design. */
export function createWalkingLegs(id:CatId){
 const root=new T.Group();root.name=id+'-walking-legs';const c=DESIGNS[id],textures:T.CanvasTexture[]=[],materials:T.Material[]=[];
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sg=shadowCanvas.getContext('2d')!,gradient=sg.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(16,20,27,.32)');gradient.addColorStop(1,'rgba(16,20,27,0)');sg.fillStyle=gradient;sg.fillRect(0,0,64,64);const shadowTexture=new T.CanvasTexture(shadowCanvas);textures.push(shadowTexture);const shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});materials.push(shadowMaterial);const shadowGeometry=new T.PlaneGeometry(.20,.14),shadows=Array.from({length:4},()=>{const m=new T.Mesh(shadowGeometry,shadowMaterial);m.rotation.x=-Math.PI/2;m.layers.set(NOINK);root.add(m);return m;});
 const legs=Array.from({length:4},(_,i)=>{
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;const g=canvas.getContext('2d')!;g.setTransform(2,0,0,2,64,-720);g.lineJoin='round';g.lineCap='round';g.lineWidth=3.8;g.strokeStyle=INK;
  const fill=(d:string,color:string,stroke=true)=>{const path=new Path2D(d);g.fillStyle=color;g.fill(path);if(stroke)g.stroke(path);};
  fill('M -17 370 Q -25 419 -22 466 Q -28 483 7 482 Q 32 482 24 467 L 22 394 Q 7 375 -17 370 Z',i<2?c.shadow:c.coat);
  const sock=id==='latte'?c.marking:c.bib;
  fill(`M -23 ${id==='mocha'?442:id==='essie'?466:438} Q 0 ${id==='mocha'?449:460} 24 ${id==='mocha'?443:451} L 24 468 Q 30 484 0 483 Q -30 481 -22 466 Z`,i<2?mix(sock,c.shadow,.28):sock,false);
  g.lineWidth=1.8;g.stroke(new Path2D('M -10 473 l 0 7 M 4 474 l 0 6'));
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);
  const material=cardShade(new T.MeshLambertMaterial({map:texture,alphaTest:.25,side:T.DoubleSide,depthWrite:true}));materials.push(material);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(12),3));geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1,1,1],2));geometry.setIndex([0,1,2,2,1,3]);
  const mesh=new T.Mesh(geometry,material);mesh.name=id+'-leg-'+i;mesh.layers.set(NOINK);root.add(mesh);return mesh;
 });
 return {root,update(a:Actor,camera:V3,tint:T.Color){
  root.visible=a.moving;const hips=anatomicalHips(a);
  legs.forEach((leg,i)=>{const p=leg.geometry.getAttribute('position');legCorners(hips[i],a.feet[i],camera).forEach((v,j)=>p.setXYZ(j,...v));p.needsUpdate=true;leg.geometry.computeVertexNormals();leg.geometry.computeBoundingSphere();leg.material.color.copy(tint);const foot=a.feet[i],shadow=shadows[i];shadow.visible=a.footKeys[i].endsWith('stance');shadow.position.set(foot[0],supportHeight(foot,id==='essie'?2:id==='mocha'?1:0)+.006,foot[2]);});
 },dispose(){legs.forEach(l=>l.geometry.dispose());shadowGeometry.dispose();materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.removeFromParent();}};
}
