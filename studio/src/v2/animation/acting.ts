import * as T from 'three';
import {drawCat} from '../cats/drawCat';
import {CatPose} from '../cats/pose';
import {StoryState} from './timeline';
import {NOINK} from '../../videos/bridge/ink';
import {INK} from '../../videos/bridge/toon';
/** Expression blending is an animation adapter. Locked adult art and palettes stay untouched. */
export function createEssieActing(){
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1100;const g=canvas.getContext('2d')!;
 const other=document.createElement('canvas');other.width=1000;other.height=1100;const h=other.getContext('2d')!;
 const base=document.createElement('canvas');base.width=1000;base.height=1100;const b=base.getContext('2d')!;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
 const render=(ctx:CanvasRenderingContext2D,p:Partial<CatPose>)=>{ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,500,550);drawCat(ctx,'essie',p);};
 return {texture,update:(s:StoryState)=>{
   const mix=s.reassurance>0?s.reassurance:s.concern,expression=s.reassurance>0?'happy':'concerned';
   render(g,{...s.essiePose,expression:'neutral'});
   if(mix>0){render(h,{...s.essiePose,expression});
     // Convex combination of premultiplied canvases preserves the alpha silhouette exactly.
     b.clearRect(0,0,1000,1100);b.drawImage(canvas,0,0);
     g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,1000,1100);g.globalAlpha=1-mix;g.drawImage(base,0,0);g.globalCompositeOperation='lighter';g.globalAlpha=mix;g.drawImage(other,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
   }texture.needsUpdate=true;
 },dispose:()=>texture.dispose()};
}
/** Two-bone foreleg with a small white toe cap. Endpoint is constrained to the physical cup rim. */
export function createPaw(){
 const group=new T.Group();group.name='essie-reaching-paw';
 const dark=new T.MeshBasicMaterial({color:'#303039'}),toe=new T.MeshBasicMaterial({color:'#eee6d7'}),ink=new T.MeshBasicMaterial({color:INK,side:T.BackSide});
 const segment=()=>{
   const g=new T.Group();const core=new T.Mesh(new T.CylinderGeometry(1,1,1,12),dark);const outline=new T.Mesh(core.geometry,ink);outline.scale.set(1.12,1.02,1.12);g.add(core,outline);group.add(g);return g;
 };
 const upper=segment(),lower=segment();
 const hand=new T.Mesh(new T.SphereGeometry(1,18,12),dark);hand.scale.set(0.065,0.045,0.065);group.add(hand);
 const shell=new T.Mesh(hand.geometry,ink);shell.scale.set(0.071,0.051,0.071);group.add(shell);
 const white=new T.Mesh(new T.SphereGeometry(1,16,10),toe);white.scale.set(0.050,0.025,0.041);group.add(white);
 group.traverse(o=>o.layers.set(NOINK));
 const orient=(g:T.Group,a:T.Vector3,b:T.Vector3,r:number)=>{g.position.copy(a).add(b).multiplyScalar(0.5);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());g.scale.set(r,a.distanceTo(b),r);};
 return {group,update:(s:StoryState)=>{
   group.visible=s.reach>0.015;
   const a=new T.Vector3(...s.shoulder),end=new T.Vector3(...s.paw),elbow=a.clone().lerp(end,0.5);elbow.y+=0.10;
   orient(upper,a,elbow,0.056);orient(lower,elbow,end,0.048);hand.position.copy(end);shell.position.copy(end);white.position.copy(end).add(new T.Vector3(0,0.021,0.025));
 },dispose:()=>{const gs=new Set<T.BufferGeometry>();group.traverse(o=>{if(o instanceof T.Mesh)gs.add(o.geometry);});gs.forEach(g=>g.dispose());dark.dispose();toe.dispose();ink.dispose();group.removeFromParent();}};
}
