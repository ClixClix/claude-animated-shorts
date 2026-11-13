import * as T from 'three';
import {INK} from '../../videos/bridge/toon';
import {StoryState,beat,mix3} from './timeline';
import {cardShade} from '../../videos/bridge/cardshade';
const W=420,H=520,GROUND=482;
export const KITTEN_CARD_HEIGHT=0.79;
/** New story character only. The three approved adult drawings are never edited. */
function drawKitten(g:CanvasRenderingContext2D,s:StoryState,feet?:{x:number;y:number}[]){
 const fear=s.kittenFear,smile=s.kittenSmile;const coat='#c6ad87',shade='#a18b73',cream='#fff0d1',mark='#85725f';
 const path=(d:string,c:string,w=4)=>{g.fillStyle=c;const p=new Path2D(d);g.fill(p);if(w){g.strokeStyle=INK;g.lineWidth=w;g.stroke(p);}};
 const line=(d:string,c=INK,w=3)=>{g.strokeStyle=c;g.lineWidth=w;g.stroke(new Path2D(d));};
 const ell=(x:number,y:number,rx:number,ry:number,c:string,w=0)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();if(w){g.strokeStyle=INK;g.lineWidth=w;g.stroke();}};
 g.save();g.translate(210,0);g.lineCap='round';g.lineJoin='round';
 const breath=Math.sin(s.frame/30*3.2)*(fear?1.4:1.0);
 g.save();g.translate(51,425);g.rotate(Math.sin(s.frame/30*1.1)*0.035+fear*0.13);
 path('M -4 28 Q 103 52 99 -23 Q 98 -55 80 -55 Q 64 -51 72 -25 Q 89 14 17 4 Z',coat);line('M 78 -27 q 14 4 19 0',mark,10);g.restore();
 path(`M -53 294 Q -99 324 -86 414 L -95 423 L -82 422 Q -87 474 -30 474 L 52 474 Q 101 470 83 415 L 92 418 L 82 400 Q 81 318 45 295 Z`,shade);
 path('M -58 303 Q 0 279 58 307 L 55 347 L 39 342 L 32 365 L 18 355 L 2 380 L -10 360 L -29 371 L -34 351 L -54 356 Z',cream,0);
 for(const side of [-1,1]){
   const stride=s.kittenWalking*Math.sin(s.kittenGait+(side===1?Math.PI:0))*14;
   const lift=s.kittenWalking*Math.max(0,Math.cos(s.kittenGait+(side===1?Math.PI:0)))*20+s.kittenLift*18;
   const foot=feet?.[side===-1?0:1],offset=foot?foot.x-side*30:stride,base=foot?foot.y-2:480-lift;
   g.save();g.translate(side*30,0);
   path(`M -19 387 Q -24 409 ${offset-23} ${base-16} Q ${offset-28} ${base+2} ${offset+5} ${base} Q ${offset+31} ${base} ${offset+22} ${base-18} L 20 390 Q 0 380 -19 387 Z`,coat);
   path(`M ${offset-23} ${base-30} Q ${offset} ${base-23} ${offset+23} ${base-30} L ${offset+23} ${base-15} Q ${offset+27} ${base+2} ${offset} ${base} Q ${offset-26} ${base} ${offset-23} ${base-15} Z`,cream,0);
   line(`M ${offset-9} ${base-11} l 0 9 M ${offset+5} ${base-10} l 0 8`,mark,1.5);g.restore();
 }
 g.save();g.translate(0,244+breath-s.kittenLift*4);g.rotate(-s.kittenLook*0.055);
 for(const side of [-1,1]){g.save();g.translate(side*67,-63);g.rotate(side*(fear*0.43-0.05));g.scale(side,1);
   path('M -30 21 Q -33 -22 -23 -90 Q -4 -88 36 -16 L 27 24 Z',coat);
   path('M -20 -69 Q -20 -35 -20 0 L 17 -14 Q 0 -42 -20 -69 Z','#d4a1a0',0);g.restore();}
 path('M -86 -54 Q -44 -80 0 -74 Q 53 -80 87 -43 Q 103 -15 94 13 L 109 27 L 95 29 L 104 44 L 84 43 Q 62 78 3 81 Q -58 78 -84 45 L -106 45 L -98 31 L -112 29 L -96 14 Q -106 -24 -86 -54 Z',coat);
 path('M -85 -38 Q -41 -65 -6 -68 Q -36 -40 -43 -6 L -79 20 L -96 10 Z','#d9c09a',0);
 line('M -39 -58 l 17 24 l 15 -16 l 16 17 l 15 -27',mark,5);
 for(const side of [-1,1]){g.save();g.scale(side,1);line('M 77 16 l 20 -5',mark,6);line('M 73 35 l 19 -1',mark,5);g.restore();}
 for(const side of [-1,1]){
   const x=side*39,open=(15+fear*7)*(1-s.kittenBlink),w=27;
   if(s.kittenBlink>0.93)line(`M ${x-w} 2 Q ${x} 8 ${x+w} 2`,INK,3.5);
   else {const ep=new Path2D(`M ${x-w} 0 Q ${x-5} ${-open*1.55} ${x+w} -1 Q ${x+3} ${open*1.45} ${x-w} 0 Z`);
    g.save();g.clip(ep);ell(x,0,w+1,open+5,'#fff3d7');const px=x-4-s.kittenLook*5,py=-2-s.kittenLook*5;
    ell(px,py,17,25,'#a8bda4');ell(px,py,6+fear*4,23,INK);g.restore();g.strokeStyle=INK;g.lineWidth=3;g.stroke(ep);}
   const y=-32-fear*6;line(`M ${x-18} ${y+(side<0?0:-fear*7)} Q ${x} ${y-4} ${x+18} ${y+(side<0?-fear*7:0)}`,mark,3);
 }
 ell(-13,36,25,21,cream);ell(13,36,25,21,cream);
 path('M -11 24 Q 0 17 12 24 Q 8 33 0 35 Q -9 31 -11 24 Z','#b9827e',2);
 line('M 0 35 l 0 7',INK,2);
 // Continuous mouth curvature, rather than swapping drawings at the emotional turn.
 const end=48+fear*4-smile*8,mid=40+smile*19;
 line(`M -17 ${end} Q -7 ${mid} 0 43 Q 8 ${mid} 18 ${end}`,INK,2.5);
 for(const side of [-1,1])for(let i=0;i<3;i++)line(`M ${side*28} ${33+i*6} Q ${side*57} ${26+i*13} ${side*(88-i*5)} ${24+i*17}`,'#655d59',1.5);
 g.restore();g.restore();
}
export function createKitten(){
 const canvas=document.createElement('canvas');canvas.width=W*2;canvas.height=H*2;const g=canvas.getContext('2d')!;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
 const material=cardShade(new T.MeshLambertMaterial({map:texture,alphaTest:0.25,side:T.DoubleSide}));
 const geo=new T.PlaneGeometry(KITTEN_CARD_HEIGHT*W/H,KITTEN_CARD_HEIGHT);geo.translate(0,KITTEN_CARD_HEIGHT*(GROUND/H-0.5),0);
 const mesh=new T.Mesh(geo,material);mesh.name='story-kitten';mesh.castShadow=mesh.receiveShadow=true;
 return {mesh,update:(s:StoryState)=>{g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,W,H);const root=new T.Vector3(...s.kitten),cam=new T.Vector3(...s.camera);
   const normal=cam.clone().sub(root);normal.y=0;normal.normalize();const right=new T.Vector3(normal.z,0,-normal.x);
   // Foot targets are planted in WORLD space. Perspective-project them onto the upright card,
   // so the visible toe stays on its ground contact as the body advances and camera pushes in.
   const feet=s.shot===1?[-1,1].map(side=>{
     const t=beat(s.frame,side===-1?19:27,side===-1?27:36);
     const anchor=mix3([2.25,0.03,4.78],[2.25,0.03,4.66],t);
     const fixedRight=new T.Vector3(2.57,0,-1.8).normalize();const foot=new T.Vector3(...anchor).addScaledVector(fixedRight,side*0.045);
     foot.y+=Math.sin(Math.PI*t)*0.035;
     const ray=foot.clone().sub(cam),k=normal.dot(root.clone().sub(cam))/normal.dot(ray);
     const local=cam.clone().addScaledVector(ray,k).sub(root);
     return {x:local.dot(right)*H/KITTEN_CARD_HEIGHT,y:GROUND-local.y*H/KITTEN_CARD_HEIGHT};
   }):undefined;
   drawKitten(g,s,feet);texture.needsUpdate=true;},dispose:()=>{mesh.removeFromParent();geo.dispose();material.dispose();texture.dispose();}};
}
