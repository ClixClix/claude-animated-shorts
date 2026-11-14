import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Rendering-only batching of immutable opaque café parts. Original IDs/transforms remain
 * available on a non-rendered layer for collision and continuity checks. No asset is moved. */
export const SOURCE_LAYER=7;
export function batchCafe(root:T.Group,dynamic:T.Object3D){
 root.updateMatrixWorld(true);const groups=new Map<string,T.Mesh[]>();
 root.traverse(o=>{
  if(!(o instanceof T.Mesh)||Array.isArray(o.material)||o.material.transparent||o.material.opacity!==1)return;
  for(let p:T.Object3D|null=o;p;p=p.parent)if(p===dynamic)return;
  const m=o.material as T.MeshStandardMaterial;
  // Luminous windows and lamps have episode-specific power states.
  if(m.emissiveIntensity>0)return;
  const key=JSON.stringify([m.type,m.color?.getHexString(),m.roughness,m.metalness,m.side,m.alphaTest,m.map?.uuid,m.toneMapped,m.depthWrite,o.layers.mask,o.castShadow,o.receiveShadow]);
  const list=groups.get(key)??[];list.push(o);groups.set(key,list);
 });
 const output=new T.Group();output.name='immutable-cafe-render-batches';let sourceMeshes=0;
 for(const list of groups.values()){
  if(list.length<2)continue;const geometries=list.map(mesh=>{
   const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);
   if(!g.getAttribute('uv'))g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));return g;
  });
  const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geometry)throw Error('Static geometry batch failed.');
  const first=list[0],mesh=new T.Mesh(geometry,first.material);mesh.name=`static-batch-${output.children.length}`;mesh.layers.mask=first.layers.mask;mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;output.add(mesh);
  for(const original of list){original.layers.set(SOURCE_LAYER);sourceMeshes++;}
 }
 output.userData={sourceMeshes,batches:output.children.length};return output;
}
