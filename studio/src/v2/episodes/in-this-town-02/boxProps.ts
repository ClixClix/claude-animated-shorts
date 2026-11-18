import * as T from 'three';

/**
 * Episode 02's independent, reusable hero props.
 * Only the small mutable GROUP moves during shots. No room/floor/counter mesh
 * is rebuilt and no Episode 01 source or render cache is touched.
 *
 * Dimensions are measured relative to Episode 01's original 1.52m tall
 * stylized cat artwork. Low sidewalls keep ears/faces readable in the boxes;
 * values remain subject to actual frame review.
 */
export type BoxIdentity='latte'|'essie'|'shared'|'demo';
export type BoxSpec={
  id:string; width:number; depth:number; height:number; color:string;
  tape:'striped'|'none'; home:[number,number,number]; role:string;
};
export const BOX_SPECS:Readonly<Record<BoxIdentity,Readonly<BoxSpec>>> = Object.freeze({
  demo:Object.freeze({
    id:'RULE_DEMO_BOX',width:.88,depth:.77,height:.40,color:'#bb926c',
    tape:'none',home:[1.8,.04,5.35] as [number,number,number],
    role:'One small physical cardboard box for the town-rule demonstration; same mesh persists after transformation',
  }),
  latte:Object.freeze({
    id:'LATTE_BOX',width:1.10,depth:.94,height:.48,color:'#b98d60',
    tape:'striped',home:[-1.9,0,2.1] as [number,number,number],
    role:'Latte original box beneath the front cafe window',
  }),
  essie:Object.freeze({
    id:'ESSIE_BOX',width:1.30,depth:1.08,height:.56,color:'#a8794e',
    tape:'none',home:[.25,0,.3] as [number,number,number],
    role:'Essie original box in the cafe sleeping corner; moves to alley',
  }),
  shared:Object.freeze({
    id:'SHARED_BOX',width:2.36,depth:1.12,height:.55,color:'#cca174',
    tape:'none',home:[-1.45,0,2.1] as [number,number,number],
    role:'One proportionate end-scene cardboard box for all three Episode01 cats',
  }),
});
export const BOX_IDENTITY_ORDER=['latte','essie','shared'] as const;

/** Hollow physically modeled cardboard with four independent articulated flaps. */
export function createEpisodeBox(identity:BoxIdentity) {
  const spec=BOX_SPECS[identity];
  const root=new T.Group();
  root.name=spec.id;
  root.position.set(...spec.home);
  root.userData={role:'episode02-magic-box',identity,stableId:spec.id};
  const base=new T.MeshStandardMaterial({color:spec.color,roughness:.94,metalness:0,side:T.DoubleSide});
  const edge=new T.MeshStandardMaterial({color:'#806347',roughness:.95,metalness:0});
  // The old boxes were single-tone solids with no visual depth behind the
  // flat Episode01 artwork. A darker inset gives the cat a believable bed
  // and provides consistent floor/wall contact across three-quarter angles.
  const inner=new T.MeshStandardMaterial({
    color:'#977451',roughness:.98,metalness:0,side:T.DoubleSide
  });
  const ink=new T.LineBasicMaterial({color:'#382e31',transparent:true,opacity:.78});
  const tape=new T.MeshStandardMaterial({color:'#e7cda1',roughness:.86,metalness:0});
  const resources:T.BufferGeometry[]=[];
  const materials:T.Material[]=[base,edge,inner,ink,tape];
  const {width:w,depth:d,height:h}=spec;
  const thick=.032;
  const panel=(parent:T.Group, name:string, size:[number,number,number],
               pos:[number,number,number], material:T.Material=base)=>{
    const geometry=new T.BoxGeometry(...size);
    const mesh=new T.Mesh(geometry,material);
    mesh.name=name;mesh.position.set(...pos);
    mesh.castShadow=true;mesh.receiveShadow=true;resources.push(geometry);
    parent.add(mesh);
    const outline=new T.LineSegments(new T.EdgesGeometry(geometry),ink);
    outline.name=name+'-ink';
    resources.push(outline.geometry);mesh.add(outline); // follow any flap/tape pose or rotation
    return mesh;
  };
  // The interior stays hollow; the bottom is slightly above the actual Y=0 floor.
  panel(root,spec.id+'-floor',[w,.04,d],[0,.024,0],edge);
  // Inset paper bed, a few millimetres above the true cardboard floor.
  // Episode02 resting paws/shadows are already anchored at Y≈.055;
  // unlike a fake foot platform this stays *inside* the original box.
  panel(root,spec.id+'-floor-liner',[w-.095,.006,d-.095],[0,.048,0],inner);
  panel(root,spec.id+'-front',[w,h,thick],[0,h/2+.04,d/2-thick/2]);
  panel(root,spec.id+'-back',[w,h,thick],[0,h/2+.04,-d/2+thick/2]);
  panel(root,spec.id+'-left',[thick,h,d-2*thick],[-w/2+thick/2,h/2+.04,0]);
  panel(root,spec.id+'-right',[thick,h,d-2*thick],[w/2-thick/2,h/2+.04,0]);
  // Recessed inner cardboard surfaces create a readable side/back depth
  // without changing the external dimensions or hiding the cat's face.
  panel(root,spec.id+'-back-inner',[w-.07,h-.10,.006],
   [0,h/2+.04,-d/2+.038],inner);
  panel(root,spec.id+'-left-inner',[.006,h-.10,d-.09],
   [-w/2+.038,h/2+.04,0],inner);
  panel(root,spec.id+'-right-inner',[.006,h-.10,d-.09],
   [w/2-.038,h/2+.04,0],inner);
  const flaps={
    front:new T.Group(),back:new T.Group(),left:new T.Group(),right:new T.Group(),
  };
  flaps.front.name=spec.id+'-front-flap-pivot';
  flaps.back.name=spec.id+'-back-flap-pivot';
  flaps.left.name=spec.id+'-left-flap-pivot';
  flaps.right.name=spec.id+'-right-flap-pivot';
  const top=h+.04;
  flaps.front.position.set(0,top,d/2);
  flaps.back.position.set(0,top,-d/2);
  flaps.left.position.set(-w/2,top,0);
  flaps.right.position.set(w/2,top,0);
  for(const f of Object.values(flaps))root.add(f);
  panel(flaps.front,spec.id+'-front-flap',[w-.055,.024,d*.47],[0,0,-d*.235]);
  panel(flaps.back,spec.id+'-back-flap',[w-.055,.024,d*.47],[0,0,d*.235]);
  panel(flaps.left,spec.id+'-left-flap',[w*.47,.024,d-.055],[w*.235,0,0]);
  panel(flaps.right,spec.id+'-right-flap',[w*.47,.024,d-.055],[-w*.235,0,0]);
  if(spec.tape==='striped'){
    // SOURCE-LOCK: Latte's ORIGINAL carton is visibly striped on all sides.
    // Earlier footage looked plain because only two tiny strips of tape existed.
    // Never change its transform/identity between introduction and rescue.
    const darkStripe=new T.MeshStandardMaterial({color:'#70472e',roughness:.96,metalness:0});
    const lightStripe=new T.MeshStandardMaterial({color:'#efd2a6',roughness:.96,metalness:0});
    materials.push(darkStripe,lightStripe);
    const paint=(parent:T.Group,name:string,size:[number,number,number],
      position:[number,number,number],mat:T.Material)=>{
      const geo=new T.BoxGeometry(...size);
      const mesh=new T.Mesh(geo,mat);
      mesh.name=name;mesh.position.set(...position);
      mesh.castShadow=false;mesh.receiveShadow=true;
      resources.push(geo);parent.add(mesh);
    };
    // Seven wraparound alternating bands, readable even in low-res preview.
    const count=7,thickness=Math.min(.051,h/(count+2));
    for(let i=0;i<count;i++){
      const y=.04+h*(i+.72)/(count+1);
      const mat=i%2?lightStripe:darkStripe;
      paint(root,spec.id+'-stripe-front-'+i,[w+.009,thickness,.006],
        [0,y,d/2+.005],mat);
      paint(root,spec.id+'-stripe-back-'+i,[w+.009,thickness,.006],
        [0,y,-d/2-.005],mat);
      paint(root,spec.id+'-stripe-left-'+i,[.006,thickness,d+.009],
        [-w/2-.005,y,0],mat);
      paint(root,spec.id+'-stripe-right-'+i,[.006,thickness,d+.009],
        [w/2+.005,y,0],mat);
    }
    // The real flaps hinge, so paint attached to each flap follows its motion.
    for(let i=0;i<7;i++){
      const x=-w*.39+i*w*.13;
      const mat=i%2?darkStripe:lightStripe;
      paint(flaps.front,spec.id+'-stripe-front-flap-'+i,[w*.075,.007,d*.41],
        [x,.016,-d*.235],mat);
      paint(flaps.back,spec.id+'-stripe-back-flap-'+i,[w*.075,.007,d*.41],
        [x,.016,d*.235],mat);
    }
  }
  function setOpenAmount(input:number){
    if(!Number.isFinite(input))throw Error('Box opening must be a finite number');
    const amount=Math.max(0,Math.min(1,input));
    // The rule-demo box is an open, playable prop: at amount=1 its flaps
    // must lie OUTSIDE the rim, never upright across the cat's face. This
    // now applies to ALL boxes; previous .72 turns covered the lead cats.
    const angle=amount*Math.PI*(identity==='demo'?1:.92);
    flaps.front.rotation.x=angle;
    flaps.back.rotation.x=-angle;
    flaps.left.rotation.z=angle;
    flaps.right.rotation.z=-angle;
  }
  setOpenAmount(.82);
  function dispose(){
    root.removeFromParent();
    for(const geometry of resources)geometry.dispose();
    for(const material of materials)material.dispose();
  }
  return {root,spec,flaps,setOpenAmount,dispose};
}
