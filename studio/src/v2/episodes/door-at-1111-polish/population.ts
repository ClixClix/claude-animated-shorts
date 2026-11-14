import * as T from 'three';
import {NOINK} from '../../../videos/bridge/ink';
import {EpisodeState} from './timeline';
import {shelterState} from './shelter';
import {contactShadow} from './actors';

/** Supporting cast only: simple short-haired designs, never copies of the three leads. */
export class TownPopulation{
 readonly root=new T.Group();
 private steam=Array.from({length:4},(_,i)=>{
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(48),3));
  const mat=new T.LineBasicMaterial({color:'#ded8c7',transparent:true,opacity:.20,depthWrite:false});
  const line=new T.Line(geo,mat);line.layers.set(NOINK);line.position.set(i<2?1.82:2.25,1.04,i<2?2.13:-1.14);this.root.add(line);return {geo,mat,line};
 });
 private cats=Array.from({length:7},(_,i)=>{
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=400;
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const mat=new T.MeshLambertMaterial({map:texture,transparent:true,alphaTest:.08,side:T.DoubleSide,depthWrite:false});
  const geo=new T.PlaneGeometry(.84,1.05);geo.translate(0,.449,0);
  const mesh=new T.Mesh(geo,mat);mesh.name='supporting-cat-'+i;mesh.layers.set(NOINK);
  const shadow=contactShadow(.56,.35);this.root.add(mesh,shadow.mesh);
  return {canvas,texture,mat,geo,mesh,shadow};
 });
 constructor(){this.root.name='town-supporting-cast';}
 get actors(){return this.cats.map((cat,i)=>({id:'supporting-cat-'+i,mesh:cat.mesh}));}
 update(s:EpisodeState){
  this.steam.forEach((p,j)=>{const phase=(s.t*.13+j*.25)%1,positions=p.geo.getAttribute('position');for(let i=0;i<16;i++){const u=i/15;positions.setXYZ(i,Math.sin(u*7+s.t*.9+j)*.018,u*.34+phase*.12,Math.cos(u*5+j)*.01);}positions.needsUpdate=true;p.geo.computeBoundingSphere();p.mat.opacity=.13*Math.sin(Math.PI*phase);});
  this.cats.forEach((cat,i)=>{
   const guest=i>=4?shelterState(s,i-4):undefined;
   const walking=guest?guest.walking:i<2,t=s.t;
   // Street activity clears before the blackout. Patrons stay in fixed existing seats.
   cat.mesh.visible=cat.shadow.mesh.visible=guest?guest.visible:true;
   const pos=guest?guest.position:i===0?[5.0-t*.105,.03,11.90]:i===1?[-6.9+t*.085,.03,6.05]:i===2?[2.38,.51,-2.14]:[.96,.51,2.13];
   cat.mesh.position.set(...pos as [number,number,number]);cat.shadow.mesh.position.set(pos[0],pos[1]+.006,pos[2]);
   cat.mesh.rotation.y=Math.atan2(s.camera[0]-pos[0],s.camera[2]-pos[2]);
   const g=cat.canvas.getContext('2d')!,coat=['#aa8061','#7e8b93','#b18c65','#84928b','#9e8b7d','#ac8c6e','#75838e'][i],dark=['#7c5746','#55616d','#7d5e46','#596e67','#685a54','#75634e','#455466'][i];
   g.clearRect(0,0,320,400);g.save();g.translate(160,0);g.lineWidth=6;g.lineJoin='round';g.strokeStyle='#343241';
   const shape=(draw:()=>void,color:string)=>{g.beginPath();draw();g.fillStyle=color;g.fill();g.stroke();};
   const oval=(x:number,y:number,rx:number,ry:number,color:string)=>shape(()=>g.ellipse(x,y,rx,ry,0,0,Math.PI*2),color);
   const phase=guest?guest.travel/.24*Math.PI*2:t*5+i;
   shape(()=>{g.moveTo(65,323);g.quadraticCurveTo(135+Math.sin(t*1.2+i)*7,320,119,262);g.quadraticCurveTo(101,252,103,283);g.quadraticCurveTo(97,299,64,294);g.closePath();},dark);
   oval(0,278+Math.sin(t*1.3+i)*1.2,76,83,coat);
   for(const j of [-1,1]){const lift=walking?Math.max(0,Math.sin(phase+j*1.57))*16:0;oval(j*40,351-lift,24,19,dark);}
   shape(()=>{g.moveTo(-71,151);g.lineTo(-89,66+(guest?.fear??0)*23);g.lineTo(-29,105);g.lineTo(32,105);g.lineTo(88,66+(guest?.fear??0)*23);g.lineTo(72,156);g.closePath();},coat);
   oval(0,171,88,79,coat);oval(0,205,44,28,'#d5c6ad');
   const blink=(t+i*.8)%4.3>4.13;
   for(const x of [-34,34]){oval(x,165,18,blink?2:13,'#d6d5b3');if(!blink)oval(x+(i%2?2:-2),165,6,12,'#283240');}
   shape(()=>{g.moveTo(-9,194);g.lineTo(9,194);g.lineTo(0,203);g.closePath();},'#705550');
   g.beginPath();g.moveTo(-12,217);g.quadraticCurveTo(0,225-(guest?.fear??0)*18,12,217);g.stroke();g.restore();
   const shade=i===6?.35+.50*(guest?.progress??0):t>=54?.79:.92;cat.mat.color.setRGB(shade*.94,shade,shade*1.04);cat.texture.needsUpdate=true;
  });
 }
 dispose(){for(const cat of this.cats){cat.geo.dispose();cat.mat.dispose();cat.texture.dispose();cat.shadow.dispose();}for(const p of this.steam){p.geo.dispose();p.mat.dispose();}}
}
