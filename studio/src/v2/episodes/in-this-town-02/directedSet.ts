import {createEpisodeBox} from './boxProps';
import {FRIEND_NAPS} from './storyDirection';
import * as T from 'three';
import type {State} from './timeline';
/** Persistent episode-local alley/plaza kit. Approved cafe/world assets are untouched. */
export function createDirectedSet(){
 const root=new T.Group();root.name='episode02-directed-location-kit';
 const geometries:T.BufferGeometry[]=[],materials:T.Material[]=[];
 const mat=(c:string)=>{const m=new T.MeshStandardMaterial({color:c,roughness:.94});materials.push(m);return m;};
 const stone=mat('#666d70'),brick=mat('#68757d'),trim=mat('#a6a28e'),dark=mat('#34474c'),paving=mat('#777c7b'),foodMat=mat('#b7905f');
 const glass=new T.MeshStandardMaterial({color:'#dec591',emissive:'#ba8741',emissiveIntensity:.28,roughness:.75});materials.push(glass);
 const box=(parent:T.Group,name:string,size:number[],pos:number[],m:T.Material)=>{const g=new T.BoxGeometry(...size as [number,number,number]);geometries.push(g);const o=new T.Mesh(g,m);o.name=name;o.position.set(...pos as [number,number,number]);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const alley=new T.Group();alley.name='episode02-long-service-alley';alley.position.set(-18,0,0);root.add(alley);
 box(alley,'alley-paving',[4.7,.08,20],[0,-.05,-1.5],paving);
 for(const side of [-1,1]){
  box(alley,'continuous-alley-wall-'+side,[.34,6.8,19.5],[side*2.45,3.4,-1.65],brick);
  box(alley,'alley-curb-'+side,[.24,.15,19.5],[side*2.23,.075,-1.65],stone);
  for(const y of [1.5,3.3,5.1])for(const z of [-8,-5.4,-2.8,-.2,2.4,5]){
   box(alley,'inset-window-frame',[.07,1.10,.88],[side*2.25,y,z],trim);
   box(alley,'warm-service-window',[.075,.90,.69],[side*2.20,y,z],glass);
  }
  for(const z of [-8.8,-2.1,3.8]){
   box(alley,'service-bin',[.34,.72,.60],[side*2.0,.51,z],dark);
   box(alley,'bin-lid',[.40,.06,.65],[side*2.0,.90,z],stone);
  }
 }
 box(alley,'alley-end-wall',[4.9,6.8,.30],[0,3.4,-11.35],brick);
 const light=new T.PointLight('#f4d4a0',30,15,2);light.position.set(1.6,4,-4.5);alley.add(light);
 const searchEast=alley.clone(true);searchEast.name='episode02-search-east';searchEast.position.set(18,0,0);root.add(searchEast);
 box(searchEast,'blue-service-sign',[.08,.45,.85],[2.1,2.2,-1.5],mat('#3d6c83'));
 box(searchEast,'stacked-market-crate',[.60,.50,.75],[-1.75,.25,-4.2],mat('#a67c50'));
 box(searchEast,'stacked-market-crate-top',[.60,.50,.75],[-1.75,.75,-4.2],mat('#8b6948'));
 const searchNorth=alley.clone(true);searchNorth.name='episode02-search-north';searchNorth.position.set(-18,0,-26);root.add(searchNorth);
 box(searchNorth,'closed-service-shutter',[1.55,2.5,.08],[0,1.25,-11.14],mat('#52616a'));
 box(searchNorth,'exposed-drain-pipe',[.11,3.4,.11],[2.10,1.70,-2.7],mat('#8b9694'));
 const northGlass=glass.clone();northGlass.color.set('#a2b7bd');northGlass.emissive.set('#6d8598');materials.push(northGlass);
 searchNorth.traverse(o=>{if(o instanceof T.Mesh&&o.name==='warm-service-window')o.material=northGlass;});
 const naps=FRIEND_NAPS.map(p=>{const b=createEpisodeBox('demo');b.root.position.set(p[0],0,p[2]);b.setOpenAmount(1);root.add(b.root);return b;});
 const plaza=new T.Group();plaza.name='episode02-town-square';root.add(plaza);
 box(plaza,'plaza-paving',[12,.16,7],[0,.07,8.8],paving);
 box(plaza,'small-speaking-platform',[2.3,.20,1.35],[0,.19,6.0],trim);
 const food=new T.Group();food.name='food-carried-in-muzzle';root.add(food);
 for(let i=0;i<3;i++){const g=new T.SphereGeometry(.065,8,6);geometries.push(g);const o=new T.Mesh(g,foodMat);o.position.set((i-1)*.065,.025*(i%2),0);food.add(o);}
 const emptyMat=new T.Group();emptyMat.name='empty-usual-box-space';root.add(emptyMat);
 box(emptyMat,'home-box-rug',[1.5,.015,1.15],[.25,.02,13.5],mat('#817a6b'));
 return {root,update(s:State){alley.visible=!!s.story?.alley&&(s.shot.sequence!==30||(s.searchAlleyIndex??0)===0);searchEast.visible=s.shot.sequence===30&&s.searchAlleyIndex===1;searchNorth.visible=s.shot.sequence===30&&s.searchAlleyIndex===2;naps.forEach(b=>b.root.visible=!!s.story?.friendNap);plaza.visible=!!s.story?.townSquare;emptyMat.visible=s.shot.sequence===26;food.visible=!!s.story?.food;if(s.story?.food)food.position.set(...s.story.food);},dispose(){naps.forEach(b=>b.dispose());for(const g of geometries)g.dispose();for(const m of materials)m.dispose();root.removeFromParent();}};
}
