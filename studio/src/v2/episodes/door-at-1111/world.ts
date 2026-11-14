import * as T from 'three';
import {batchCafe} from './batch';
import {CafeEnvironment} from '../../cafe/environment';
import {NOINK} from '../../../videos/bridge/ink';
import {V3} from '../../cafe/config';
import {EpisodeState,HOME,CLOCK,SIGN,LANTERN,STREETLIGHTS,clamp,beat,lerp,mix} from './timeline';

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
 readonly shadowScreen:T.Mesh;readonly rainPositions:Float32Array;
 constructor(optimize=true){
  this.root.name='door-at-1111-extensions';this.root.add(this.cafe.root);this.door=this.rigDoor();
  this.home();this.street();this.busStop();this.makeBus();
  this.clockCanvas.width=this.clockCanvas.height=512;this.clockTexture=new T.CanvasTexture(this.clockCanvas);this.clockTexture.colorSpace=T.SRGBColorSpace;this.textures.push(this.clockTexture);
  const clockGroup=new T.Group();clockGroup.name='episode-clock';clockGroup.position.set(...CLOCK);this.root.add(clockGroup);this.props.set('clock',clockGroup);
  this.cylinder(clockGroup,.34,.34,.085,[0,0,-.04],'#ac8c55').rotation.x=Math.PI/2;
  const clock=new T.Mesh(new T.PlaneGeometry(.61,.61),new T.MeshBasicMaterial({map:this.clockTexture}));clock.position.z=.02;clock.layers.set(NOINK);clockGroup.add(clock);this.materials.push(clock.material);
  const fog=this.box(this.root,[4.40,2.78,.008],[-1.45,2.22,4.247],'#dac6a0',false);fog.name='rain-fogged-cafe-window';fog.material=new T.MeshStandardMaterial({color:'#cbbd9b',roughness:1,transparent:true,opacity:.985,emissive:'#7b552c',emissiveIntensity:.16,side:T.DoubleSide});this.materials.push(fog.material);fog.receiveShadow=true;fog.layers.set(NOINK);this.props.set('shadow',fog);
  const screen=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true,opacity:0}));screen.visible=false;this.root.add(screen);this.shadowScreen=screen;
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
  const pane=leaf.find(o=>o.name.endsWith('/glass')) as T.Mesh|undefined;if(pane){const mat=new T.MeshStandardMaterial({color:'#d5c5a4',roughness:1,side:T.DoubleSide,transparent:true,opacity:.985,emissive:'#7b552c',emissiveIntensity:.10});this.materials.push(mat);pane.material=mat;}
  this.props.set('door',pivot);return pivot;
 }
 pushPoint(){this.root.updateMatrixWorld(true);return new T.Vector3(.90,.52,-.07).applyMatrix4(this.door.matrixWorld);}
 handle(){this.root.updateMatrixWorld(true);return new T.Vector3(1.205,1.27,.10).applyMatrix4(this.door.matrixWorld);}
 tapPoint(){this.root.updateMatrixWorld(true);return new T.Vector3(1.39,.50,0).applyMatrix4(this.door.matrixWorld);}
 private home(){
  const g=new T.Group();g.name='latte-home';this.root.add(g);const color='#495665';
  this.box(g,[4.6,.2,3.8],[2.25,.1,14.2],'#81725e');
  this.box(g,[.16,3.4,3.8],[-.13,1.9,14.2],color);this.box(g,[.16,3.4,3.8],[4.63,1.9,14.2],color);this.box(g,[4.6,3.4,.16],[2.25,1.9,16.18],color);this.box(g,[4.9,.20,4.1],[2.25,3.7,14.2],'#324655');
  this.box(g,[2.1,.50,.15],[.85,.45,12.3],color);this.box(g,[4.6,.7,.15],[2.25,3.24,12.3],color);
  for(const [x,w] of [[-.05,.15],[2.05,.45],[4.10,.90]])this.box(g,[w,2.45,.15],[x,1.85,12.3],color);
  this.box(g,[.55,.75,.15],[2.40,.95,12.3],color);
  const window=new T.Group();window.name='home-window';window.position.set(.85,0,12.2);g.add(window);
  for(const x of [-1.0,1.0])this.box(window,[.08,1.95,.10],[x,1.65,0],'#b5a785');
  for(const y of [.675,2.625])this.box(window,[2.08,.08,.10],[0,y,0],'#b5a785');
  const glass=new T.Mesh(new T.PlaneGeometry(1.95,1.9),new T.MeshBasicMaterial({color:'#7f9ca9',transparent:true,opacity:.035,side:T.DoubleSide,depthWrite:false}));glass.position.set(0,1.65,0);glass.layers.set(NOINK);window.add(glass);this.materials.push(glass.material);
  this.homeDoor.name='home-door-hinge';this.homeDoor.position.set(2.65,.2,12.23);g.add(this.homeDoor);
  this.box(this.homeDoor,[1.05,2.55,.10],[.525,1.275,0],'#7a7163');this.cylinder(this.homeDoor,.035,.035,.08,[.87,1.08,-.08],'#c1a477').rotation.x=Math.PI/2;
  const porch=this.box(g,[1.8,.18,.9],[3.15,.09,11.86],'#928b7b');porch.name='home-porch';this.props.set('home-door',this.homeDoor);
  this.label(g,'LATTE',.68,.18,[3.15,2.99,12.19],'#3d4d58','#e6d2a8',84).rotation.y=Math.PI;
  const sw=this.box(g,[.10,.24,.10],HOME.switch,'#d8d2bc',false);sw.name='home-light-switch';this.props.set('switch',sw);
  const toggle=this.box(g,[.03,.09,.08],[HOME.switch[0]-.065,HOME.switch[1]+.015,HOME.switch[2]],'#f1e5ca',false);toggle.name='switch-toggle';
  const homeFill=new T.PointLight('#9fbad0',3.8,6,2);homeFill.name='home-moonlight';homeFill.position.set(.85,2.25,14.15);g.add(homeFill);
 }
 private street(){
  const pavement=this.box(this.root,[15,.06,7.4],[0,0,8.55],'#394b59',false);pavement.name='episode-road';this.box(this.root,[8.9,.06,.6],[-3.05,0,4.55],'#667776',false).name='entrance-apron-left';this.box(this.root,[4.4,.06,.6],[5.3,0,4.55],'#667776',false).name='entrance-apron-right';
  for(let x=-7;x<7;x+=1.4)this.box(this.root,[.7,.008,.07],[x,.034,9.0],'#7b7a6b',false);
  const puddle=this.add(this.root,new T.CircleGeometry(.72,32),new T.MeshStandardMaterial({color:'#718794',roughness:.25,metalness:.32,transparent:true,opacity:.48}),[-.70,.034,9.0],false);puddle.rotation.x=-Math.PI/2;this.materials.push(puddle.material);
  // Reuse the two approved street lamps at +/-6. Add seven fixed lamps: nine total.
  const town=this.cafe.root.getObjectByName('night-town')!;
  for(let i=0;i<2;i++){
   const p=STREETLIGHTS[i];const point=town.children.find(o=>o instanceof T.PointLight&&Math.abs(o.position.x-p[0])<.01&&Math.abs(o.position.z-p[2])<.01) as T.PointLight;
   const bulb=town.children.find(o=>o instanceof T.Mesh&&Math.abs(o.position.x-p[0])<.01&&Math.abs(o.position.y-3.08)<.01) as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
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
  const g=new T.Group();g.name='bus-stop';g.position.set(-4.4,0,7.3);this.root.add(g);this.cylinder(g,.04,.04,2.45,[0,1.225,0],'#334651');
  this.label(g,'BUS\nLAST 11:11',.72,.58,[0,2.2,.06],'#324e58','#e8d4ab',76);
  this.box(g,[1.45,.10,.44],[.40,.48,-.35],'#997c56');for(const x of [-.1,.9])this.box(g,[.08,.45,.27],[x,.225,-.35],'#344b50');this.props.set('bus-stop',g);
 }
 private makeBus(){
  this.bus.name='last-bus';this.root.add(this.bus);this.box(this.bus,[2.8,1.20,1.30],[0,.91,0],'#ba8d55');this.box(this.bus,[2.78,.22,1.28],[0,1.62,0],'#d4ba87');
  for(const x of [-.82,-.22,.38,.98])this.box(this.bus,[.48,.50,.025],[x,1.18,.663],'#6b8998',false);
  for(const x of [-.94,.94])for(const z of [-.55,.55]){const wheel=this.cylinder(this.bus,.29,.29,.19,[x,.29,z],'#263340');wheel.rotation.x=Math.PI/2;}
  this.label(this.bus,'LAST BUS',1.1,.22,[0,1.62,.66],'#344c51','#eedab0',96);this.props.set('bus',this.bus);
 }
 private sign(){
  const g=new T.Group();g.name='welcome-sign';g.position.set(...SIGN);g.rotation.y=Math.PI;this.root.add(g);
  this.box(g,[.055,.25,.055],[0,-.275,-.015],'#b6925a',false);this.box(g,[.40,.035,.28],[0,-.3825,0],'#b6925a',false);this.box(g,[.92,.60,.05],[0,0,0],'#b6925a',false);this.label(g,"If you're scared\nof the dark,\ncome inside.",.85,.53,[0,0,.032],'#efdbb6','#34453f',51);this.props.set('sign',g);
 }
 private lantern(){
  const g=new T.Group();g.name='backup-lantern';g.position.set(...LANTERN);this.root.add(g);this.cylinder(g,.15,.17,.07,[0,.035,0],'#514d40');
  const bulb=this.mat('#f4d092');bulb.emissive.set('#ffba66');bulb.emissiveIntensity=1.5;this.add(g,new T.CylinderGeometry(.11,.12,.29,12),bulb,[0,.21,0],false);this.cylinder(g,.17,.11,.08,[0,.395,0],'#514d40');
  for(const x of [-.13,.13])this.box(g,[.025,.34,.03],[x,.22,0],'#594f3d',false);
  const light=new T.PointLight('#ffce91',32,8,2);light.position.set(0,.30,0);g.add(light);this.props.set('lantern',g);return light;
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
  this.door.rotation.y=-s.door;this.homeDoor.rotation.y=-s.homeDoor*1.35;
  const busX=s.t<2?-4.5-s.t*2.9:-15;this.bus.position.set(busX,.03,8.3);this.bus.visible=s.t<3||s.shot.number===58&&s.shot.variant===0;
  for(let i=0;i<9;i++){
   const l=this.lights[i],fail=s.failed[i],flicker=i===0&&s.t>30.5&&s.t<31.8?(.5+.5*Math.sin(s.t*47)):1;
   l.point.visible=!fail;l.point.intensity=fail?0:(i<2?20:8)*flicker;l.bulb.emissiveIntensity=fail?0:1.1*flicker;l.bulb.color.set(fail?'#5a6266':'#dfc084');
  }
  const blackout=s.t>=54;
  for(const p of this.townWindows){p.mat.emissiveIntensity=blackout?0:p.emissive;if(blackout)p.mat.color.set('#354958');else p.mat.color.copy(p.color);}
  const homeMoon=this.root.getObjectByName('home-moonlight') as T.PointLight;homeMoon.intensity=3.8+10*Math.max(0,1-Math.abs(s.t-59.7)/.065);
  for(const p of this.permanentLights){
   if(p.light.name.startsWith('streetlight-'))continue;
   if(p.light.name.includes('practical-light')){p.light.intensity=blackout?0:p.intensity;p.light.visible=!blackout;}
   else if(p.light.name==='interior-bounce')p.light.intensity=blackout?11:p.intensity;
   else if(p.light.name==='warm-interior-key')p.light.intensity=blackout?1.05:p.intensity;
  }
  for(const p of this.pendantBulbs)p.mat.emissiveIntensity=blackout?0:p.emissive;
  const g=this.clockCanvas.getContext('2d')!;g.clearRect(0,0,512,512);g.fillStyle='#eed9b1';g.beginPath();g.arc(256,256,248,0,Math.PI*2);g.fill();g.strokeStyle='#34473e';g.lineWidth=10;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;g.beginPath();g.moveTo(256+Math.sin(a)*202,256-Math.cos(a)*202);g.lineTo(256+Math.sin(a)*225,256-Math.cos(a)*225);g.stroke();}
  const minute=s.clock==='11:10'?10.7:s.clock==='11:11'?11:12;for(const [a,r,w] of [[(11+minute/60)*Math.PI/6,115,17],[minute*Math.PI/30,174,11]]){g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(256,256);g.lineTo(256+Math.sin(a)*r,256-Math.cos(a)*r);g.stroke();}
  g.fillStyle='#2d453d';g.fillRect(132,340,248,89);g.font='bold 64px monospace';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f5dfa8';g.fillText(s.clock,256,387);this.clockTexture.needsUpdate=true;
  this.bowl.position.set(...s.bowl);this.bowl.visible=s.t>=99;
  const p=this.blanket.geometry.getAttribute('position');
  for(let i=0;i<p.count;i++){
   const column=i%21,row=Math.floor(i/21),x=(column/20-.5),u=row/16;
   const held:V3=[s.mocha.position[0]+x*2.5,s.mocha.position[1]+(.58+Math.sin(s.t*5)*.055*beat(s.t,111.5,112)*(1-beat(s.t,114.2,114.5)))*(1-u)+.004*u+.055*Math.sin(x*15+s.t*3)*(1-u)*u,Math.min(3.85,s.mocha.position[2]+.16)+u*Math.min(.50,4.08-Math.min(3.85,s.mocha.position[2]+.16))];
   const spread:V3=[2.22+x*1.9,.004+.012*Math.sin(x*16)**2*Math.sin(u*Math.PI),2.72+u*1.32];
   const v=mix(held,spread,s.blanketLay);p.setXYZ(i,...v);
  }p.needsUpdate=true;this.blanket.geometry.computeVertexNormals();this.blanket.geometry.computeBoundingBox();this.blanket.geometry.computeBoundingSphere();this.blanket.visible=s.t>=18;
  // A cloth dome over the body, with a lowered front opening for the listening reaction.
  const cover=beat(s.t,78,80.5)*(1-beat(s.t,83.15,84.30));this.homeBlanket.visible=s.t>=78;this.homeBlanket.position.set(.85,.20,13.1);this.homeBlanket.rotation.x=0;
  const hp=this.homeBlanket.geometry.getAttribute('position');for(let i=0;i<hp.count;i++){const x=(i%21)/20-.5,z=Math.floor(i/21)/16-.5;hp.setXYZ(i,x*1.25,.004+cover*(.08+.97*Math.cos(x*Math.PI)*(.65+.35*Math.cos(z*Math.PI*1.5))),z*1.45);}hp.needsUpdate=true;this.homeBlanket.geometry.computeVertexNormals();this.homeBlanket.geometry.computeBoundingBox();this.homeBlanket.geometry.computeBoundingSphere();
  this.rain.visible=s.rain>.01;const ra=this.rain.geometry.getAttribute('position');for(let i=0;i<240;i++){
   const hash=(n:number)=>{const a=Math.sin(n*75.31+16.7)*43758.5453;return a-Math.floor(a);};
   const x=-8+hash(i)*16,z=4.8+hash(i+110)*7.1,y=((hash(i+300)*7-s.frame/30*4)%7+7)%7;
   ra.setXYZ(i*2,x,y,z);ra.setXYZ(i*2+1,x+.035,y+.30,z+.03);
  }ra.needsUpdate=true;this.rain.geometry.computeBoundingSphere();
 }
 dispose(){this.cafe.dispose();this.root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments)o.geometry.dispose();if(o instanceof T.Light)o.dispose();});this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());}
}
