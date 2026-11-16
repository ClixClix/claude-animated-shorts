import * as T from 'three';
import {CAFE_CONFIG, Fixture, ROOM, V3} from './config';
import {NOINK} from '../../videos/bridge/ink';

const PAL={ink:'#292b38',walnut:'#72513d',oak:'#ba8b58',cream:'#e8d2a7',green:'#37665e',dark:'#234942',brass:'#c59c57',tile:'#9aaf9d',plaster:'#c8bd9f'};
/** Only this module constructs permanent geometry. No camera/shot branch is allowed here. */
export class CafeEnvironment {
 readonly root=new T.Group();readonly fixtures=new Map<string,T.Group>();
 readonly blockers:T.Mesh[]=[];readonly materials:T.Material[]=[];readonly textures:T.Texture[]=[];
 private serial=0;
 constructor(){
   this.root.name='cafe-permanent';this.architecture();
   for(const spec of CAFE_CONFIG.fixtures){const g=new T.Group();g.name=spec.id;g.position.set(...spec.position);g.rotation.y=spec.rotation??0;g.userData={fixture:spec.id,role:spec.role};this.root.add(g);this.fixtures.set(spec.id,g);this.fixture(g,spec);}
   this.street();this.lighting();
 }
 private mat(color:string,emissive?:string,intensity=0){const m=new T.MeshStandardMaterial({color,roughness:0.91,metalness:0.02,emissive:emissive??'#000000',emissiveIntensity:intensity});this.materials.push(m);return m;}
 private painted(color:string,kind:'wood'|'plaster'|'floor'='wood'){
   const cv=document.createElement('canvas');cv.width=256;cv.height=256;const g=cv.getContext('2d')!;
   g.fillStyle=color;g.fillRect(0,0,256,256);
   const rnd=(i:number)=>(Math.sin(i*73.37+11.91)*19473.733)%1;
   if(kind==='floor'){
     for(let row=0;row<8;row++){
       const y=row*32;g.fillStyle=row%3===0?'#c49a6b':row%3===1?'#b68a5e':'#ac7f57';g.fillRect(0,y,256,32);
       g.strokeStyle='#80634c';g.lineWidth=1.2;g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();
       const joint=(row%3)*80+20;g.fillStyle='#8e6b4c';g.fillRect(joint,y,1,32);
       for(let i=0;i<15;i++){g.strokeStyle='rgba(255,230,180,0.09)';g.beginPath();g.moveTo(0,y+2+i*2);g.quadraticCurveTo(125,y+i*2+4,256,y+2+i*2);g.stroke();}
     }
   }else{
     for(let i=0;i<950;i++){const x=Math.abs(rnd(i))*256,y=Math.abs(rnd(i+351))*256;
       g.fillStyle=i%2?'rgba(250,230,190,0.022)':'rgba(20,25,40,0.022)';
       g.fillRect(x,y,kind==='wood'?1:2,kind==='wood'?20+Math.abs(rnd(i+11))*90:2);
     }
   }
   const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;
   tx.repeat.set(kind==='floor'?4:1,kind==='floor'?3:1);tx.anisotropy=8;this.textures.push(tx);
   const m=this.mat('#ffffff');m.map=tx;return m;
 }
 private add(parent:T.Group,geometry:T.BufferGeometry,material:T.Material,position:V3,solid=true){
   const m=new T.Mesh(geometry,material);m.name=`${parent.name}/part-${++this.serial}`;m.position.set(...position);
   m.castShadow=solid;m.receiveShadow=true;m.userData.obstruction=solid;parent.add(m);if(solid)this.blockers.push(m);return m;
 }
 private box(p:T.Group,s:V3,at:V3,c:string|T.Material,solid=true){return this.add(p,new T.BoxGeometry(...s),typeof c==='string'?this.mat(c):c,at,solid);}
 private cyl(p:T.Group,r1:number,r2:number,h:number,at:V3,c:string|T.Material,segments=16,solid=true){return this.add(p,new T.CylinderGeometry(r1,r2,h,segments),typeof c==='string'?this.mat(c):c,at,solid);}
 private text(p:T.Group,text:string,w:number,h:number,at:V3,bg:string,fg:string,size=60){
   const cv=document.createElement('canvas');cv.width=1024;cv.height=Math.round(1024*h/w);const g=cv.getContext('2d')!;
   g.fillStyle=bg;g.fillRect(0,0,cv.width,cv.height);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
   const lines=text.split('\n');g.font=`600 ${size}px Georgia, serif`;
   lines.forEach((l,i)=>g.fillText(l,512,cv.height/2+(i-(lines.length-1)/2)*size*1.5));
   const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=8;this.textures.push(tx);
   const mat=new T.MeshBasicMaterial({map:tx});this.materials.push(mat);
   const mesh=this.add(p,new T.PlaneGeometry(w,h),mat,at,false);return mesh;
 }
 private architecture(){
   const g=new T.Group();g.name='shell';this.root.add(g);
   this.box(g,[8.5,0.2,9],[0,-0.13,0],PAL.walnut);
   const floor=this.box(g,[8,0.04,8.4],[0,-0.02,0],this.painted('#b38d65','floor'),false);floor.name='floor';
   // Left and rear solid shell, with panel wainscot and a tiled working backsplash.
   this.box(g,[0.18,4.5,8.4],[-4.09,2.25,0],this.painted(PAL.green,'plaster'));
   this.box(g,[8.18,4.5,0.18],[0,2.25,-4.29],this.painted(PAL.plaster,'plaster'));
   this.box(g,[0.035,1.1,8.3],[-3.985,0.55,0],PAL.dark);
   this.box(g,[8,1.06,0.035],[0,0.53,-4.185],PAL.dark);
   this.box(g,[0.08,0.075,8.4],[-3.94,1.12,0],PAL.oak);
   for(let z=-3.9;z<4;z+=0.65)this.box(g,[0.045,0.95,0.035],[-3.95,0.56,z],PAL.green);
   this.box(g,[4.8,1.03,0.035],[-1.35,1.65,-4.177],PAL.tile);
   for(let y=1.15;y<2.2;y+=0.22)for(let x=-3.7;x<1;x+=0.42)this.box(g,[0.385,0.19,0.018],[x+(Math.round(y*10)%2)*0.2,y,-4.15],'#c5cbb0',false);
   // Front glazing: opaque wall exists only OUTSIDE actual openings. Clear, fixed panes in them.
   this.box(g,[8.2,0.72,0.16],[0,4.14,4.28],PAL.dark);
   this.box(g,[4.55,0.8,0.16],[-1.45,0.4,4.28],PAL.dark);
   for(const x of [-3.88,0.88,3.15,3.9])this.box(g,[x===0.88?0.33:0.22,3.7,0.20],[x,1.85,4.25],PAL.dark);
   // Right side storefront glazing, with two continuous window bays.
   this.box(g,[0.16,0.85,8.4],[4.08,0.425,0],PAL.dark);
   this.box(g,[0.16,0.78,8.4],[4.08,4.11,0],PAL.dark);
   for(const z of [-4.1,-0.05,4.1])this.box(g,[0.2,3.4,0.22],[4.03,2.25,z],PAL.dark);
   for(const o of CAFE_CONFIG.openings){
     const group=new T.Group();group.name=o.id;this.root.add(group);
     const height=o.top-o.bottom,cy=(o.top+o.bottom)/2;
     if(o.wall==='front'){group.position.set(o.center,0,4.24);}else{group.position.set(4.025,0,o.center);group.rotation.y=Math.PI/2;}
     const glass=new T.MeshBasicMaterial({color:'#6a9aa5',transparent:true,opacity:0.035,side:T.DoubleSide,depthWrite:false});this.materials.push(glass);
     const pane=this.add(group,new T.PlaneGeometry(o.width,height),glass,[0,cy,0],false);pane.name=`${o.id}/glass`;pane.layers.set(NOINK);
     for(const x of [-o.width/2,o.width/2])this.box(group,[0.095,height+0.12,0.12],[x,cy,0],PAL.oak);
     for(const y of [o.bottom,o.top])this.box(group,[o.width,0.09,0.12],[0,y,0],PAL.oak);
     this.box(group,[o.width,0.06,0.08],[0,3.08,0],PAL.oak);
     if(o.id==='entrance'){
       this.box(group,[0.07,height,0.13],[-0.02,cy,0],PAL.green);
       this.box(group,[o.width,0.48,0.09],[0,0.24,0],PAL.green);
       this.cyl(group,0.033,0.033,0.29,[0.48,1.27,0.10],PAL.brass);
       this.text(group,'OPEN',0.55,0.25,[0.15,2.3,0.03],PAL.cream,PAL.dark,130);
     }else{
       const count=o.width>4?3:2;
       for(let i=1;i<count;i++)this.box(group,[0.065,height,0.09],[-o.width/2+o.width*i/count,cy,0],PAL.oak);
     }
   }
   // Ceiling/roof are permanent. All interior cameras are BELOW this ceiling, never inside it.
   this.box(g,[8.4,0.15,8.8],[0,4.57,0],this.painted('#657069','plaster'));
   for(const z of [-3.8,-1,1.6,4])this.box(g,[8,0.20,0.16],[0,4.4,z],PAL.walnut);
   this.box(g,[8.7,0.2,9.05],[0,4.75,0],PAL.dark);
   this.box(g,[8.35,0.48,0.12],[0,5.02,4.4],PAL.green);
   this.box(g,[0.12,0.48,8.9],[-4.12,5.02,0],PAL.green);
   this.box(g,[0.12,0.48,8.9],[4.12,5.02,0],PAL.green);
   this.box(g,[8.35,0.48,0.12],[0,5.02,-4.4],PAL.green);
   // A low pitched standing-seam roof gives the permanent shop a recognizable town silhouette.
   for(const side of [-1,1]){
     const panel=this.box(g,[8.65,0.12,4.79],[0,5.67,side*2.3],this.painted('#4c6164'));
     panel.rotation.x=side*0.28;
     for(let x=-4.05;x<4.2;x+=0.57){const seam=this.box(g,[0.023,0.025,4.79],[x,5.75,side*2.3],'#62777a',false);seam.rotation.x=side*0.28;}
   }
   this.box(g,[8.8,0.13,0.16],[0,6.34,0],'#6b7d78');
   for(const side of [-1,1]){
     const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute([0,5.04,-4.6,0,6.31,0,0,5.04,4.6],3));geom.computeVertexNormals();
     const material=this.mat(PAL.green);material.side=T.DoubleSide;this.add(g,geom,material,[side*4.23,0,0]);
   }
   const chimney=this.box(g,[0.44,1.04,0.48],[-2.7,6.16,-1.8],PAL.walnut);chimney.name='roof-chimney';
   this.box(g,[0.57,0.12,0.61],[-2.7,6.74,-1.8],PAL.plaster);
   // Facade sign, awning and thresholds are architecture, never extra furniture.
   this.box(g,[6.3,0.65,0.16],[-0.4,4.10,4.40],PAL.green);
   this.text(g,'THREE CATS',4.9,0.45,[-0.55,4.10,4.50],PAL.green,'#f3d6a0',110);
   const awning=this.box(g,[8.1,0.10,0.85],[0,3.63,4.65],PAL.oak);awning.rotation.x=-0.13;
   for(let i=0;i<15;i++)this.box(g,[0.27,0.16,0.065],[-3.87+i*0.55,3.47,5.08],i%2?PAL.cream:PAL.green);
   this.box(g,[1.7,0.08,0.7],[2.25,-0.01,4.5],PAL.plaster);
   // Shelf dressing, jars, menu and towels all belong to permanent fixture parents.
 }
 private mug(g:T.Group,color:string){
   this.cyl(g,0.105,0.08,0.19,[0,0.105,0],color,20);
   this.cyl(g,0.084,0.084,0.008,[0,0.205,0],'#4b342c',20,false);
   const handle=this.add(g,new T.TorusGeometry(0.067,0.018,6,14),this.mat(color),[0.13,0.12,0],false);handle.rotation.y=Math.PI/2;
   this.cyl(g,0.15,0.15,0.016,[0,0.012,0],PAL.cream,24,false);
 }
 private fixture(g:T.Group,s:Fixture){
   const [w,h,d]=s.size;
   if(s.role==='serving-counter'||s.role==='preparation-counter'){
     this.box(g,[w-0.12,h-0.08,d-0.10],[0,(h-0.08)/2,0],this.painted(PAL.green));
     this.box(g,[w,0.1,d],[0,h-0.05,0],this.painted(s.role==='serving-counter'?PAL.oak:PAL.walnut));
     this.box(g,[w-0.04,0.07,0.04],[0,h-0.14,d/2-0.04],PAL.brass);
     this.box(g,[w-0.1,0.10,0.06],[0,0.1,d/2-0.03],PAL.dark);
     for(let x=-w/2+0.17;x<w/2;x+=0.28)this.box(g,[0.025,h-0.33,0.018],[x,h/2-0.01,d/2-0.04],PAL.dark,false);
     if(s.role==='serving-counter')this.text(g,'THREE CATS\nCOFFEE & COMPANY',1.7,0.46,[0,0.61,d/2+0.005],PAL.green,'#ead5ac',64);
   }else if(s.role==='customer-table'){
     this.cyl(g,w/2,w/2,0.085,[0,h-0.0425,0],this.painted(PAL.oak),32);
     this.cyl(g,0.055,0.072,h-0.10,[0,(h-0.10)/2,0],PAL.dark);
     this.cyl(g,0.30,0.35,0.055,[0,0.035,0],PAL.dark);
     // A small permanent sugar bowl and table posy, anchored to the tabletop.
     this.cyl(g,0.075,0.055,0.12,[0.25,h+0.06,0.05],PAL.cream,14,false);
     this.cyl(g,0.038,0.045,0.13,[0.08,h+0.065,0.22],PAL.green,12,false);
     for(let i=0;i<3;i++){this.cyl(g,0.007,0.007,0.18,[0.08+i*0.018,h+0.20,0.22],PAL.green,6,false);this.add(g,new T.IcosahedronGeometry(0.04,0),this.mat('#d7a775'),[0.08+i*0.018,h+0.29,0.22],false);}
   }else if(s.role==='chair'){
     const col=s.color??PAL.oak;this.box(g,[0.5,0.075,0.49],[0,0.47,0],col);
     for(const x of [-0.19,0.19])for(const z of [-0.19,0.19])this.box(g,[0.045,0.46,0.045],[x,0.23,z],PAL.walnut);
     this.box(g,[0.51,0.26,0.065],[0,0.86,-0.21],col);
     for(const x of [-0.2,0.2])this.box(g,[0.045,0.5,0.045],[x,0.73,-0.21],PAL.walnut);
   }else if(s.role==='bench'){
     for(const x of [-0.65,0.65])for(const z of [-0.4,0.4])this.box(g,[0.09,0.25,0.09],[x,0.125,z],PAL.walnut);
     this.box(g,[w,0.13,d],[0,0.31,0],PAL.walnut);
     this.box(g,[w-0.10,0.10,d-0.1],[0,0.41,0],this.painted('#b58162','plaster'));
     this.box(g,[0.13,0.55,d],[-w/2+0.02,0.54,0],PAL.walnut);
     const pillow=this.box(g,[0.32,0.32,0.56],[-0.52,0.61,0],this.painted('#d4b778','plaster'));pillow.rotation.z=0.18;
   }else if(s.role==='riser'){
     this.box(g,s.size,[0,h/2,0],PAL.walnut);this.box(g,[w,0.025,d],[0,h-0.0125,0],PAL.dark);
   }else if(s.role==='espresso-machine'){
     this.box(g,[w,0.45,d],[0,0.30,0],this.painted(s.color!));
     this.box(g,[w+0.04,0.055,d+0.04],[0,0.56,0],PAL.cream);
     this.box(g,[w-0.1,0.25,0.10],[0,0.23,d/2],PAL.dark);
     this.box(g,[w,0.035,0.29],[0,0.035,0.23],PAL.brass);
     for(const x of [-0.3,0.3]){
       this.cyl(g,0.075,0.075,0.08,[x,0.31,0.32],PAL.brass);
       this.box(g,[0.045,0.04,0.24],[x,0.25,0.40],PAL.ink);
       const dial=this.cyl(g,0.06,0.06,0.02,[x,0.44,0.335],PAL.cream,20);dial.rotation.x=Math.PI/2;
       this.box(g,[0.008,0.03,0.015],[x+0.008,0.45,0.35],PAL.ink,false);
     }
     for(const x of [-0.35,0,0.35]){const cup=new T.Group();cup.name=`${s.id}/top-cup-${x}`;cup.position.set(x,0.59,0);cup.scale.setScalar(0.65);g.add(cup);this.mug(cup,'#ead8b8');}
     this.box(g,[0.025,0.20,0.03],[0.55,0.15,0.40],PAL.brass);
   }else if(s.role==='grinder'){
     this.box(g,[0.27,0.37,0.29],[0,0.19,0],PAL.dark);
     this.cyl(g,0.15,0.1,0.26,[0,0.52,0],PAL.walnut,12);
     this.cyl(g,0.16,0.16,0.035,[0,0.67,0],PAL.ink,12);
     this.box(g,[0.09,0.10,0.16],[0,0.32,0.19],PAL.brass);
   }else if(s.role==='shelf'){
     this.box(g,s.size,[0,h/2,0],this.painted(PAL.oak));
     for(const x of [-w/2+0.3,w/2-0.3])this.box(g,[0.04,0.24,0.20],[x,-0.09,-0.03],PAL.brass);
     if(s.id==='shelf-upper'){
       for(let i=0;i<5;i++){
         this.cyl(g,0.14,0.14,0.33,[-1.5+i*0.62,h+0.165,0],['#b98863','#b09b77','#57796b'][i%3],14);
         this.cyl(g,0.15,0.15,0.045,[-1.5+i*0.62,h+0.35,0],PAL.walnut,14);
         this.box(g,[0.15,0.12,0.015],[-1.5+i*0.62,h+0.16,0.14],PAL.cream,false);
       }
     }else{
       this.text(g,'SLOW MORNINGS\nLATE NIGHTS',1.55,0.43,[0.95,0.30,-0.08],PAL.dark,PAL.cream,83);
     }
   }else if(s.role==='mug')this.mug(g,s.color??PAL.cream);
   else if(s.role==='pastry-plate'){
     this.cyl(g,0.32,0.32,0.025,[0,0.013,0],PAL.cream,28,false);
     for(const x of [-0.16,0.13]){
       const croissant=this.add(g,new T.TorusGeometry(0.115,0.058,6,14,Math.PI*1.6),this.mat('#c99858'),[x,0.09,0],false);croissant.rotation.x=Math.PI/2;
       for(let i=0;i<3;i++)this.box(g,[0.018,0.012,0.12],[x-0.045+i*0.043,0.139,0],PAL.cream,false);
     }
   }else if(s.role==='pendant'){
     this.cyl(g,0.008,0.008,h-0.24,[0,(h+0.24)/2,0],PAL.ink,6,false);
     this.cyl(g,0.12,w/2,0.23,[0,0.15,0],PAL.green,20);
     this.cyl(g,w/2-0.02,w/2-0.02,0.022,[0,0.031,0],this.mat('#ffe1a1','#ffd18a',1.3),20,false).layers.set(NOINK);
     const point=new T.PointLight('#ffdcab',18,6.8,2);point.name=`${s.id}/practical-light`;point.position.set(0,-0.04,0);g.add(point);
   }else if(s.role==='plant'){
     this.cyl(g,0.29,0.20,0.45,[0,0.225,0],this.painted('#b37555'),14);
     for(let i=0;i<9;i++){
       const a=i*2.399;const leaf=this.add(g,new T.SphereGeometry(0.18,7,5),this.mat(i%2?'#648a65':'#436e59'),[Math.sin(a)*0.23,0.65+(i%3)*0.20,Math.cos(a)*0.23],false);
       leaf.scale.set(0.75,1.9,0.45);leaf.rotation.z=Math.sin(a)*0.7;
     }
   }else if(s.role==='menu'){
     this.box(g,[1.08,1.25,0.06],[0,0.625,0],PAL.oak);
     this.text(g,'THE NIGHT MENU\nESPRESSO   3\nCAPPUCCINO   4\nCHOCOLATE   4\nBUTTER CROISSANT   3',0.96,1.13,[0,0.625,0.04],PAL.dark,'#e9d9b7',44);
   }else if(s.role==='rug'){
     // The previous layered stripe meshes overlapped the rug and shimmered in motion.
     // Keep the same design on a single thin, mipmapped box so no faces compete.
     const canvas=document.createElement('canvas');
     canvas.width=canvas.height=256;
     const ctx=canvas.getContext('2d')!;
     ctx.fillStyle='#917863';ctx.fillRect(0,0,256,256);
     ctx.fillStyle='#b7a28a';ctx.fillRect(8,8,240,240);
     for(let x=22;x<244;x+=32){
       ctx.fillStyle='#9c876f';
       ctx.fillRect(x,16,5,224);
     }
     const texture=new T.CanvasTexture(canvas);
     texture.colorSpace=T.SRGBColorSpace;
     texture.generateMipmaps=true;
     texture.minFilter=T.LinearMipmapLinearFilter;
     texture.magFilter=T.LinearFilter;
     texture.anisotropy=4;
     this.textures.push(texture);
     const rugMaterial=this.mat('#ffffff');
     rugMaterial.map=texture;
     const rug=this.box(g,[w,0.014,d],[0,0.002,0],rugMaterial,false);
     rug.name='cat-rug-single-mesh';
   }
 }
 private street(){
   const g=new T.Group();g.name='night-town';this.root.add(g);
   this.box(g,[45,0.16,45],[0,-0.30,0],this.painted('#34424d','plaster'));
   this.box(g,[10,0.12,11],[0,-0.17,0],this.painted('#77827e','plaster'));
   for(let i=0;i<10;i++)this.box(g,[0.025,0.012,11],[-4.5+i,-0.104,0],'#5c6a6b',false);
   const buildings:V3[]=[[-10,0,-4],[-10,0,3],[-10,0,10],[9.8,0,-6],[10.5,0,3],[-5,0,-12],[1,0,-13],[7,0,-13],[-7,0,17],[0,0,19],[7,0,18]];
   buildings.forEach((p,i)=>{
     const b=new T.Group();b.name=`town-building-${i+1}`;b.position.set(...p);g.add(b);
     const h=(i>=5&&i<=7?8.5:5)+(i%3)*1.2,w=4.0;this.box(b,[w,h,4],[0,h/2,0],this.painted(['#384c5b','#4a5364','#595d65'][i%3],'plaster'));
     this.box(b,[w+0.2,0.18,4.2],[0,h+0.08,0],'#293b49');
     for(let row=0;row<(i>=5&&i<=7?5:3);row++)for(const x of [-1.1,1.1]){
       const mat=this.mat('#cdb17a','#e5af64',i%3===0?0.4:0.15);
       this.box(b,[0.75,0.9,0.025],[x,1.4+row*1.5,2.025],mat,false);
       this.box(b,[0.045,0.93,0.035],[x,1.4+row*1.5,2.05],'#283c49',false);
       this.box(b,[0.93,0.07,0.18],[x,0.92+row*1.5,2.09],'#788282',false);
     }
   });
   for(const x of [-6,6]){
     this.cyl(g,0.065,0.09,3.1,[x,1.4,6.5],PAL.ink,10);
     this.box(g,[0.32,0.44,0.32],[x,3.08,6.5],this.mat('#dfc084','#e2ac56',1.1));
     this.cyl(g,0.29,0.08,0.18,[x,3.39,6.5],PAL.ink,4);
     const light=new T.PointLight('#efb867',20,5,2);light.position.set(x,3.05,6.5);g.add(light);
   }
   const moon=this.add(g,new T.SphereGeometry(0.46,24,16),new T.MeshBasicMaterial({color:'#dfd9b8'}),[-10,13,-28],false);moon.name='night-moon';moon.layers.set(NOINK);
   // Sparse stable stars in the night, not particle effects.
   for(let i=0;i<45;i++){
     const x=Math.sin(i*14.3)*50,z=-25-Math.abs(Math.cos(i*12.7))*30,y=13+(i%9)*2.1;
     this.add(g,new T.SphereGeometry(0.025+(i%3)*0.008,5,4),new T.MeshBasicMaterial({color:'#b8c9d8'}),[x,y,z],false).layers.set(NOINK);
   }
 }
 private lighting(){
   const sky=new T.HemisphereLight('#acbdd4','#7a6153',0.95);sky.name='night-sky-fill';this.root.add(sky);
   const interior=new T.PointLight('#ffe9ce',30,10,2);interior.name='interior-bounce';interior.position.set(-0.8,3.45,-1.75);this.root.add(interior);
   const key=new T.DirectionalLight('#ffe7cd',1.4);key.name='warm-interior-key';key.position.set(0.8,4.1,1.8);key.target.position.set(-1,0.5,-1.5);
   key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.camera.near=0.2;key.shadow.camera.far=18;key.shadow.bias=-0.00015;key.shadow.normalBias=0.015;
   this.root.add(key,key.target);
   const spill=new T.PointLight('#f8c68e',15,5,2);spill.name='front-window-spill';spill.position.set(-1.0,1.8,4.8);this.root.add(spill);
   const moon=new T.DirectionalLight('#8ba9d2',1.1);moon.name='window-moon';moon.position.set(8,9,8);this.root.add(moon);
 }
 dispose(){
   this.root.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();if(o instanceof T.Light)o.dispose();});
   for(const m of this.materials)m.dispose();for(const t of this.textures)t.dispose();this.root.clear();
 }
}
