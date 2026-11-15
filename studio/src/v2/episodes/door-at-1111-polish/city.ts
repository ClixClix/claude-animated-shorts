import * as T from 'three';
import {CITY_BUILDINGS,CITY_ROADS,CITY_EXTENT} from './cityConfig';

/** Batched district windows keep a larger city practical on the local renderer. */
export function createCity(){
 const root=new T.Group();root.name='connected-city';const materials:T.Material[]=[],textures:T.Texture[]=[],blockers:T.Mesh[]=[];
 const material=(color:string)=>{const m=new T.MeshStandardMaterial({color,roughness:.92,metalness:0});materials.push(m);return m;};
 const mesh=(geometry:T.BufferGeometry,mat:T.Material,position:number[],name:string,solid=false)=>{const m=new T.Mesh(geometry,mat);m.position.set(...position as [number,number,number]);m.name=name;m.receiveShadow=true;m.castShadow=solid;root.add(m);if(solid)blockers.push(m);return m;};
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const g=canvas.getContext('2d')!;
 g.fillStyle='#a8a6a0';g.fillRect(0,0,256,256);for(let i=0;i<650;i++){g.fillStyle=i%2?'rgba(250,239,214,.075)':'rgba(28,45,53,.075)';g.fillRect((i*73)%256,(i*47)%256,3+i%7,1+i%3);}for(let y=0;y<256;y+=32){g.fillStyle='rgba(31,44,52,.08)';g.fillRect(0,y,256,1);}
 const wallTexture=new T.CanvasTexture(canvas);wallTexture.colorSpace=T.SRGBColorSpace;textures.push(wallTexture);
 const walls=['#7b8985','#78858f','#a18d75','#858091'].map(color=>{const m=material(color);m.map=wallTexture;return m;}),roof=material('#3d525f'),stone=material('#7c8580'),trim=material('#b0a48b');
 const asphalt=material('#465666'),ground=material('#344954');
 const roadCanvas=document.createElement('canvas');roadCanvas.width=roadCanvas.height=256;const r=roadCanvas.getContext('2d')!;r.fillStyle='#a8adb0';r.fillRect(0,0,256,256);for(let i=0;i<2200;i++){r.fillStyle=i%2?'rgba(236,229,206,.10)':'rgba(21,32,44,.11)';r.fillRect((i*73)%256,(i*131)%256,1+i%2,1);}const roadTexture=new T.CanvasTexture(roadCanvas);roadTexture.wrapS=roadTexture.wrapT=T.RepeatWrapping;roadTexture.repeat.set(10,10);roadTexture.colorSpace=T.SRGBColorSpace;textures.push(roadTexture);asphalt.map=roadTexture;
 mesh(new T.BoxGeometry(CITY_EXTENT*2,.2,CITY_EXTENT*2),ground,[0,-.21,0],'city-ground');
 const paving=material('#73817e'),marking=material('#a49f87');
 for(const road of CITY_ROADS){
  // Perpendicular asphalt planes previously shared the exact same depth at intersections.
  // The horizontal crossing layer sits 12 mm higher, preventing deterministic z-fighting.
  const alongX=road.size[0]>road.size[2],surface:[number,number,number]=[road.position[0],alongX ? 0.012 : 0,road.position[2]];
  mesh(new T.BoxGeometry(...road.size),asphalt,surface,road.id);
  for(const sign of [-1,1]){
   const size=alongX?[road.size[0],.1,.7]:[.7,.1,road.size[2]],p=surface.map((v,i)=>v+(i===(alongX?2:0)?sign*(road.size[alongX?2:0]/2+.38):i===1?-.015:0));
   mesh(new T.BoxGeometry(...size as [number,number,number]),paving,p,road.id+'-curb-'+sign);
  }
 }
 for(const x of [-18,18])for(const stripe of [-1.8,-1.2,-.6,0,.6,1.2,1.8])mesh(new T.BoxGeometry(.32,.006,2.2),marking,[x+stripe,.034,8.55],`crosswalk-${x}-${stripe}`);
 const windows:{position:T.Vector3;rotation:number;lit:boolean}[]=[];
 for(const b of CITY_BUILDINGS){
  const group=new T.Group();group.name=b.id;group.position.set(...b.position);root.add(group);
  const part=(geo:T.BufferGeometry,mat:T.Material,p:number[],name:string,solid=false)=>{const m=new T.Mesh(geo,mat);m.position.set(...p as [number,number,number]);m.name=b.id+'/'+name;m.receiveShadow=true;m.castShadow=solid;group.add(m);if(solid)blockers.push(m);return m;};
  part(new T.BoxGeometry(b.width,b.height,b.depth),walls[b.style],[0,b.height/2,0],'facade',true);
  part(new T.BoxGeometry(b.width+.12,.38,b.depth+.12),stone,[0,.19,0],'foundation');
  part(new T.BoxGeometry(b.width+.3,.18,b.depth+.3),trim,[0,b.height+.03,0],'cornice');
  if(b.pitched){const r=part(new T.ConeGeometry(1,1.2,4),roof,[0,b.height+.7,0],'roof');r.rotation.y=Math.PI/4;r.scale.set((b.width+.3)/Math.SQRT2,1,(b.depth+.3)/Math.SQRT2);}
  else{part(new T.BoxGeometry(b.width,.3,b.depth),roof,[0,b.height+.25,0],'roof');part(new T.BoxGeometry(1.2,.65,1.1),stone,[-1,b.height+.725,-.6],'chimney');}
  for(let floor=0;floor<b.floors;floor++)for(const offset of [-1.8,0,1.8])for(const side of [-1,1]){
   windows.push({position:new T.Vector3(b.position[0]+offset,1.25+floor*1.65,b.position[2]+side*(b.depth/2+.038)),rotation:0,lit:(floor+b.style+Math.round(offset*10))%3===0});
   windows.push({position:new T.Vector3(b.position[0]+side*(b.width/2+.038),1.25+floor*1.65,b.position[2]+offset),rotation:Math.PI/2,lit:(floor+b.style)%3===1});
  }
  for(const side of [-1,1]){part(new T.BoxGeometry(.85,1.6,.07),roof,[0,.8,side*(b.depth/2+.045)],'door-'+side);part(new T.BoxGeometry(1.25,.12,.42),stone,[0,.06,side*(b.depth/2+.26)],'doorstep-'+side);}
 }
 const windowMaterial=material('#b5ac91');windowMaterial.emissive.set('#e5bd83');windowMaterial.emissiveIntensity=.32;
 const unlit=material('#344c60');
 const windowCanvas=document.createElement('canvas');windowCanvas.width=96;windowCanvas.height=144;const w=windowCanvas.getContext('2d')!;w.fillStyle='#344553';w.fillRect(0,0,96,144);const glow=w.createLinearGradient(0,12,0,132);glow.addColorStop(0,'#a5a8a1');glow.addColorStop(1,'#f1dfb3');w.fillStyle=glow;w.fillRect(8,8,80,126);w.fillStyle='#6c7774';w.fillRect(46,8,4,126);w.fillRect(8,86,80,4);w.fillStyle='#c2b79b';w.fillRect(4,134,88,6);const windowTexture=new T.CanvasTexture(windowCanvas);windowTexture.colorSpace=T.SRGBColorSpace;textures.push(windowTexture);windowMaterial.map=unlit.map=windowTexture;windowMaterial.emissiveMap=windowTexture;
 for(const [lit,mat] of [[true,windowMaterial],[false,unlit]] as const){const chosen=windows.filter(w=>w.lit===lit),m=new T.InstancedMesh(new T.BoxGeometry(.72,1.0,.065),mat,chosen.length),dummy=new T.Object3D();chosen.forEach((w,i)=>{dummy.position.copy(w.position);dummy.rotation.y=w.rotation;dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});m.instanceMatrix.needsUpdate=true;m.name=lit?'city-warm-windows':'city-dark-windows';root.add(m);}
 return {root,materials,textures,blockers,windowMaterial,asphalt};
}
