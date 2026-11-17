import * as T from 'three';
import {createCatCard} from '../../cats/Cat';
import {drawCat} from '../../cats/drawCat';
import {catMotion, type CatPose} from '../../cats/pose';
import {type CatDesign} from '../../cats/designs';
import {cardShade} from '../../../videos/bridge/cardshade';
import {NOINK} from '../../../videos/bridge/ink';

/**
 * Reuse the detailed Episode 01 body/head illustrator for the single anonymous
 * rule cat and its witnesses. The previous Episode 01 crowd sprites were very
 * cheap background extras: at close range they looked like expressionless toys.
 * This module uses the original illustrated linework with three DISTINCT
 * palettes. It never changes the three lead designs.
 */
export type RuleCatVariant='hazel'|'slate'|'honey'|'sage';
const designs:Record<RuleCatVariant,CatDesign>={
 hazel:{name:'Hazel (town guest)',coat:'#af7e58',light:'#d6a47d',
  shadow:'#8c5d48',marking:'#6d4e43',bib:'#e7c7a4',
  muzzle:'#f1dbc2',ear:'#c38b8c',iris:'#b1c67a',nose:'#ad7973',
  headWidth:100,cheek:21,bodyWidth:89,tailWidth:43,
  description:'Chestnut town cat with cream chest; distinct from three leads'},
 slate:{name:'Slate (town witness)',coat:'#77889b',light:'#a0b3c1',
  shadow:'#536476',marking:'#445a70',bib:'#c8d2d4',
  muzzle:'#e4e3dd',ear:'#af8796',iris:'#dbb883',nose:'#b18388',
  headWidth:91,cheek:17,bodyWidth:88,tailWidth:39,
  description:'Blue-gray town guest, no Mocha tabby blaze'},
 honey:{name:'Honey (town witness)',coat:'#c19463',light:'#e0b689',
  shadow:'#9c764d',marking:'#78583f',bib:'#f4d7b1',
  muzzle:'#efdcbe',ear:'#bd8594',iris:'#9eb1a2',nose:'#aa7a70',
  headWidth:102,cheek:23,bodyWidth:92,tailWidth:40,
  description:'Honey-colored guest without Latte chocolate points'},
 sage:{name:'Sage (town witness)',coat:'#818e7a',light:'#a8b5a0',
  shadow:'#596b62',marking:'#4e6156',bib:'#ded9c2',
  muzzle:'#efdfc7',ear:'#b49b99',iris:'#d2bd86',nose:'#96796f',
  headWidth:95,cheek:22,bodyWidth:90,tailWidth:36,
  description:'Sage-green-gray supporting character'},
};
const INK='#292737';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const shade=(g:CanvasRenderingContext2D,
 x:number,y:number,rx:number,ry:number,primary:string,secondary:string)=>{
 const grad=g.createLinearGradient(x-rx,y-ry,x+rx,y+ry);
 grad.addColorStop(0,primary);grad.addColorStop(1,secondary);
 g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);
 g.fillStyle=grad;g.fill();g.strokeStyle=INK;
 g.lineWidth=4;g.lineJoin='round';g.stroke();
};
export function createRuleCat(variant:RuleCatVariant,height=1.22){
 const card=createCatCard('essie',height);
 const mat=cardShade(card.mesh.material);
 card.mesh.material=mat;
 mat.side=T.DoubleSide;mat.alphaTest=.065;
 mat.transparent=true;mat.depthWrite=false;
 card.mesh.layers.set(NOINK);card.mesh.name='rule-cat-'+variant;
 const texture=mat.map as T.CanvasTexture;
 const canvas=texture.image as HTMLCanvasElement;
 const g=canvas.getContext('2d')!;
 const design=designs[variant];
 const update=(seconds:number, options:{
  pose?:'standing'|'curled';
  expression?:CatPose['expression'];
  progress?:number;
  look?:number;
  headTilt?:number;
  blink?:number;
  walking?:boolean;
 }={})=>{
  const progress=clamp(options.progress??0);
  g.setTransform(1,0,0,1);g.clearRect(0,0,canvas.width,canvas.height);
  g.setTransform(2,0,0,2,0,0);
  const pose:Partial<CatPose>={
   ...catMotion(seconds,options.walking?'walk':'idle',variant.length*.16),
   yaw:.10,headTurn:options.look??0,gazeX:options.look??0,
   headTilt:options.headTilt??0,expression:options.expression??'neutral',
   ...(options.blink===undefined?{}:{blink:options.blink})
  };
  if(options.pose==='curled'){
   // Curled torso is deliberately separate from the head. No upright,
   // full-length card behind the box pretending to be a seated cat.
   g.save();
   const bodyY=400+progress*19;
   shade(g,253,bodyY,141,66,design.light,design.shadow);
   g.strokeStyle=design.shadow;g.lineWidth=23;g.lineCap='round';
   g.beginPath();g.moveTo(320,390);g.bezierCurveTo(400,365,408,426,344,437);g.stroke();
   for(const x of [183,307])shade(g,x,440,37,17,design.coat,design.shadow);
   g.restore();
   // This is Episode 01's original illustrated face with its real
   // eyes/whiskers/ears; placing it on the curled body keeps identity.
   g.save();
   g.translate(0,120+progress*18);
   drawCat(g,'essie',{...pose,walking:false},true,design);
   g.restore();
  }else{
   drawCat(g,'essie',pose,false,design);
  }
  texture.needsUpdate=true;
 };
 update(0);
 const dispose=()=>{
  card.mesh.removeFromParent();
  // card.dispose() disposes its original material. Also dispose the
  // Episode 01 shader wrapper if it is a separate material.
  if(mat!==card.mesh.material)mat.dispose();
  card.dispose();
 };
 return {mesh:card.mesh,update,material:mat,design,dispose};
}
