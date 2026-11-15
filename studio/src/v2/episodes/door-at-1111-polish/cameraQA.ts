import * as T from 'three';
import {mouthAnchor} from './contacts';
import {shelterState,streetCatPosition} from './shelter';
import {NOINK} from '../../../videos/bridge/ink';
import type {EpisodeWorld} from './world';
import {EpisodeState,CLOCK,SIGN,HOME} from './timeline';
import type {V3} from '../../cafe/config';
/** Same actual world geometry audit used during rendering and the fast all-frame preflight.
 * Passing characters enables alpha-tested card occlusion checks; geometry preflight omits them.
 */
export function checkEpisodeCamera(w:EpisodeWorld,s:EpisodeState,cam:T.PerspectiveCamera,characters:{id:string;mesh:T.Mesh}[]=[]){
 const lp=s.latte.position,mp=s.mocha.position,ep=s.essie.position,kid=s.kitten;
 const h=w.handle(),tap=w.tapPoint(),pushPoint=w.pushPoint();
 w.root.updateMatrixWorld(true);
  const face=(p:V3,h=.77)=>new T.Vector3(p[0],p[1]+h,p[2]);
  const marker:Record<string,T.Vector3>={latte:face(lp),mocha:face(mp),essie:face(ep),kitten:face(kid,.39),'latte-ear':new T.Vector3(lp[0]-.20,lp[1]+1.15,lp[2]),'home-blanket':new T.Vector3().fromBufferAttribute(w.homeBlanket.geometry.getAttribute('position'),8*21+3).applyMatrix4(w.homeBlanket.matrixWorld),'latte-feet':face(lp,.10),'latte-paws':new T.Vector3(lp[0]+.1,lp[1]+.4,lp[2]+.12),pavement:new T.Vector3(3.05,.03,8.0),cafe:new T.Vector3(0,2.2,4.3),clock:new T.Vector3(...CLOCK),sign:new T.Vector3(...SIGN),handle:h,'push-point':pushPoint,door:new T.Vector3(2.25,1.6,4.20),tap,shadow:new T.Vector3(-.9,2.0,4.26),'shadow-top':new T.Vector3(-.9,2.65,4.26),'blanket-shadow':new T.Vector3().fromBufferAttribute(w.blanket.geometry.getAttribute('position'),16*21+10),blanket:new T.Vector3(2,.30,3.4),bowl:face(s.bowl,.1),'home-door':new T.Vector3(3.15,1.4,12.23),switch:new T.Vector3(...HOME.switch),lantern:new T.Vector3(-.96,.25,2.62),moon:new T.Vector3(-10,13,-28),'bus-stop':w.root.getObjectByName('bus-stop-pictogram')!.getWorldPosition(new T.Vector3()),bus:new T.Vector3(w.bus.position.x,1,w.bus.position.z)};
  marker.essie=new T.Vector3(...mouthAnchor(s,'essie')).add(new T.Vector3(0,.11,0));
  marker['other-buildings']=new T.Vector3(s.camera[0],1.7,12.19);marker.alley=new T.Vector3(5.45,.7,2.8);
  marker['shelter-guest']=face(shelterState(s,0).position,.46);marker['hesitant-cat']=face(shelterState(s,2).position,.72);
  marker['confused-cat']=face(streetCatPosition(s,s.shot.number===5?s.shot.variant%2:0),.6);
  marker['alley-kitten']=face(shelterState(s,3).position,.48);marker['flowerpot']=new T.Vector3(-3.25,.65,3.35);marker['hiding-box']=new T.Vector3(.55,.55,15.05);marker['cloth-silhouette']=new T.Vector3(-.9,1.05,4.26);marker['dark-street']=new T.Vector3(s.camera[0],1.55,10.0);marker['rush-home']=face(streetCatPosition(s,1),.55);
  w.lights.forEach((l,i)=>{marker[`light-${i+1}`]=l.point.getWorldPosition(new T.Vector3());});
  const blockers=[...w.cafe.blockers,...w.blockers].filter(m=>m.visible);
  const visual:T.Mesh[]=[];w.root.traverse(o=>{for(let p:T.Object3D|null=o;p;p=p.parent)if(!p.visible)return;if(o instanceof T.Mesh&&!(o instanceof T.InstancedMesh)&&!Array.isArray(o.material)&&o.material.opacity>=.9&&!o.name.startsWith('static-batch-'))visual.push(o);});
  const required=[...s.required];
 if(required.includes('clock'))for(const [id,x,y] of [['clock-left',-1.14,0],['clock-right',1.14,0],['clock-top',0,1.14],['clock-bottom',0,-1.14]] as [string,number,number][]){marker[id]=new T.Vector3(CLOCK[0]+x,CLOCK[1]+y,CLOCK[2]+.03);required.push(id);}
 if(required.includes('bus'))for(const [id,x,y,z] of [['bus-front',-1.9,1,.0],['bus-rear',1.9,1,0],['bus-roof',0,1.85,0],['bus-wheels',0,.3,.65]] as [string,number,number,number][]){marker[id]=new T.Vector3(w.bus.position.x+x,y+.03,w.bus.position.z+z);required.push(id);}
 const visibility=required.map(id=>{
 if(id==='city-district'){
  const visibleBuildings:string[]=[];for(const b of w.root.getObjectByName('connected-city')!.children.filter(o=>o.name.startsWith('city-block-'))){const p=b.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,4,0)),ndc=p.project(cam);if(Math.abs(ndc.x)<.95&&Math.abs(ndc.y)<.9&&ndc.z>-1&&ndc.z<1)visibleBuildings.push(b.name);}
  return {id,inFrame:visibleBuildings.length>=12,ndc:[0,0],occluder:null,visibleBuildings};
 }
 if(id==='other-buildings'){
  const buildings=new Set<string>();for(const y of [-.25,0,.25])for(const x of [-.8,-.4,0,.4,.8]){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x,y),cam);const hit=ray.intersectObjects(visual,false)[0];if(hit)for(let p:T.Object3D|null=hit.object;p;p=p.parent)if(p.name==='latte-home'||p.name.startsWith('town-building-')||p.name.startsWith('city-block-')){buildings.add(p.name);break;}}
  return {id,inFrame:buildings.size>=2,ndc:[0,0],occluder:null,visibleBuildings:[...buildings]};
 }

   const p=marker[id];if(!p)throw Error('Missing required story marker '+id);const ndc=p.clone().project(cam),d=p.clone().sub(cam.position),length=d.length(),ray=new T.Raycaster(cam.position,d.normalize(),.08,length-.06);
   ray.layers.enable(7);ray.layers.enable(NOINK);
   let owner=id.startsWith('clock-')?w.props.get('clock'):id==='handle'||id==='tap'||id==='push-point'?w.door:id==='blanket-shadow'?w.blanket:w.props.get(id);
   if(id.startsWith('bus-'))owner=w.bus;
   if(id==='flowerpot')owner=w.cafe.fixtures.get('entrance-plant');
   if(id.startsWith('light-')&&owner?.parent?.name.startsWith('streetlight-'))owner=owner.parent;
   const physical=ray.intersectObjects(visual,false).filter(h=>{
    if(id.startsWith('light-')&&(h.object===w.props.get(id)||h.object.parent?.name==='lamp-frame-'+(Number(id.slice(6))-1)))return false;
    if(id==='door'&&h.object.parent===w.door)return false;
    if(id==='home-door'&&h.object.parent===w.homeDoor)return false;
    for(let o:T.Object3D|null=h.object;o;o=o.parent)if(o===owner)return false;
    if(id==='moon'&&(h.object.parent?.name==='rain-clouds'||h.object.name==='night-moon'))return false;
    if(id==='switch'&&h.object.name==='switch-toggle')return false;
    return true;
   });
   const characterHits=characters.filter(c=>c.mesh.visible&&c.id!==id&&!(['latte-feet','latte-paws','latte-ear'].includes(id)&&c.id==='latte')).flatMap(c=>ray.intersectObject(c.mesh,false).filter(h=>{
    if((id==='shelter-guest'&&c.id==='supporting-cat-4')||(id==='hesitant-cat'&&c.id==='supporting-cat-6')||(id==='alley-kitten'&&c.id==='supporting-cat-7')||(id==='rush-home'&&c.id==='supporting-cat-1')||(id==='confused-cat'&&c.id==='supporting-cat-0'))return false;
    if(!h.uv)return false;const cv=(c.mesh.material as T.MeshLambertMaterial).map?.image as HTMLCanvasElement|undefined;if(!cv||typeof cv.getContext!=='function')return false;const pixel=cv.getContext('2d')!.getImageData(Math.min(cv.width-1,Math.max(0,Math.floor(h.uv.x*cv.width))),Math.min(cv.height-1,Math.max(0,Math.floor((1-h.uv.y)*cv.height))),1,1).data;return pixel[3]>128;}).map(h=>({...h,character:c.id})));
   const occlusions=[...physical,...characterHits].sort((a,b)=>a.distance-b.distance);
   return {id,inFrame:Math.abs(ndc.x)<.98&&Math.abs(ndc.y)<.98&&ndc.z<1&&ndc.z>-1,ndc:[ndc.x,ndc.y],occluder:occlusions[0]?.object.name??null};
  });
  const cameraHits=blockers.filter(m=>new T.Box3().setFromObject(m).containsPoint(cam.position)).map(m=>m.name||m.parent?.name);
 return {visibility,cameraHits};
}
