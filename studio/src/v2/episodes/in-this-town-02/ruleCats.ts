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
export type RuleCatVariant='hazel'|'slate'|'honey'|'sage'|'kitten';
const designs:Record<RuleCatVariant,CatDesign>={
 kitten:{name:'Original cream-taupe town kitten (curled)',coat:'#c6ad87',
  light:'#d9c09a',shadow:'#a18b73',marking:'#85725f',bib:'#fff0d1',
  muzzle:'#fff0d1',ear:'#d4a1a0',iris:'#a8bda4',nose:'#b9827e',
  headWidth:94,cheek:19,bodyWidth:85,tailWidth:33,
  description:'Shot 2 curled companion matching the original rule kitten color, eyes and ruff'},
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
export const getRuleGuestDesign=(variant:RuleCatVariant):CatDesign=>designs[variant];
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
  morph?:number;
  look?:number;
  headTilt?:number;
  blink?:number;
  walking?:boolean;
 }={})=>{
  const progress=clamp(options.progress??0);
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,canvas.width,canvas.height);
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
   const bodyY=350+progress*15;
   shade(g,253,bodyY,141,68,design.light,design.shadow);
   g.strokeStyle=design.shadow;g.lineWidth=23;g.lineCap='round';
   g.beginPath();g.moveTo(315,350);g.bezierCurveTo(398,315,399,407,340,405);g.stroke();
   for(const x of [183,307])shade(g,x,405,37,17,design.coat,design.shadow);
   g.restore();
   // This is Episode 01's original illustrated face with its real
   // eyes/whiskers/ears; placing it on the curled body keeps identity.
   g.save();
   g.translate(0,-5+progress*24);
   drawCat(g,'essie',{...pose,walking:false},true,design);
   const paper=clamp(options.morph??0);
   if(paper>.16){
    // Cardboard *develops on the same face* rather than adding a beige
    // rectangle on the front wall of the box. Split paper facets follow
    // the cheek/ear silhouette while the facial features are still visible.
    g.save();
    g.globalAlpha=Math.min(.91,(paper-.16)/.58);
    g.lineJoin='round';g.lineWidth=3.5;g.strokeStyle='#51403c';
    const fold=(points:[number,number][],tone:string)=>{
     g.fillStyle=tone;g.beginPath();
     points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
     g.closePath();g.fill();g.stroke();
    };
    fold([[147,171],[230,157],[244,227],[171,264],[150,224]],'#bd936e');
    fold([[253,165],[348,177],[348,222],[325,268],[248,233]],'#d3aa81');
    g.strokeStyle='#82674f';g.lineWidth=2;
    g.beginPath();g.moveTo(173,186);g.lineTo(225,217);
    g.moveTo(333,191);g.lineTo(272,226);g.stroke();
    g.restore();
   }
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
  card.dispose();
 };
 return {mesh:card.mesh,update,material:mat,design,dispose};
}


/** Episode 02 close-up curl assembled from the exact ORIGINAL kitten canvas.
 *
 * This reuses the source artist's actual ears, V-tabby crown, eyes, white bib,
 * paws and tail; it never substitutes a different town guest face. No changes
 * to the Episode 01 asset or to the approved wide Shot 01.
 * Rendering source segments at different scales is a 2.5D squash/tuck pose,
 * not a claim of a newly sculpted three-dimensional cat.
 */
export function createCurledSourceKitten(source:T.Texture){
 const canvas=document.createElement('canvas');canvas.width=840;canvas.height=1040;
 const g=canvas.getContext('2d')!;
 const tex=new T.CanvasTexture(canvas);
 tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
 const mat=cardShade(new T.MeshLambertMaterial({
  map:tex,alphaTest:.12,transparent:true,depthWrite:false,
  side:T.DoubleSide
 }));
 const height=.79;
 const geo=new T.PlaneGeometry(height*420/520,height);
 geo.translate(0,height*(482/520-.5),0);
 const mesh=new T.Mesh(geo,mat);
 mesh.name='episode02-original-kitten-curled-pose';
 mesh.castShadow=true;mesh.receiveShadow=true;
 const update=(_seconds:number,o:{progress?:number;morph?:number;beat?:number}={})=>{
  const src=source.image as HTMLCanvasElement|undefined;
  if(!src)return;
  const progress=Math.max(0,Math.min(1,o.progress??.18));
  const morph=Math.max(0,Math.min(1,o.morph??0));
  const paper=morph*morph*(3-2*morph);
  const beat=Math.max(0,Math.min(1,o.beat??0));
  const ease=(a:number)=>{const t=Math.max(0,Math.min(1,a));return t*t*(3-2*t);};
  // Distinct real movement in 21 frames: one breath, head resettling, ear
  // twitch, tail curl and planted-paw tuck. Original source art (including
  // actual blink) is refreshed by demoKitten.update BEFORE this compositing.
  const breathing=Math.sin(Math.PI*beat);
  const settling=ease((beat-.20)/.62);
  const earPulse=Math.exp(-Math.pow((beat-.63)/.095,2));
  const tailPulse=Math.exp(-Math.pow((beat-.78)/.15,2));
  const pawTuck=ease((beat-.72)/.24);
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,840,1040);
  g.save();g.scale(2,2);
  // The tail curls toward the torso rather than reading as a second head.
  g.save();g.translate(338,361);
  g.rotate(-.115*tailPulse);
  g.drawImage(src,270*2,285*2,120*2,190*2,
    -54,-81+30*paper,116+20*paper,139*(1-.72*paper));
  g.restore();
  // Visible horizontal body: fill the measured .88m x .77m carton without
  // stretching box geometry. Breathing also raises the back and shoulders.
  g.drawImage(src,109*2,287*2,216*2,195*2,
    130+3*pawTuck-18*paper,289-5*breathing+3*pawTuck+43*paper,
    264+7*breathing-4*pawTuck+37*paper,
    (139+6*breathing-3*pawTuck)*(1-.78*paper));
  // Keep the EXACT original kitten's eyes, crown, ears, nose and whiskers.
  // The small head slide makes it glance toward the box wall before the
  // transformation instead of staring at camera as a still illustration.
  const headX=91-7*settling;
  const headY=158+progress*8-2*breathing+3*settling;
  g.drawImage(src,102*2,78*2,222*2,245*2,
    headX-24*paper,headY+38*paper,225+48*paper,217*(1-.80*paper));
  // A quick right-ear flick uses the original painted ear itself. Overlay
  // is intentionally tiny (no replacement limbs or foreign sprite parts).
  if(earPulse>.06 && paper<.12){
   g.save();
   g.globalAlpha=.34*earPulse;
   g.translate(headX+183,headY+93);
   g.rotate(-.085*earPulse);
   g.drawImage(src,248*2,86*2,59*2,110*2,
     -29,-91,59,109);
   g.restore();
  }
  if(paper>.05){
   // Cat anatomy visibly becomes the PAPER SURFACE of its same carton:
   // torso spreads into a flat crease, head/ears flatten into the material.
   // This is not a dissolving duplicate or an arbitrary scale pop.
   g.globalAlpha=Math.min(.83,paper*.88);
   g.fillStyle='#bb926c';
   g.fillRect(97+14*paper,343-7*paper,294,32+10*paper);
   g.strokeStyle='#806347';g.lineWidth=3;
   g.beginPath();
   g.moveTo(105,355);g.lineTo(389,355+4*paper);
   g.moveTo(200,335);g.lineTo(218,369);
   g.moveTo(300,333);g.lineTo(314,369);
   g.stroke();
   g.globalAlpha=1;
  }
  g.restore();tex.needsUpdate=true;
 };
 update(0);
 return {mesh,update,dispose:()=>{mesh.removeFromParent();geo.dispose();mat.dispose();tex.dispose();}};
}
