import * as T from 'three';
import {createCity} from './city';
import {mouthAnchor} from './contacts';
import {batchCafe} from './batch';
import {CafeEnvironment} from '../../cafe/environment';
import {NOINK} from '../../../videos/bridge/ink';
import {V3} from '../../cafe/config';
import {EpisodeState,HOME,CLOCK,SIGN,LANTERN,STREETLIGHTS,mouseAt,clamp,beat,lerp,mix} from './timeline';

/** Episode extensions only. The permanent café constructor/configuration remain the sole source. */
export class EpisodeWorld{
 readonly cafe=new CafeEnvironment();readonly root=new T.Group();readonly blockers:T.Mesh[]=[];
 readonly props=new Map<string,T.Object3D>();readonly materials:T.Material[]=[];readonly textures:T.Texture[]=[];
 readonly lights:{id:string;point:T.PointLight;bulb:T.MeshStandardMaterial}[]=[];
 readonly door:T.Group;readonly homeDoor=new T.Group();readonly bus=new T.Group();readonly clockCanvas=document.createElement('canvas');readonly clockTexture:T.CanvasTexture;
 readonly rain:T.LineSegments;readonly blanket:T.Mesh;readonly homeBlanket:T.Mesh;readonly bowl=new T.Group();readonly lanternLight:T.PointLight;
 private serial=0;
 private townWindows:{mat:T.MeshStandardMaterial;color:T.Color;emissive:number}[]=[];
 private permanentLights:{light:T.Light;intensity:number}[]=[];private pendantBulbs:{mat:T.MeshStandardMaterial;emissive:number}[]=[];
 private traffic:T.Group[]=[];private backgroundTraffic:T.Group[]=[];
 readonly shadowScreen:T.Mesh;readonly rainPositions:Float32Array;
 constructor(optimize=true){
  this.root.name='door-at-1111-extensions';this.root.add(this.cafe.root);this.door=this.rigDoor();
  this.home();this.street();this.busStop();this.makeBus();this.parkedCars();this.livingDetails();this.cityBlocks();
  this.clockCanvas.width=this.clockCanvas.height=768;this.clockTexture=new T.CanvasTexture(this.clockCanvas);this.clockTexture.colorSpace=T.SRGBColorSpace;this.textures.push(this.clockTexture);
  const clockGroup=new T.Group();clockGroup.name='episode-clock';clockGroup.position.set(...CLOCK);this.root.add(clockGroup);this.props.set('clock',clockGroup);
  this.cylinder(clockGroup,1.15,1.15,.10,[0,0,-.04],'#bda36d').rotation.x=Math.PI/2;
  const tower=new T.Group();tower.name='city-clock-tower';tower.position.set(CLOCK[0],0,CLOCK[2]-1.295);this.root.add(tower);this.props.set('clock-tower',tower);const h=CLOCK[1];
  this.box(tower,[2.55,.24,2.55],[0,0,0],'#6f726e');this.box(tower,[1.8,h-1.1,1.8],[0,(h-1.1)/2,0],'#788078');
  for(let y=2;y<h-1.2;y+=2)this.box(tower,[1.9,.10,1.9],[0,y,0],'#a29d87');
  this.box(tower,[2.55,2.6,2.55],[0,h,0],'#9b9785');this.box(tower,[2.9,.24,2.9],[0,h+1.4,0],'#3b515d');this.cylinder(tower,.95,1.4,1.1,[0,h+2.05,0],'#435461');
  const clockMat=new T.MeshBasicMaterial({map:this.clockTexture,transparent:true,alphaTest:.05});this.materials.push(clockMat);
  for(const [i,x,z,angle] of [[0,CLOCK[0],CLOCK[2],0],[1,CLOCK[0]+1.295,CLOCK[2]-1.295,Math.PI/2],[2,CLOCK[0]-1.295,CLOCK[2]-1.295,-Math.PI/2],[3,CLOCK[0],CLOCK[2]-2.59,Math.PI]]){
   const group=i===0?clockGroup:new T.Group();if(i){group.name='clock-side-'+i;group.position.set(x,h,z);group.rotation.y=angle;this.root.add(group);this.cylinder(group,1.15,1.15,.1,[0,0,-.04],'#bda36d').rotation.x=Math.PI/2;}
   const face=new T.Mesh(new T.CircleGeometry(1.075,64),clockMat);face.position.z=.02;face.layers.set(NOINK);group.add(face);
  }
  const fog=this.box(this.root,[4.40,2.78,.008],[-1.45,2.22,4.247],'#dac6a0',false);fog.name='rain-fogged-cafe-window';fog.material=new T.MeshStandardMaterial({color:'#cbbd9b',roughness:1,transparent:false,opacity:1,emissive:'#7b552c',emissiveIntensity:.025,side:T.DoubleSide});this.materials.push(fog.material);fog.receiveShadow=true;fog.layers.set(NOINK);this.props.set('shadow',fog);
  const screen=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true,opacity:0}));screen.visible=false;this.root.add(screen);this.shadowScreen=screen;
  this.lights.forEach((lamp,i)=>{const p=STREETLIGHTS[i],g=new T.Group();g.name='lamp-frame-'+i;g.position.set(...p);this.root.add(g);for(const x of [-.155,.155])for(const z of [-.155,.155])this.box(g,[.027,.49,.027],[x,3.08,z],'#253c47',false);for(const y of [2.84,3.32])this.box(g,[.36,.045,.36],[0,y,0],'#253c47',false);});
  const piers=new T.Group();piers.name='facade-gap-infill';this.root.add(piers);this.box(piers,[8.2,.10,.18],[0,3.74,4.25],'#234942');
  this.box(piers,[.48,3.7,.18],[1.285,1.85,4.25],'#234942');this.box(piers,[.53,3.7,.18],[3.525,1.85,4.25],'#234942');
  this.sign();this.lanternLight=this.lantern();
  this.blanket=this.cloth('mocha-blanket','#9c9d7f',2.5,1.8);this.homeBlanket=this.cloth('latte-home-blanket','#a59a7e',1.25,1.45);
  this.root.add(this.blanket,this.homeBlanket);this.props.set('blanket',this.blanket);this.props.set('home-blanket',this.homeBlanket);
  this.makeBowl();this.root.add(this.bowl);this.props.set('bowl',this.bowl);
  this.rainPositions=new Float32Array(240*6);const rg=new T.BufferGeometry();rg.setAttribute('position',new T.BufferAttribute(this.rainPositions,3));
  this.rain=new T.LineSegments(rg,new T.LineBasicMaterial({color:'#a1b7c2',transparent:true,opacity:.25,depthWrite:false}));this.rain.name='rain-outside-only';this.rain.layers.set(NOINK);this.root.add(this.rain);
  // Retain baseline intensities; episode blackout is a deterministic state, never a saved layout edit.
  this.cafe.root.traverse(o=>{
   if(o instanceof T.Light)this.permanentLights.push({light:o,intensity:o.intensity});
   if(o instanceof T.Mesh){const mat=o.material as T.MeshStandardMaterial;for(let p:T.Object3D|null=o;p;p=p.parent){if(p.name.startsWith('town-building-')&&mat.emissiveIntensity>0){this.townWindows.push({mat,color:mat.color.clone(),emissive:mat.emissiveIntensity});break;}}if(mat.emissiveIntensity>1&&o.parent?.name.startsWith('pendant'))this.pendantBulbs.push({mat,emissive:mat.emissiveIntensity});}
  });
  if(optimize)this.root.add(batchCafe(this.cafe.root,this.door));
  const clouds=new T.Group();clouds.name='rain-clouds';clouds.position.set(-10.8,12.5,-25);for(let i=0;i<4;i++){const c=this.add(clouds,new T.SphereGeometry(.75,12,8),this.mat('#253c50'),[(i-1.5)*.72,Math.sin(i)*.12,0],false);c.scale.set(1.3,.50,.7);}this.root.add(clouds);this.props.set('clouds',clouds);
 }
 private mat(c:string){const m=new T.MeshStandardMaterial({color:c,roughness:.9,metalness:.02});this.materials.push(m);return m;}
 private add(parent:T.Object3D,g:T.BufferGeometry,m:T.Material,p:V3,solid=true){const mesh=new T.Mesh(g,m);mesh.name=`${parent.name||'episode'}/part-${++this.serial}`;mesh.position.set(...p);mesh.castShadow=solid;mesh.receiveShadow=true;parent.add(mesh);if(solid)this.blockers.push(mesh);return mesh;}
 private box(parent:T.Object3D,size:V3,p:V3,c:string,solid=true){return this.add(parent,new T.BoxGeometry(...size),this.mat(c),p,solid);}
 private cylinder(parent:T.Object3D,r1:number,r2:number,h:number,p:V3,c:string){return this.add(parent,new T.CylinderGeometry(r1,r2,h,16),this.mat(c),p,false);}
 private label(parent:T.Object3D,text:string,w:number,h:number,p:V3,bg='#254942',fg='#f5dfb3',font=54){
  const cv=document.createElement('canvas');cv.width=768;cv.height=Math.round(768*h/w);const g=cv.getContext('2d')!;g.fillStyle=bg;g.fillRect(0,0,cv.width,cv.height);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.font=`600 ${font}px Georgia`;
  const lines=text.split('\n');lines.forEach((line,i)=>g.fillText(line,384,cv.height/2+(i-(lines.length-1)/2)*font*1.35));
  const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;this.textures.push(tx);const mat=new T.MeshBasicMaterial({map:tx,side:T.DoubleSide});this.materials.push(mat);const mesh=this.add(parent,new T.PlaneGeometry(w,h),mat,p,false);mesh.layers.set(NOINK);return mesh;
 }
 private rigDoor(){
  const entrance=this.cafe.root.getObjectByName('entrance') as T.Group;this.cafe.root.updateMatrixWorld(true);const pivot=new T.Group();pivot.name='episode-cafe-door-hinge';pivot.position.x=-.725;entrance.add(pivot);this.cafe.root.updateMatrixWorld(true);
  const leaf=entrance.children.filter(c=>c!==pivot&&(c.name.endsWith('/glass')||Math.abs(c.position.x+.02)<.001||Math.abs(c.position.y-.24)<.001||Math.abs(c.position.x-.48)<.001||Math.abs(c.position.y-2.3)<.001));for(const child of leaf)pivot.attach(child);
  const pane=leaf.find(o=>o.name.endsWith('/glass')) as T.Mesh|undefined;if(pane){const mat=new T.MeshStandardMaterial({color:'#d5c5a4',roughness:1,side:T.DoubleSide,transparent:false,opacity:1,emissive:'#7b552c',emissiveIntensity:.10});this.materials.push(mat);pane.material=mat;}
  this.props.set('door',pivot);return pivot;
 }
 pushPoint(){this.root.updateMatrixWorld(true);return new T.Vector3(.90,.52,-.07).applyMatrix4(this.door.matrixWorld);}
 handle(){this.root.updateMatrixWorld(true);return new T.Vector3(1.205,1.27,.10).applyMatrix4(this.door.matrixWorld);}
 tapPoint(){return new T.Vector3(3.06,.45,4.30);}
 private home(){
  const g=new T.Group();g.name='latte-home';this.root.add(g);const color='#495665';
  this.box(g,[4.85,.22,4.15],[2.25,-.1,14.2],'#596967');this.box(g,[1.8,.22,.9],[3.15,-.06,11.86],'#69746e');
  this.box(g,[4.6,.2,3.8],[2.25,.1,14.2],'#81725e');
  this.box(g,[.16,3.4,3.8],[-.13,1.9,14.2],color);this.box(g,[.16,3.4,3.8],[4.63,1.9,14.2],color);this.box(g,[4.6,3.4,.16],[2.25,1.9,16.18],color);this.box(g,[4.9,.20,4.1],[2.25,3.7,14.2],'#324655');
  this.box(g,[2.1,.50,.15],[.85,.45,12.3],color);this.box(g,[4.6,.7,.15],[2.25,3.24,12.3],color);
  // Solid piers run from the floor to the header, framing one intentional doorway.
  for(const [x,w] of [[-.05,.15],[2.05,.45],[2.425,.45],[4.125,.85]])this.box(g,[w,2.69,.15],[x,1.545,12.3],color);
  this.box(g,[1.05,.18,.15],[3.175,2.84,12.3],color);
  this.box(g,[2.1,.04,.15],[.85,2.89,12.3],color);
  const window=new T.Group();window.name='home-window';window.position.set(.85,0,12.2);g.add(window);
  for(const x of [-1.0,1.0])this.box(window,[.08,1.95,.10],[x,1.75,0],'#b5a785');
  for(const y of [.675,2.84])this.box(window,[2.08,.08,.10],[0,y,0],'#b5a785');
  const glass=new T.Mesh(new T.PlaneGeometry(1.95,2.1),new T.MeshBasicMaterial({color:'#7f9ca9',transparent:true,opacity:.035,side:T.DoubleSide,depthWrite:false}));glass.position.set(0,1.75,0);glass.layers.set(NOINK);window.add(glass);this.materials.push(glass.material);
  this.homeDoor.name='home-door-hinge';this.homeDoor.position.set(2.65,.2,12.23);g.add(this.homeDoor);
  this.box(this.homeDoor,[1.05,2.55,.10],[.525,1.275,0],'#7a7163');this.cylinder(this.homeDoor,.035,.035,.08,[.87,1.08,-.08],'#c1a477').rotation.x=Math.PI/2;
  const porch=this.box(g,[1.8,.18,.9],[3.15,.09,11.86],'#928b7b');porch.name='home-porch';this.props.set('home-door',this.homeDoor);
  for(const x of [2.35,3.95]){for(const z of [11.55,12.10])this.box(g,[.07,.72,.07],[x,.54,z],'#ac9b7c');this.box(g,[.08,.07,.64],[x,.91,11.83],'#b8a787');}
  const porchMat=this.mat('#d9c594');porchMat.emissive.set('#edc784');const shade=this.add(g,new T.BoxGeometry(.22,.28,.18),porchMat,[3.96,2.42,12.16],false);shade.name='home-porch-lamp';this.props.set(shade.name,shade);const porchLight=new T.PointLight('#f2cc96',3,3,2);porchLight.position.set(3.8,2.4,11.9);porchLight.name='home-porch-light';g.add(porchLight);
  this.label(g,'LATTE',.68,.18,[3.15,2.99,12.19],'#3d4d58','#e6d2a8',84).rotation.y=Math.PI;
  const sw=this.box(g,[.10,.24,.10],HOME.switch,'#d8d2bc',false);sw.name='home-light-switch';this.props.set('switch',sw);
  const toggle=this.box(g,[.03,.09,.08],[HOME.switch[0]-.065,HOME.switch[1]+.015,HOME.switch[2]],'#f1e5ca',false);toggle.name='switch-toggle';
  const homeFill=new T.PointLight('#9fbad0',3.8,6,2);homeFill.name='home-moonlight';homeFill.position.set(.85,2.25,14.15);g.add(homeFill);
 }
 private street(){
  const pavement=this.box(this.root,[100,.06,5.3],[0,0,8.975],'#394b59',false);pavement.name='episode-road';this.box(this.root,[8.9,.06,.6],[-3.05,0,4.55],'#667776',false).name='entrance-apron-left';this.box(this.root,[4.4,.06,.6],[5.3,0,4.55],'#667776',false).name='entrance-apron-right';
  for(let x=-7;x<7;x+=1.4)this.box(this.root,[.7,.008,.07],[x,.034,9.0],'#7b7a6b',false);
  const puddle=this.add(this.root,new T.CircleGeometry(.72,32),new T.MeshStandardMaterial({color:'#516a78',roughness:.5,metalness:.12,transparent:true,opacity:.18}),[-.70,.034,9.0],false);puddle.rotation.x=-Math.PI/2;puddle.layers.set(NOINK);this.materials.push(puddle.material);
  // Reuse the two approved street lamps at +/-6. Add seven fixed lamps: nine total.
  const town=this.cafe.root.getObjectByName('night-town')!;
  const originalLamps=[-6,6].map(x=>town.children.filter(o=>o.position.x===x&&o.position.z===6.5));
  originalLamps.forEach((parts,i)=>parts.forEach(o=>{o.position.x=STREETLIGHTS[i][0];o.position.z=STREETLIGHTS[i][2];o.position.y+=STREETLIGHTS[i][1];}));
  for(let i=0;i<2;i++){
   const point=originalLamps[i].find(o=>o instanceof T.PointLight) as T.PointLight;
   const bulb=originalLamps[i].find(o=>o instanceof T.Mesh&&Math.abs(o.position.y-3.11)<.01) as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
   if(!point||!bulb)throw Error('Approved streetlamp missing.');point.name=`streetlight-${i+1}`;this.lights.push({id:point.name,point,bulb:bulb.material});this.props.set(`light-${i+1}`,bulb);
  }
  for(let i=2;i<9;i++){
   const p=STREETLIGHTS[i],g=new T.Group();g.name=`streetlight-${i+1}`;g.position.set(...p);this.root.add(g);
   this.cylinder(g,.048,.075,3.05,[0,1.525,0],'#283b46');const housing=this.box(g,[.31,.44,.31],[0,3.08,0],'#c3ac76',false);this.cylinder(g,.25,.03,.12,[0,3.36,0],'#263c46');
   const bulb=this.mat('#e3c797');bulb.emissive.set('#edbd75');bulb.emissiveIntensity=1.1;housing.material=bulb;const mesh=this.add(g,new T.SphereGeometry(.09,12,8),bulb,[0,3.1,0],false);mesh.layers.set(NOINK);
   const point=new T.PointLight('#efb867',8,3.1,2);point.position.set(0,3.05,0);g.add(point);this.lights.push({id:g.name,point,bulb});this.props.set(`light-${i+1}`,housing);
  }
 }
 private busStop(){
  const g=new T.Group();g.name='bus-stop';g.position.set(-4.4,0,5.8);this.root.add(g);this.cylinder(g,.04,.04,2.45,[-1.1,1.225,.62],'#334651');
  // Universal front-view bus pictogram; no tiny text to decipher.
  const cv=document.createElement('canvas');cv.width=cv.height=256;const c=cv.getContext('2d')!;
  c.fillStyle='#284c60';c.fillRect(0,0,256,256);c.fillStyle='#ecdfbd';c.beginPath();c.roundRect(52,30,152,175,23);c.fill();
  c.fillStyle='#284c60';c.fillRect(70,67,116,68);c.fillRect(94,44,68,12);
  for(const x of [83,173]){c.beginPath();c.arc(x,168,12,0,Math.PI*2);c.fill();c.fillRect(x-12,198,24,27);}
  const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;this.textures.push(tx);const mat=new T.MeshBasicMaterial({map:tx,side:T.DoubleSide});this.materials.push(mat);
  this.box(g,[.83,.83,.07],[-1.1,2.2,.62],'#b5c2bc');const pictogram=this.add(g,new T.PlaneGeometry(.75,.75),mat,[-1.1,2.2,.661],false);pictogram.name='bus-stop-pictogram';pictogram.layers.set(NOINK);
  this.box(g,[2.2,.12,1.15],[.35,0,-.13],'#78888b').name='bus-stop-platform';
  for(const x of [-.65,1.35])this.cylinder(g,.035,.035,2.1,[x,1.1,-.62],'#344d59');
  const glass=new T.MeshStandardMaterial({color:'#8caab6',transparent:true,opacity:.18,roughness:.2,side:T.DoubleSide,depthWrite:false});this.materials.push(glass);for(const x of [-.65,1.35]){this.add(g,new T.BoxGeometry(.025,1.85,1.04),glass,[x,1.17,-.13],false);}this.add(g,new T.BoxGeometry(2.0,1.85,.025),glass,[.35,1.17,-.65],false);
  this.box(g,[2.25,.12,1.15],[.35,2.2,-.13],'#5b6d73');
  this.box(g,[1.45,.10,.44],[.40,.48,-.35],'#997c56');for(const x of [-.1,.9])this.box(g,[.08,.45,.27],[x,.225,-.35],'#344b50');this.props.set('bus-stop',g);
 }
 private makeBus(){
  // Front faces -X, matching its departure. Wheels meet the road; both sides have windows.
  const g=this.bus;g.name='last-bus';this.root.add(g);
  this.box(g,[3.9,1.30,1.38],[0,1.02,0],'#b38a53');this.box(g,[3.86,.20,1.37],[0,1.77,0],'#d6c099');
  this.box(g,[3.86,.14,1.41],[0,.65,0],'#6c7d7b');
  for(const z of [-.704,.704]){
   for(const x of [-1.37,-.70,-.03,.64,1.31])this.box(g,[.53,.61,.025],[x,1.29,z],'#516d7c',false);
   for(const x of [-1.68,-1.03,-.36,.31,.98,1.65])this.box(g,[.055,.72,.035],[x,1.29,z],'#d2bb91');
  }
  // Broad driver windshield, destination panel, passenger folding door, mirrors and bumpers.
  this.box(g,[.035,.64,1.12],[-1.97,1.30,0],'#567687',false);
  this.box(g,[.07,.045,1.21],[-1.995,.94,0],'#33434a');
  for(const z of [-.35,0,.35])this.box(g,[.04,.50,.025],[-2.0,1.30,z],'#cab78f');
  this.label(g,'NIGHT 11',.94,.19,[-1.99,1.72,0],'#233943','#e6d6ae',84).rotation.y=-Math.PI/2;
  for(const x of [-1.48,-1.19])this.box(g,[.24,.96,.035],[x,.99,-.733],'#405b68',false);
  this.box(g,[.04,1.02,.055],[-1.335,.99,-.76],'#c5b085');
  for(const x of [-1.22,1.22])for(const z of [-.64,.64]){const wheel=this.cylinder(g,.30,.30,.18,[x,.30,z],'#25313a');wheel.rotation.x=Math.PI/2;const hub=this.cylinder(g,.13,.13,.19,[x,.30,z*1.04],'#a2a9a4');hub.rotation.x=Math.PI/2;}
  for(const x of [-2.0,2.0])this.box(g,[.14,.17,1.43],[x,.46,0],'#455762');
  for(const z of [-.48,.48]){this.box(g,[.06,.18,.23],[-2.08,.72,z],'#f2dfaa',false);this.box(g,[.05,.21,.16],[2.08,.74,z],'#a15b45',false);this.box(g,[.15,.20,.10],[-1.83,1.39,z<0?-.87:.87],'#344a55');}
  this.props.set('bus',g);
 }
 private parkedCars(){
  for(const [i,x] of [-6,6].entries()){
   const g=new T.Group();g.name='parked-car-'+(i+1);g.position.set(x,.03,10.8);this.root.add(g);this.props.set(g.name,g);
   const color=i?'#607c7c':'#946b58';
   this.box(g,[2.4,.46,1.16],[0,.47,0],color);this.box(g,[1.35,.44,1.03],[.10,.91,0],color);
   for(const z of [-.527,.527]){this.box(g,[1.12,.28,.025],[.1,.96,z],'#435d70',false);this.box(g,[.055,.34,.04],[.1,.96,z],'#b19d7f');}
   for(const x of [-.60,.80])this.box(g,[.03,.27,.89],[x,.96,0],'#526d7c',false);
   for(const wheelX of [-.77,.77])for(const z of [-.53,.53]){const wheel=this.cylinder(g,.22,.22,.14,[wheelX,.22,z],'#28333c');wheel.rotation.x=Math.PI/2;}
   for(const end of [-1.23,1.23]){this.box(g,[.10,.13,1.13],[end,.39,0],'#74858a');for(const z of [-.39,.39])this.box(g,[.03,.12,.22],[end,.57,z],end<0?'#d4c5a0':'#95594b',false);}
  }
 }
 private livingDetails(){
  // Deterministic star field above the existing skyline, without flashing/noise animation.
  const starGeo=new T.BufferGeometry(),positions:number[]=[];
  for(let i=0;i<620;i++){const h=(n:number)=>{const v=Math.sin(n*127.1+17.7)*43758.5453;return v-Math.floor(v);};const angle=h(i)*Math.PI*2,elevation=.08+h(i+230)*1.35,radius=150;positions.push(Math.cos(angle)*Math.cos(elevation)*radius,Math.sin(elevation)*radius,Math.sin(angle)*Math.cos(elevation)*radius);}
  starGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));const starMat=new T.PointsMaterial({color:'#d8d9c5',size:.28,sizeAttenuation:true,transparent:true,opacity:.76,depthWrite:false,fog:false});this.materials.push(starMat);
  const stars=new T.Points(starGeo,starMat);stars.name='night-stars';stars.layers.set(NOINK);this.root.add(stars);
  const sun=this.add(this.root,new T.SphereGeometry(9,32,24),new T.MeshBasicMaterial({color:'#efbc87',fog:false}),[-30,42,-100],false);sun.name='opening-setting-sun';this.props.set('sun',sun);sun.layers.set(NOINK);this.materials.push(sun.material);
  const duskLight=new T.DirectionalLight('#efbc91',0);duskLight.position.set(-18,14,-40);duskLight.name='opening-dusk-light';this.root.add(duskLight);
  // Bed and bowls already exist when Latte gets home; nothing pops into place on the line.
  const bed=new T.Group();bed.name='latte-cat-bed';bed.position.set(2.75,.2,15.45);this.root.add(bed);this.props.set('cat-bed',bed);
  this.cylinder(bed,.53,.58,.13,[0,.065,0],'#8f8171');this.cylinder(bed,.46,.46,.07,[0,.15,0],'#a9a08a');
  for(const [i,x] of [2.42,2.97].entries()){const b=new T.Group();b.name=i?'home-food':'home-water';b.position.set(x,.2,14.15);this.root.add(b);this.cylinder(b,.18,.14,.10,[0,.05,0],'#b0b9a3');this.cylinder(b,.15,.15,.008,[0,.10,0],i?'#806343':'#6c94a4');if(i)for(let n=0;n<9;n++)this.add(b,new T.SphereGeometry(.025,6,4),this.mat('#94754d'),[Math.cos(n*2.4)*.09,.12,Math.sin(n*2.4)*.09],false);}
  for(const [i,z] of [.8,2.25].entries()){const picture=this.label(this.root,i?'NIGHT GARDEN':'THE HARBOR',.92,.68,[-3.975,2.25,z],'#566f73','#dfcbaa',35);picture.rotation.y=Math.PI/2;picture.name='cafe-framed-painting-'+i;this.box(this.root,[.06,.78,1.02],[-4.02,2.25,z],'#99784f',false);const cv=(picture.material as T.MeshBasicMaterial).map!.image as HTMLCanvasElement,g=cv.getContext('2d')!;g.fillStyle=i?'#657d70':'#648394';g.fillRect(20,20,cv.width-40,cv.height-40);g.fillStyle='#e8d4a0';g.beginPath();g.arc(560,110,45,0,Math.PI*2);g.fill();for(const [color,y] of [['#3c5c61',260],['#29454c',380]] as [string,number][]){g.fillStyle=color;g.beginPath();g.moveTo(20,cv.height-20);g.lineTo(20,y);for(let x=20;x<cv.width-20;x+=40)g.lineTo(x,y+Math.sin(x*.018+i)*42);g.lineTo(cv.width-20,cv.height-20);g.fill();}(picture.material as T.MeshBasicMaterial).map!.needsUpdate=true;}
  const mouse=new T.Group();mouse.name='chased-mouse';this.root.add(mouse);this.props.set('mouse',mouse);
  const body=this.add(mouse,new T.SphereGeometry(1,12,8),this.mat('#8e928b'),[0,.065,0],false);body.scale.set(.15,.065,.075);const nose=this.add(mouse,new T.SphereGeometry(.065,12,8),this.mat('#a4a399'),[.11,.07,0],false);for(const z of [-.043,.043]){this.add(mouse,new T.SphereGeometry(.035,10,8),this.mat('#bba4a0'),[.08,.13,z],false);this.add(mouse,new T.SphereGeometry(.011,8,6),this.mat('#202a30'),[.15,.092,z],false);}const tail=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.12,.04,0),new T.Vector3(-.23,.025,.03),new T.Vector3(-.33,.02,-.03)]),12,.009,6,false),this.mat('#a39186'));mouse.add(tail);
  const hole=this.add(this.root,new T.CircleGeometry(.11,20),new T.MeshBasicMaterial({color:'#243138',side:T.DoubleSide}),[6.525,.11,1.0],false);hole.rotation.y=-Math.PI/2;hole.name='mouse-service-hole';this.materials.push(hole.material);
  const shadowMat=new T.MeshBasicMaterial({color:'#14212b',transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false});this.materials.push(shadowMat);const unknown=this.add(this.root,new T.CircleGeometry(.22,32),shadowMat,[6.525,.30,-1.7],false);unknown.name='unidentified-alley-shadow';unknown.rotation.y=-Math.PI/2;this.props.set('alley-motion',unknown);
  const homeTrim=new T.Group();homeTrim.name='home-interior-finish';this.root.add(homeTrim);
  this.box(homeTrim,[4.4,.10,.055],[2.25,.27,16.075],'#b19c7e',false);
  for(const x of [-.015,4.515])this.box(homeTrim,[.055,.10,3.7],[x,.27,14.2],'#b19c7e',false);
  const rug=this.box(homeTrim,[1.3,.012,1.65],[1.1,.206,13.8],'#647c7a',false);rug.name='home-woven-rug';
  for(const x of [.52,1.68])this.box(homeTrim,[.035,.002,1.5],[x,.213,13.8],'#a8ac96',false);
  const cushion=this.box(homeTrim,[.38,.13,.32],[2.75,.445,15.45],'#ad876b',false);cushion.rotation.y=.2;
  this.box(homeTrim,[.58,.055,.3],[4.34,1.65,15.3],'#997653');
  this.cylinder(homeTrim,.10,.08,.17,[4.34,1.76,15.3],'#9f9c7c');
  this.add(homeTrim,new T.IcosahedronGeometry(.16,1),this.mat('#688277'),[4.34,1.96,15.3],false);
  for(const x of [-.04,1.74])for(let i=0;i<4;i++)this.cylinder(homeTrim,.026,.026,1.9,[x+(i-1.5)*.042,1.73,12.39],'#8e7f70');const rod=this.cylinder(homeTrim,.025,.025,2.2,[.85,2.75,12.41],'#a8906c');rod.rotation.z=Math.PI/2;
  for(const x of [-.035,4.535])this.box(homeTrim,[.028,.65,3.6],[x,.525,14.25],'#4f6669',false);this.box(homeTrim,[4.4,.65,.025],[2.25,.525,16.075],'#4f6669',false);
  this.cylinder(homeTrim,.10,.10,.035,[1.55,.225,15.8],'#7e796c');this.cylinder(homeTrim,.018,.018,1.25,[1.55,.85,15.8],'#a6997b');this.cylinder(homeTrim,.18,.23,.26,[1.55,1.55,15.8],'#b6a58b');
  const shelf=new T.Group();shelf.name='home-low-bookcase';shelf.position.set(.75,.2,15.85);this.root.add(shelf);
  for(const y of [.05,.45,.9])this.box(shelf,[1.2,.07,.35],[0,y,0],'#997653');for(const x of [-.56,.56])this.box(shelf,[.07,.95,.35],[x,.475,0],'#785b43');for(let i=0;i<8;i++)this.box(shelf,[.09,.25+(i%3)*.04,.23],[-.42+i*.12,.23,0],['#778c86','#a57f64','#b4a480'][i%3],false);
  const mat=this.box(this.root,[1.3,.018,.65],[3.15,.209,12.75],'#a48765',false);mat.name='home-entry-mat';
  const alleyShelf=new T.Group();alleyShelf.name='alley-storage';alleyShelf.position.set(6.0,0,-.7);this.root.add(alleyShelf);
  for(const [i,z] of [-.8,.1,.9].entries()){this.box(alleyShelf,[.68,.55,.6],[i%2*.3,.275,z],'#7c715e');for(const y of [.12,.4])this.box(alleyShelf,[.7,.055,.63],[i%2*.3,y,z],'#a28b67',false);}
  this.cylinder(alleyShelf,.035,.035,2.4,[-1.8,1.2,-3.2],'#52676b');for(const y of [.35,1.3,2.2])this.box(alleyShelf,[.12,.05,.10],[-1.84,y,-3.2],'#7b8884',false);
  const box=new T.Group();box.name='latte-hiding-box';box.position.set(.55,.2,15.05);this.root.add(box);this.props.set('hiding-box',box);
  for(const x of [-.40,.40])this.box(box,[.055,.60,.78],[x,.30,0],'#9b805f');this.box(box,[.85,.055,.78],[0,.027,0],'#a58b68');this.box(box,[.85,.60,.055],[0,.30,.39],'#9b805f');
  this.box(box,[.85,.055,.45],[0,.59,.2],'#ae9571').rotation.x=.18;
  const brickCanvas=document.createElement('canvas');brickCanvas.width=brickCanvas.height=256;const bg=brickCanvas.getContext('2d')!;bg.fillStyle='#75645b';bg.fillRect(0,0,256,256);bg.strokeStyle='#928579';bg.lineWidth=2;for(let row=0;row<8;row++){bg.beginPath();bg.moveTo(0,row*32);bg.lineTo(256,row*32);bg.stroke();for(let x=(row%2)*32;x<256;x+=64){bg.beginPath();bg.moveTo(x,row*32);bg.lineTo(x,row*32+32);bg.stroke();}}const brick=new T.CanvasTexture(brickCanvas);brick.colorSpace=T.SRGBColorSpace;brick.wrapS=brick.wrapT=T.RepeatWrapping;brick.repeat.set(3,3);this.textures.push(brick);const wall=this.box(this.root,[.12,6.8,8.6],[6.6,3.4,-.1],'#a8a097');(wall.material as T.MeshStandardMaterial).map=brick;wall.name='alley-neighbor-brick-wall';this.box(this.root,[2.35,3,.15],[5.4,1.5,-4.2],'#625f5b');
  for(const y of [3.1,5.3]){this.box(this.root,[.75,.1,1.45],[6.17,y,-1.1],'#34464d');for(const z of [-1.8,-.4]){this.box(this.root,[.04,.75,.04],[5.8,y+.4,z],'#34464d');this.box(this.root,[.8,.04,.04],[6.17,y+.78,z],'#34464d');this.box(this.root,[.9,.06,.06],[6.15,y-.35,z],'#34464d').rotation.z=.65;}}
  const alleyFinish=new T.Group();alleyFinish.name='alley-service-details';this.root.add(alleyFinish);
  this.box(alleyFinish,[1.9,.10,.16],[5.25,.05,-3.5],'#7d8580',false);
  const drain=this.box(alleyFinish,[.46,.014,.35],[5.4,.038,-2.8],'#344d54',false);
  for(let i=0;i<6;i++)this.box(alleyFinish,[.025,.003,.31],[5.22+i*.07,.047,-2.8],'#7c8b89',false);
  for(const z of [-2.5,-1.4]){this.cylinder(alleyFinish,.18,.15,.27,[6.05,.135,z],'#8c7863');this.add(alleyFinish,new T.IcosahedronGeometry(.23,1),this.mat('#546d64'),[6.05,.48,z],false);}
  const bin=new T.Group();bin.name='alley-dumpster';bin.position.set(5.45,0,-1.7);this.root.add(bin);this.props.set('alley-dumpster',bin);
  this.box(bin,[1.05,.05,.85],[0,.005,0],'#3d5858');for(const x of [-.50,.50])this.box(bin,[.05,.48,.85],[x,.27,0],'#476664');for(const z of [-.4,.4])this.box(bin,[1.05,.48,.05],[0,.27,z],'#476664');const lid=this.box(bin,[1.12,.06,.9],[0,.957,-.288],'#2b4246');lid.rotation.x=-1.25;
  this.box(this.root,[2.4,.06,7.04],[5.4,-.002,.7],'#657477',false).name='alley-pavement';
  const tower=new T.Group();tower.name='home-cat-tower';tower.position.set(4.05,.2,15.6);this.root.add(tower);this.cylinder(tower,.09,.09,1.65,[0,.825,0],'#a5977c');for(const y of [.08,.85,1.65])this.box(tower,[.72,.10,.65],[0,y,0],'#8e8978');
  for(const [i,z] of [13.65,14.75].entries()){
   this.box(this.root,[.055,.68,.88],[-.015,1.95,z],'#ae9469');
   const cv=document.createElement('canvas');cv.width=512;cv.height=384;const art=cv.getContext('2d')!;art.fillStyle=i?'#a79478':'#526f80';art.fillRect(0,0,512,384);art.fillStyle='#dfd2ab';art.beginPath();art.arc(380,90,42,0,Math.PI*2);art.fill();for(const [color,y] of [['#718783',220],['#405b61',300]] as [string,number][]){art.fillStyle=color;art.beginPath();art.moveTo(0,384);art.lineTo(0,y);for(let x=0;x<=512;x+=64)art.lineTo(x,y+Math.sin(x*.019+i)*50);art.lineTo(512,384);art.fill();}
   const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;this.textures.push(tx);const mat=new T.MeshBasicMaterial({map:tx});this.materials.push(mat);const picture=this.add(this.root,new T.PlaneGeometry(.76,.56),mat,[.016,1.95,z],false);picture.rotation.y=Math.PI/2;picture.layers.set(NOINK);
  }

  this.box(this.root,[.09,.24,.19],[-3.95,.7,1.25],'#b8bba0',false).name='cafe-light-switch';
  // Two one-way cars. They exit naturally; none circulate after the curfew.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sc=shadowCanvas.getContext('2d')!,gradient=sc.createRadialGradient(32,32,1,32,32,32);gradient.addColorStop(0,'rgba(12,22,28,.38)');gradient.addColorStop(1,'rgba(12,22,28,0)');sc.fillStyle=gradient;sc.fillRect(0,0,64,64);const shadowTexture=new T.CanvasTexture(shadowCanvas);this.textures.push(shadowTexture);
  for(const i of [0,1]){const car=new T.Group();car.name='passing-car-'+i;this.root.add(car);this.traffic.push(car);
   const sm=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});this.materials.push(sm);const ground=this.add(car,new T.PlaneGeometry(2.6,1.1),sm,[0,.009,0],false);ground.rotation.x=-Math.PI/2;ground.layers.set(NOINK);
   this.box(car,[2.3,.45,1.08],[0,.47,0],i?'#70868b':'#9a7862',false);this.box(car,[1.2,.40,.95],[.12,.89,0],'#4b6575',false);
   for(const x of [-.73,.73])for(const z of [-.51,.51]){const w=this.cylinder(car,.22,.22,.14,[x,.22,z],'#28343b');w.rotation.x=Math.PI/2;}
   for(const z of [-.37,.37]){const lamp=this.box(car,[.04,.12,.20],[1.18,.55,z],'#f0dab0',false);(lamp.material as T.MeshStandardMaterial).emissive.set('#ffe1a0');(lamp.material as T.MeshStandardMaterial).emissiveIntensity=1.4;}const light=new T.PointLight('#ffdfaa',3,6,2);light.position.set(1.5,.36,0);car.add(light);
  }
  for(let i=0;i<6;i++){const car=this.traffic[i%2].clone(true);car.name='district-moving-car-'+i;car.traverse(o=>{if(o instanceof T.PointLight)o.intensity=0;});this.root.add(car);this.backgroundTraffic.push(car);}
  // Mount the existing plaque on a stationary pier instead of intersecting the moving leaf.
  const open=this.door.children.find(o=>o instanceof T.Mesh&&Math.abs(o.position.y-2.3)<.001&&(o.material as T.MeshBasicMaterial).map);
  if(open){const mount=new T.Group();mount.name='open-sign-mount';mount.position.set(3.15,2.5,4.41);this.root.add(mount);mount.add(open);open.name='door-open-plaque';open.position.set(0,0,.005);open.rotation.set(0,0,0);open.layers.set(NOINK);const m=(open as T.Mesh).material as T.Material;m.polygonOffset=false;this.box(mount,[.59,.29,.06],[0,0,-.035],'#b59a70',false);}

 }
 private cityBlocks(){
  const relocated:Record<string,V3>={'town-building-2':[-12,0,1],'town-building-3':[-12,0,15],'town-building-5':[8.65,0,0],'town-building-4':[9.8,0,-7],'town-building-9':[-7,0,14.5],'town-building-11':[7,0,14.5]};
  for(const [id,p] of Object.entries(relocated))this.cafe.root.getObjectByName(id)!.position.set(...p);
  (this.cafe.root.getObjectByName('town-building-5') as T.Group).scale.z=2.25;
  for(const id of ['town-building-9','town-building-10','town-building-11']){const g=this.cafe.root.getObjectByName(id) as T.Group;g.rotation.y=Math.PI;this.box(g,[.85,1.8,.06],[0,1.0,2.045],'#344b52',false);this.box(g,[1.35,.10,.65],[0,.05,2.3],'#728482',false);}
  this.box(this.root,[2,.06,8],[-3.3,0,16],'#6c7c7c',false).name='alternate-pedestrian-lane';
  for(let i=1;i<=11;i++){const b=this.cafe.root.getObjectByName('town-building-'+i)!;this.box(b,[4.3,.22,4.3],[0,-.1,0],'#52636a',false);}
  const city=createCity();this.root.add(city.root);this.materials.push(...city.materials);this.textures.push(...city.textures);this.blockers.push(...city.blockers);
  this.townWindows.push({mat:city.windowMaterial,color:city.windowMaterial.color.clone(),emissive:.32});
  const road=this.root.getObjectByName('episode-road') as T.Mesh;road.removeFromParent();road.geometry.dispose();for(const id of ['entrance-apron-left','entrance-apron-right'])this.root.getObjectByName(id)?.removeFromParent();
  for(const z of [4.52,12.6])this.box(this.root,[120,.10,.60],[0,-.015,z],'#6c7c7c',false);
 }
 private sign(){
  const g=new T.Group();g.name='welcome-sign';g.position.set(...SIGN);g.rotation.y=Math.PI;this.root.add(g);
  this.box(g,[.055,.25,.055],[0,-.275,-.015],'#b6925a',false);this.box(g,[.40,.035,.28],[0,-.3825,0],'#b6925a',false);this.box(g,[.92,.60,.05],[0,0,0],'#b6925a',false);this.label(g,"If you're scared\nof the dark,\ncome inside.",.85,.53,[0,0,.060],'#efdbb6','#34453f',51);this.props.set('sign',g);
 }
 private lantern(){
  const g=new T.Group();g.name='backup-lantern';g.position.set(...LANTERN);this.root.add(g);this.cylinder(g,.15,.17,.07,[0,.035,0],'#514d40');
  const bulb=this.mat('#f4d092');bulb.emissive.set('#ffba66');bulb.emissiveIntensity=1.5;this.add(g,new T.CylinderGeometry(.11,.12,.29,12),bulb,[0,.21,0],false);this.cylinder(g,.17,.11,.08,[0,.395,0],'#514d40');
  for(const x of [-.13,.13])this.box(g,[.025,.34,.03],[x,.22,0],'#594f3d',false);
  const light=new T.PointLight('#ffce91',8,8,2);light.position.set(0,.30,0);g.add(light);this.props.set('lantern',g);return light;
 }
 private cloth(name:string,color:string,w:number,h:number){
  const geo=new T.PlaneGeometry(w,h,20,16),mat=this.mat(color);mat.side=T.DoubleSide;const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d')!;g.fillStyle=color;g.fillRect(0,0,128,128);for(let i=0;i<4;i++){g.fillStyle='rgba(230,221,185,.14)';g.fillRect(i*32,0,9,128);g.fillRect(0,i*32,128,9);g.fillStyle='rgba(45,55,48,.12)';g.fillRect(i*32+13,0,2,128);g.fillRect(0,i*32+13,128,2);}const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(2,1.4);this.textures.push(tx);mat.map=tx;mat.color.set('#ffffff');const mesh=new T.Mesh(geo,mat);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;return mesh;
 }
 private makeBowl(){
  this.bowl.name='fresh-water-bowl';this.cylinder(this.bowl,.19,.15,.12,[0,.06,0],'#acbda9');
  const water=this.add(this.bowl,new T.CircleGeometry(.16,28),new T.MeshStandardMaterial({color:'#9fbfc5',roughness:.25,metalness:.14}),[0,.115,0],false);water.rotation.x=-Math.PI/2;this.materials.push(water.material);
 }
 update(s:EpisodeState){
  const clouds=this.props.get('clouds');if(clouds){clouds.visible=s.t>=26.5;clouds.position.x=-10.8+3*beat(s.t,26.5,28.5);}
  const openingEnd=s.editShots?.filter(q=>q.number===1).at(-1)?.end??54,dusk=s.shot.number===1?1-beat(s.frame,0,openingEnd*.85):0;const sun=this.root.getObjectByName('opening-setting-sun')!;sun.visible=dusk>0;sun.position.set(-30,30+12*dusk,-100);(sun as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>).material.transparent=true;(sun as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>).material.opacity=dusk;(this.root.getObjectByName('opening-dusk-light') as T.DirectionalLight).intensity=.85*dusk;
  this.root.getObjectByName('switch-toggle')!.rotation.z=-.25*beat(s.t,56.98,57.1);
  const mouse=this.props.get('mouse')!;mouse.position.set(...mouseAt(s.t));mouse.visible=s.t>=26.5&&s.t<31;const ahead=mouseAt(s.t+.03),behind=mouseAt(s.t-.03);mouse.rotation.y=-Math.atan2(ahead[2]-behind[2],ahead[0]-behind[0]);const unknown=this.props.get('alley-motion')!;unknown.visible=s.shot.number===37&&s.shot.variant===1;unknown.position.z=-1.7+1.4*beat(s.u,0,1);unknown.scale.set(1.6,.7+.3*Math.sin(s.u*Math.PI),1);
  this.door.rotation.y=-s.door;this.homeDoor.rotation.y=-s.homeDoor*1.35;
  this.traffic.forEach((car,i)=>{car.position.set(i? -12+s.t*2.1:9-s.t*2.2,.03,i?9.45:7.45);car.rotation.y=i?0:Math.PI;car.visible=s.t<29;});
  this.backgroundTraffic.forEach((car,i)=>{const direction=i%2?1:-1;car.position.set((i<3?18:-18)+direction*1.1,.03,-30+i*11+direction*s.t*2.2);car.rotation.y=direction>0?-Math.PI/2:Math.PI/2;car.visible=s.t<29;});
  const busCallback=s.shot.number===58&&s.shot.variant===2;const busX=busCallback?-2.8-s.u*3.4:s.t<2?-4.5-s.t*2.9:-15;this.bus.position.set(busX,.03,7.7);this.bus.visible=s.t<3||busCallback;
  for(let i=0;i<9;i++){
   const l=this.lights[i],fail=s.failed[i],flicker=i===0&&s.shot.number===1&&s.shot.variant===1?(s.u>.24&&s.u<.40?.28:1):i===0&&s.t>30.5&&s.t<31.8?(.5+.5*Math.sin(s.t*47)):1;
   l.point.visible=!fail;l.point.intensity=fail?0:(i<2?20:8)*flicker;l.bulb.emissiveIntensity=fail?0:.65*flicker;l.bulb.color.set(fail?'#5a6266':'#dfc084');
  }
  const blackout=s.t>=52.4;
  for(const p of this.townWindows){p.mat.emissiveIntensity=blackout?0:p.emissive*(.96+.04*Math.sin(s.t*.43+p.emissive*17));if(blackout)p.mat.color.set('#354958');else p.mat.color.copy(p.color);}
  const homeMoon=this.root.getObjectByName('home-moonlight') as T.PointLight;homeMoon.intensity=3.8;const porchLight=this.root.getObjectByName('home-porch-light') as T.PointLight;porchLight.intensity=s.t<52.4?3:0;((this.props.get('home-porch-lamp') as T.Mesh).material as T.MeshStandardMaterial).emissiveIntensity=s.t<52.4?.65:0;
  const lightingInsert=s.shot.number===59&&s.shot.variant===1,lightingLevel=lightingInsert?beat(s.u,.35,.60):1;
  for(const p of this.permanentLights){
   if(p.light.name.startsWith('streetlight-'))continue;
   if(lightingInsert){p.light.intensity=p.intensity*(.06+.94*lightingLevel);p.light.visible=true;continue;}
   if(p.light.name==='night-sky-fill')p.light.intensity=.62;
   else if(p.light.name==='window-moon')p.light.intensity=1.6;
   else if(p.light.name==='front-window-spill')p.light.intensity=blackout?3.2:4.2;
   else if(p.light.name.includes('practical-light')){p.light.intensity=blackout?0:p.intensity;p.light.visible=!blackout;}
   else if(p.light.name==='interior-bounce')p.light.intensity=blackout?11+2*beat(s.t,131.45,131.65):p.intensity;
   else if(p.light.name==='warm-interior-key')p.light.intensity=blackout?1.05:p.intensity;
  }
  for(const p of this.pendantBulbs)p.mat.emissiveIntensity=lightingInsert?p.emissive*lightingLevel:blackout?0:p.emissive;
  const g=this.clockCanvas.getContext('2d')!;g.clearRect(0,0,768,768);g.fillStyle='#f3e7c6';g.beginPath();g.arc(384,384,376,0,Math.PI*2);g.fill();g.strokeStyle='#293d46';g.fillStyle='#293d46';g.textAlign='center';g.textBaseline='middle';g.font='bold 58px Georgia';
  for(let n=1;n<=12;n++){const a=n*Math.PI/6;g.fillText(String(n),384+Math.sin(a)*298,384-Math.cos(a)*298);g.lineWidth=5;g.beginPath();g.moveTo(384+Math.sin(a)*345,384-Math.cos(a)*345);g.lineTo(384+Math.sin(a)*360,384-Math.cos(a)*360);g.stroke();}
  const minute=s.clock==='11:10'?10:11;g.lineCap='round';for(const [angle,length,width] of [[(11+minute/60)*Math.PI/6,170,23],[minute*Math.PI/30,247,17]]){g.lineWidth=width;g.beginPath();g.moveTo(384,384);g.lineTo(384+Math.sin(angle)*length,384-Math.cos(angle)*length);g.stroke();}g.beginPath();g.arc(384,384,16,0,Math.PI*2);g.fill();this.clockTexture.needsUpdate=true;
  this.lanternLight.intensity=lightingInsert?8*lightingLevel:8;
  this.bowl.position.set(...s.bowl);this.bowl.visible=s.t>=99&&!(s.shot.number===58&&s.shot.variant===0||s.shot.number===59&&s.shot.variant===1);
  const p=this.blanket.geometry.getAttribute('position'),mouth=mouthAnchor(s,'mocha'),toward=new T.Vector3(s.camera[0]-s.mocha.position[0],0,s.camera[2]-s.mocha.position[2]).normalize(),right=new T.Vector3(1,0,0);
  for(let i=0;i<p.count;i++){
   const column=i%21,row=Math.floor(i/21),x=(column/20-.5),u=row/16;
   const v=column/20;
   const tug=.035*Math.sin(s.t*7)*beat(s.t,110,112)*(1-beat(s.t,114.5,115));
   const held:V3=[Math.max(-3.7,Math.min(3.7,mouth[0]+right.x*v*2.3)),.006+(mouth[1]-.006)*(1-u)*(1-.85*Math.sqrt(v))+tug*v*(1-u)+.025*Math.sin(v*19+u*5)**2*v*(1-u),Math.min(4.10,mouth[2]+right.z*v*2.3+u*.42)];
   const spread:V3=[2.22+x*1.9,.004+.012*Math.sin(x*16)**2*Math.sin(u*Math.PI),2.72+u*1.32];
   const point=mix(held,spread,s.blanketLay);p.setXYZ(i,...point);
  }p.needsUpdate=true;this.blanket.geometry.computeVertexNormals();this.blanket.geometry.computeBoundingBox();this.blanket.geometry.computeBoundingSphere();this.blanket.visible=s.t>=85&&!(s.shot.number===58&&s.shot.variant===0||s.shot.number===59&&s.shot.variant===1);
  // A cloth dome over the body, with a lowered front opening for the listening reaction.
  const cover=beat(s.t,78,80.5)*(1-beat(s.t,83.15,84.30));this.homeBlanket.visible=s.t>=54;this.homeBlanket.position.set(.85,.20,13.1);this.homeBlanket.rotation.x=0;
  const hp=this.homeBlanket.geometry.getAttribute('position');for(let i=0;i<hp.count;i++){const x=(i%21)/20-.5,z=Math.floor(i/21)/16-.5;hp.setXYZ(i,x*1.25,.004+cover*(.04+.94*Math.sqrt(Math.max(0,1-(x*2)**2))*(.65+.35*Math.cos(z*Math.PI*1.5))+.026*Math.sin(x*25+z*8)**2*Math.sin((z+.5)*Math.PI)),z*1.45);}hp.needsUpdate=true;this.homeBlanket.geometry.computeVertexNormals();this.homeBlanket.geometry.computeBoundingBox();this.homeBlanket.geometry.computeBoundingSphere();
  this.rain.visible=s.rain>.01;const ra=this.rain.geometry.getAttribute('position');for(let i=0;i<240;i++){
   const hash=(n:number)=>{const a=Math.sin(n*75.31+16.7)*43758.5453;return a-Math.floor(a);};
   const x=-8+hash(i)*16,z=4.8+hash(i+110)*7.1,y=((hash(i+300)*7-s.frame/30*4)%7+7)%7;
   ra.setXYZ(i*2,x,y,z);ra.setXYZ(i*2+1,x+.035,y+.30,z+.03);
  }ra.needsUpdate=true;this.rain.geometry.computeBoundingSphere();
 }
 dispose(){this.cafe.dispose();this.root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments||o instanceof T.Points)o.geometry.dispose();if(o instanceof T.Light)o.dispose();});this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());}
}
