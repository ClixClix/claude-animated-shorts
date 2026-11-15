import * as T from 'three';
import {CITY_BUILDINGS,CITY_ROADS,CITY_EXTENT,CITY_BACKDROP} from './cityConfig';
import {NOINK} from '../../../videos/bridge/ink';

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
 mesh(new T.BoxGeometry(CITY_EXTENT*2,.2,CITY_EXTENT*2),ground,[0,-.26,0],'city-ground');
 const paving=material('#73817e'),marking=material('#a49f87');
 // Partition the union once: intersections have one road skin and continuous UVs.
 const main={id:'main-street',position:[0,0,8.975],size:[120,.06,5.3]},roads=[...CITY_ROADS,main].map(r=>({x0:r.position[0]-r.size[0]/2,x1:r.position[0]+r.size[0]/2,z0:r.position[2]-r.size[2]/2,z1:r.position[2]+r.size[2]/2}));
 const walks=[...roads.map((r,i)=>({x0:r.x0-.8,x1:r.x1+.8,z0:r.z0-(i===roads.length-1?2.1:.8),z1:r.z1+(i===roads.length-1?.675:.8)})),
  {x0:-60,x1:60,z0:4.22,z1:4.82},{x0:-60,x1:60,z0:12.3,z1:12.9},{x0:-4.3,x1:-2.3,z0:12,z1:20}];
 const xs=[...new Set([...roads,...walks].flatMap(r=>[r.x0,r.x1]))].sort((a,b)=>a-b),zs=[...new Set([...roads,...walks].flatMap(r=>[r.z0,r.z1]))].sort((a,b)=>a-b);
 const positions=[[],[]] as number[][],uvs=[[],[]] as number[][];
 const inside=(x:number,z:number,list:typeof roads)=>list.some(r=>x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1);
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const x0=xs[i],x1=xs[i+1],z0=zs[j],z1=zs[j+1],x=(x0+x1)/2,z=(z0+z1)/2,kind=inside(x,z,roads)?0:inside(x,z,walks)?1:-1;if(kind<0)continue;for(const [px,pz] of [[x0,z0],[x0,z1],[x1,z0],[x1,z0],[x0,z1],[x1,z1]]){positions[kind].push(px,kind===0?.018:.03,pz);uvs[kind].push(px/12,pz/12);}}
 roadTexture.repeat.set(1,1);
 for(let kind=0;kind<2;kind++){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions[kind],3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs[kind],2));geo.computeVertexNormals();mesh(geo,kind===0?asphalt:paving,[0,0,0],kind===0?'city-road-network':'city-sidewalk-network');}
 for(const x of [-18,18])for(const stripe of [-1.8,-1.2,-.6,0,.6,1.2,1.8])mesh(new T.BoxGeometry(.32,.006,2.2),marking,[x+stripe,.034,8.55],`crosswalk-${x}-${stripe}`);
 const windows:{position:T.Vector3;rotation:number;lit:boolean}[]=[];
 for(const b of CITY_BUILDINGS){
  const group=new T.Group();group.name=b.id;group.position.set(...b.position);root.add(group);
  const part=(geo:T.BufferGeometry,mat:T.Material,p:number[],name:string,solid=false)=>{const m=new T.Mesh(geo,mat);m.position.set(...p as [number,number,number]);m.name=b.id+'/'+name;m.receiveShadow=true;m.castShadow=solid;group.add(m);if(solid)blockers.push(m);return m;};
  part(new T.BoxGeometry(b.width+.6,.22,b.depth+.6),stone,[0,-.1,0],'ground-footing');
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
 const skylineMaterial=material('#526777'),skyline=new T.InstancedMesh(new T.BoxGeometry(1,1,1),skylineMaterial,CITY_BACKDROP.length),roofline=new T.InstancedMesh(new T.BoxGeometry(1,1,1),roof,CITY_BACKDROP.length),dummy=new T.Object3D();
 CITY_BACKDROP.forEach((b,i)=>{dummy.position.set(b.position[0],b.height/2-.04,b.position[2]);dummy.scale.set(b.width,b.height,b.depth);dummy.updateMatrix();skyline.setMatrixAt(i,dummy.matrix);dummy.position.y=b.height;dummy.scale.set(b.width+.2,.22,b.depth+.2);dummy.updateMatrix();roofline.setMatrixAt(i,dummy.matrix);});
 skyline.name='distant-city-blocks';roofline.name='distant-city-roofline';root.add(skyline,roofline);
 // Fixed illustrated city layers close the road vanishing points behind the 3D blocks.
 // Alpha-cut roofs keep the real night sky; two depths provide restrained parallax.
 for(let layer=0;layer<2;layer++){
  const cv=document.createElement('canvas');cv.width=2048;cv.height=512;const pen=cv.getContext('2d')!;
  let x=0,index=0;
  while(x<cv.width){const seed=index*37+layer*17,width=25+seed%43,height=130+seed*11%300,y=cv.height-height;
   pen.fillStyle=layer?'#344b60':'#2b4055';pen.fillRect(x,y,width+1,height);
   pen.fillStyle=layer?'#3c5367':'#344a5e';pen.fillRect(x+width*.66,y,Math.max(3,width*.34),height);
   pen.fillStyle='#263a4d';pen.fillRect(x-1,y-3,width+3,5);
   if(index%3===0){pen.fillRect(x+width*.4,y-16,width*.24,16);pen.fillRect(x+width*.5,y-30,2,14);}
   pen.fillStyle=layer?'#536477':'#455b70';for(let row=y+18;row<cv.height-12;row+=24)for(let col=x+7;col<x+width-4;col+=12)pen.fillRect(col,row,4,7);
   x+=width;index++;
  }
  const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;textures.push(texture);
  const mat=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.15,side:T.DoubleSide,depthWrite:true,fog:true});materials.push(mat);
  const d=layer?150:166,h=layer?35:48;
  for(let side=0;side<4;side++){const card=mesh(new T.PlaneGeometry(d*2,h),mat,side<2?[0,h/2-.18,(side?1:-1)*d]:[(side===2?1:-1)*d,h/2-.18,0],`city-painted-horizon-${layer}-${side}`);card.rotation.y=side===0?0:side===1?Math.PI:side===2?-Math.PI/2:Math.PI/2;card.castShadow=false;card.receiveShadow=false;card.layers.set(NOINK);}
 }
 return {root,materials,textures,blockers,windowMaterial,asphalt};
}
