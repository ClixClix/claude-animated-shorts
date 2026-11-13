import React, {useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import * as THREE from 'three';
import {CatId} from './designs';
import {CAT_HEIGHT, CAT_WIDTH, drawCat} from './drawCat';
import {CatPose, catMotion} from './pose';

export type CatProps = {id:CatId; pose?:Partial<CatPose>; width?:number; height?:number;
  headOnly?:boolean; seconds?:number; motion?:'idle'|'walk'};
/** Reusable Canvas sprite; motion is opt-in. The sheets are deliberately static. */
export const Cat: React.FC<CatProps> = ({id,pose={},width=500,height=550,headOnly=false,seconds,motion='idle'})=>{
  const ref=useRef<HTMLCanvasElement>(null);
  const [handle]=useState(()=>delayRender(`draw ${id} sprite`));
  useLayoutEffect(()=>{
    try {
      const g=ref.current!.getContext('2d');if(!g)throw new Error('Canvas 2D unavailable');
      g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,CAT_WIDTH*2,CAT_HEIGHT*2);g.scale(2,2);
      drawCat(g,id,{...(seconds===undefined?{}:catMotion(seconds,motion)),...pose},headOnly);
      continueRender(handle);
    } catch(error) { throw error; }
  },[id,pose,headOnly,seconds,motion,handle]);
  return <canvas aria-label={`${id} illustrated character`} ref={ref} width={CAT_WIDTH*2} height={CAT_HEIGHT*2} style={{width,height,display:'block'}}/>;
};

/** The same drawing becomes a transparent Three.js card; no Bridge globals or DOM at import time.
 *  Owner calls update for a frame and dispose on teardown. Facing/yaw within the drawing is independent
 *  of billboard rotation, which the scene controls through mesh.quaternion.
 */
export function createCatCard(id:CatId,height=1.4){
  const canvas=document.createElement('canvas');canvas.width=CAT_WIDTH*2;canvas.height=CAT_HEIGHT*2;
  const g=canvas.getContext('2d');if(!g)throw new Error('Canvas 2D unavailable');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  const material=new THREE.MeshLambertMaterial({map:texture,transparent:true,alphaTest:0.02,side:THREE.DoubleSide,depthWrite:false});
  const geometry=new THREE.PlaneGeometry(height*CAT_WIDTH/CAT_HEIGHT,height);
  geometry.translate(0,height*(480/CAT_HEIGHT-0.5),0);
  const mesh=new THREE.Mesh(geometry,material);
  const update=(pose:Partial<CatPose>={})=>{
    g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,canvas.width,canvas.height);g.scale(2,2);
    drawCat(g,id,pose);texture.needsUpdate=true;
  };
  update();
  return {mesh,update,dispose:()=>{mesh.removeFromParent();texture.dispose();material.dispose();geometry.dispose();}};
}
