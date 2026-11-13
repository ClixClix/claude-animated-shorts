import {INK, mix, Pen} from '../../videos/bridge/toon';
import {CatId, DESIGNS} from './designs';
import {CatPose, resolvePose, clamp} from './pose';

export const CAT_WIDTH=500, CAT_HEIGHT=550;
type Ctx=CanvasRenderingContext2D;
const shape=(g:Ctx,d:string,fill:string,stroke=INK,w=3.8)=>{
  const p=new Path2D(d); g.fillStyle=fill; g.fill(p);
  if(w){g.strokeStyle=stroke;g.lineWidth=w;g.lineJoin='round';g.lineCap='round';g.stroke(p);} return p;
};
const line=(g:Ctx,d:string,color=INK,w=3)=>{
  g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke(new Path2D(d));
};
const ellipse=(g:Ctx,x:number,y:number,rx:number,ry:number,fill:string,w=0)=>{
  g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();
  if(w){g.strokeStyle=INK;g.lineWidth=w;g.stroke();}
};
function shaded(g:Ctx,d:string,base:string,shadow:string){
  const gr=g.createLinearGradient(-100,-100,120,100);gr.addColorStop(0,base);gr.addColorStop(0.55,base);gr.addColorStop(1,shadow);
  const p=new Path2D(d);g.fillStyle=gr;g.fill(p);g.strokeStyle=INK;g.lineWidth=3.8;g.stroke(p);return p;
}

/** Transparent, original Canvas 2D drawing. Same plum ink / painted shading idiom as Bridge's Pen.
 *  Design units: 500x550, ground at y=480. Stateless: safe for Remotion random-access rendering.
 *  Yaw changes feature placement and occlusion, not just the width of a front-facing drawing.
 */
export function drawCat(g:Ctx,id:CatId,partial:Partial<CatPose>={},headOnly=false){
  const p=resolvePose(partial), c=DESIGNS[id];
  const sign=p.yaw<0?-1:1, yaw=Math.abs(p.yaw), walk=p.walking;
  g.save();g.translate(250,0);g.scale(sign,1);g.lineJoin='round';g.lineCap='round';
  const bob=walk?Math.cos(p.gait*2)*2:p.breath*1.5;
  const bx=-yaw*19, hx=yaw*(walk?76:51);
  if(!headOnly){
    // Ground contact belongs to the sheet, not the transparent character texture.
    // Plume tail: pivot at the rump, with independently controllable silhouette.
    g.save();g.translate(bx+(yaw>0.5?-57:52),423);g.scale(yaw>0.5?-1:1,1);g.rotate(p.tail*0.32);
    const tw=c.tailWidth;
    const td=`M -13 18 C 35 38 100 28 120 -20 C 137 -59 117 -116 103 -139 Q 95 -153 91 -133 L 84 -139 Q 77 -145 81 -124 L 69 -128 L 73 -108 C 84 -77 77 -51 51 -48 C 20 -44 -5 -26 -13 18 Z`;
    g.scale(tw/45,1);const tailPath=shaded(g,td,id==='latte'?c.marking:c.coat,id==='latte'?'#3d3031':c.shadow);
    g.save();g.clip(tailPath);
    if(id==='mocha') for(let i=0;i<4;i++)shape(g,`M ${57+i*9} ${-13-i*28} q 27 -8 45 -2 l 2 14 q -21 -5 -40 6 Z`,c.marking,INK,0);
    line(g,'M 12 8 Q 87 9 102 -67',id==='essie'?c.light:mix(c.light,c.coat,0.5),2.5);g.restore();g.restore();
    // The walking rig uses four legs with opposing diagonal phases; seated sheets stay still.
    const leg=(x:number,phase:number,far:boolean)=>{
      const shift=walk?Math.sin(p.gait+phase)*15:0, lift=walk?Math.max(0,Math.cos(p.gait+phase))*13:0;
      g.save();g.translate(x+shift,0);
      const base=far?c.shadow:c.coat;
      shape(g,`M -17 ${walk?370:386} Q -25 419 -22 ${466-lift} Q -28 ${483-lift} 7 ${482-lift} Q 32 ${482-lift} 24 ${467-lift} L 22 394 Q 7 375 -17 ${walk?370:386} Z`,base);
      const sock=id==='latte'?c.marking:id==='essie'?c.bib:c.bib;
      // Essie's socks are deliberately small; no invented broad white stockings.
      shape(g,`M -23 ${id==='mocha'?442:id==='essie'?466:438} Q 0 ${id==='mocha'?449:460} 24 ${id==='mocha'?443:451} L 24 ${468-lift} Q 30 ${484-lift} 0 ${483-lift} Q -30 ${481-lift} -22 ${466-lift} Z`,far?mix(sock,c.shadow,0.28):sock,INK,0);
      line(g,`M -10 ${473-lift} l 0 7 M 4 ${474-lift} l 0 6`,mix(INK,sock,0.5),1.8);g.restore();
    };
    if(walk){leg(bx-70,0,true);leg(bx+50,Math.PI,true);}
    g.save();g.translate(bx,330+bob);g.scale(c.bodyWidth/94+(walk?0.35:yaw*0.1),walk?0.68:1);
    const body='M -57 -94 Q -95 -66 -96 -7 L -102 3 L -96 5 Q -107 23 -99 29 L -95 25 Q -115 80 -83 124 Q -56 150 20 140 Q 98 150 103 99 Q 112 60 88 6 L 94 10 L 86 -14 L 91 -10 Q 80 -75 51 -94 Z';
    const bp=shaded(g,body,c.coat,c.shadow);
    g.save();g.clip(bp);
    shape(g,'M -89 -40 Q -25 -91 55 -47 Q 9 -15 -6 59 Q -62 72 -94 49 Z',id==='essie'?c.light:c.light,INK,0);
    if(id==='mocha'){
      for(let i=0;i<4;i++)shape(g,`M ${28+i*8} ${-58+i*40} q 39 0 64 22 l -7 13 q -32 -18 -61 -17 l 9 -9 Z`,c.marking,INK,0);
      line(g,'M -76 50 Q -74 89 -51 108',c.shadow,3);
    }
    // Cream/chest marks are smaller on Essie than on Mocha and Latte.
    const bibScale=id==='essie'?0.37:1;
    g.save();g.translate(yaw*32,-48);g.scale(bibScale*(1-yaw*0.42),bibScale);
    shape(g,'M -57 -20 Q -6 -39 51 -18 L 64 10 L 51 7 L 59 29 L 42 21 L 45 45 L 25 35 L 13 66 L 1 49 L -13 70 L -22 47 L -43 52 L -42 31 L -61 35 L -55 13 L -69 15 Z',c.bib,INK,0);
    g.restore();g.restore();
    // Far haunch has a painted crescent rather than an extra anatomical outline.
    line(g,'M 58 47 Q 88 64 77 106',mix(c.shadow,INK,0.15),3);
    g.restore();
    if(walk){leg(bx-67,Math.PI,false);leg(bx+62,0,false);}
    else {leg(bx+17-yaw*13,0,true);leg(bx-30+yaw*70,Math.PI,false);}
  }
  // Head rotates independently of the torso; expression never changes identity/marking placement.
  const headYaw=clamp(yaw+p.headTurn*sign), headSign=headYaw<0?-1:1;
  const hy=Math.abs(headYaw), face=hy*39;
  g.save();g.translate(hx,204+bob+(walk?35:0));g.rotate(p.headTilt*sign);g.scale(headSign,1);
  const sx=1-hy*0.18;g.scale(sx*c.headWidth/101,1);
  const scared=p.expression==='scared', sad=p.expression==='sad', happy=p.expression==='happy', concern=p.expression==='concerned', surprise=p.expression==='surprised';
  const ear=(x:number,far:boolean)=>{
    const emotion=scared?0.68:sad?0.28:happy?-0.06:0;
    const gesture=far?p.earLeft:p.earRight;
    g.save();g.translate(x,-64);g.rotate((x<0?-1:1)*(emotion+gesture*0.45));g.scale(x>0?-1:1,1);
    const base=id==='latte'?c.marking:c.coat;
    shaded(g,'M -28 24 Q -36 -13 -31 -68 L -22 -59 L -21 -72 Q -9 -63 28 -19 L 29 15 Z',base,id==='latte'?'#3e3032':c.shadow);
    shape(g,'M -21 -48 Q -17 -24 -17 1 L 13 -10 Q -4 -30 -21 -48 Z',c.ear,INK,0);
    line(g,'M -25 -60 l -3 -14 M -18 -56 l -2 -10',base,2.5);
    g.restore();
  };
  ear(-65+hy*43,true);ear(64-hy*20,false);
  const cheek=c.cheek;
  const head=hy>0.86 ? `M -73 -54 Q -32 -85 13 -76 Q 64 -73 76 -35 Q 84 -16 79 -7 L 95 8 Q 111 12 119 25 Q 121 34 103 39 Q 110 53 93 58 Q 68 79 17 78 Q -44 80 -78 54 L -98 54 L -94 41 L -109 39 L -98 24 L -108 20 L -96 7 Q -103 -27 -73 -54 Z` : `M -78 -54 Q -34 -87 19 -76 Q 74 -73 87 -29 Q 94 -8 92 3 L ${94+cheek*0.6} 16 L 96 18 L ${98+cheek*0.5} 32 L 92 33 L 101 47 L 82 45 Q 62 75 13 78 Q -47 80 -78 54 L -102 55 L -96 41 L -116 40 L -101 24 L -115 21 L -97 7 Q -103 -27 -78 -54 Z`;
  const hp=shaded(g,head,c.coat,c.shadow);
  g.save();g.clip(hp);
  shape(g,'M -99 -29 Q -67 -79 -9 -72 Q -46 -33 -56 15 L -87 37 L -109 30 Z',c.light,INK,0);
  if(id==='mocha'){
    g.save();if(hy>0.86){g.translate(20,0);g.scale(0.8,1);}
    // Stable tabby crown M, outer eye bars and cheek stripes.
    const pen=new Pen(g);
    pen.stroke([[-47,-64],[-34,-40],[-17,-56],[0,-32],[15,-57],[29,-43],[42,-66]],7,c.marking);
    shape(g,'M -5 -72 L 3 -48 L 12 -63 L 13 -76 Z',c.marking,INK,0);
    for(const side of [-1,1]){
      g.save();g.scale(side,1);shape(g,'M 69 -22 L 93 -31 L 100 -18 L 77 -12 Z',c.marking,INK,0);
      shape(g,'M 78 11 L 107 4 L 110 14 L 84 24 Z',c.marking,INK,0);
      shape(g,'M 71 37 L 94 31 L 99 40 L 80 48 Z',c.marking,INK,0);g.restore();
    }
    // Irregular narrow white blaze flows into the wide muzzle, not a full white mask.
    shape(g,hy>0.86 ? `M 77 -13 Q 87 5 104 15 L 124 29 Q 120 61 88 62 L 66 45 Q 72 17 77 -13 Z` : `M ${face-11} -34 Q ${face+3} -14 ${face+12} 8 L ${face+35} 41 Q ${face} 69 ${face-34} 41 L ${face-13} 12 Z`,c.muzzle,INK,0);
    g.restore();
  }
  if(id==='latte'){
    // Feather-edged chocolate point on a cream skull. Muzzle remains pale, as in the stills.
    shape(g,`M -63 -36 L -48 -44 L -44 -55 Q -15 -68 ${17+hy*7} -51 L 29 -57 L 35 -44 Q 69 -51 87 -23 L 79 -14 L 91 6 L 83 9 L 89 29 L 76 31 L 77 47 Q 41 69 ${face} 64 Q -37 57 -61 26 L -72 20 L -63 5 L -75 -2 L -64 -16 Z`,c.marking,INK,0);
    shape(g,'M -46 -41 Q -18 -53 6 -47 L -7 -18 Q -34 -9 -54 13 L -62 0 Z','#70594d',INK,0);
  }
  g.restore();
  // Eye spacing and far-eye occlusion implement an actual profile view.
  const eyeY=-2, eyes=[{x:-43+hy*57,scale:1-hy*0.65,far:true},{x:43+hy*19,scale:1-hy*0.16,far:false}];
  for(const e of eyes){
    if(e.far&&hy>0.84)continue;
    const ew=27*e.scale, open=(surprise?1.3:scared?1.12:concern?0.9:sad?0.8:happy?0.75:0.88);
    const eh=20*open*(1-p.blink), ex=e.x;
    if(p.blink>0.93 || happy){
      const curve=happy?-12:5;
      line(g,`M ${ex-ew} ${eyeY+2} Q ${ex} ${eyeY+curve} ${ex+ew} ${eyeY+2}`,INK,3.4);
    } else {
      const eyePath=new Path2D(`M ${ex-ew} ${eyeY} Q ${ex-5} ${eyeY-eh*1.5} ${ex+ew} ${eyeY-2} Q ${ex+6} ${eyeY+eh*1.4} ${ex-ew} ${eyeY} Z`);
      g.save();g.clip(eyePath);ellipse(g,ex,eyeY,ew+1,eh+6,'#f8efd9');
      const ix=ex+p.gazeX*7*sign*headSign+hy*3, iy=eyeY+p.gazeY*5;
      ellipse(g,ix,iy,16*e.scale,22,c.iris);ellipse(g,ix+1,iy,(scared||surprise?9:5)*e.scale,20,INK);
      g.restore();g.strokeStyle=INK;g.lineWidth=3;g.stroke(eyePath);
      line(g,`M ${ex-ew} ${eyeY-1} Q ${ex} ${eyeY-eh*1.5} ${ex+ew} ${eyeY-2}`,INK,4);
    }
    // Eyebrows stay close to the eyes, but read clearly even on Essie's black coat.
    const inner=ex<face?1:-1, browY=eyeY-(surprise?40:scared?34:29);
    const lift=sad||concern?-10:0;
    line(g,`M ${ex-ew*0.7} ${browY+(inner>0?0:lift)} Q ${ex} ${browY-4} ${ex+ew*0.7} ${browY+(inner>0?lift:0)}`,id==='essie'?'#85818c':id==='latte'?'#ac8d77':c.marking,3);
  }
  // Muzzle pair shifts forward and compresses on the far side in profile.
  const my=36+(surprise?2:0), mx=hy>0.86?98:face+hy*16;
  if(id!=='essie'){
    ellipse(g,mx-14*(1-hy*0.5),my,24*(1-hy*0.5),20,c.muzzle);
    ellipse(g,mx+14,my,25,20,c.muzzle);
    shape(g,`M ${mx-19} 48 Q ${mx} 66 ${mx+21} 49 Q ${mx} 77 ${mx-19} 48 Z`,c.muzzle,INK,0);
  }else{
    // Tiny asymmetric chin flash, dark nose bridge and muzzle; never a tuxedo mask.
    shape(g,`M ${mx-23} 49 Q ${mx-6} 54 ${mx+1} 49 Q ${mx+12} 53 ${mx+22} 47 L ${mx+15} 59 L ${mx+4} 61 L ${mx-2} 65 L ${mx-10} 60 L ${mx-22} 60 Z`,c.muzzle,INK,0);
  }
  shape(g,`M ${mx-10} ${my-12} Q ${mx} ${my-17} ${mx+11} ${my-12} Q ${mx+8} ${my-3} ${mx} ${my} Q ${mx-8} ${my-4} ${mx-10} ${my-12} Z`,c.nose,INK,2);
  line(g,`M ${mx} ${my} L ${mx} ${my+7}`,INK,2.2);
  if(surprise||scared){ellipse(g,mx,my+18,surprise?8:12,surprise?12:10,'#56383e',2);}
  else if(sad||concern){line(g,`M ${mx-14} ${my+17} Q ${mx} ${my+6} ${mx+14} ${my+17}`,INK,2.4);}
  else{
    line(g,`M ${mx-17} ${my+7} Q ${mx-8} ${my+19} ${mx} ${my+7} Q ${mx+9} ${my+19} ${mx+18} ${my+6}`,INK,2.3);
    if(happy)shape(g,`M ${mx-10} ${my+13} Q ${mx} ${my+20} ${mx+10} ${my+13} Q ${mx} ${my+34} ${mx-10} ${my+13} Z`,'#98646b',INK,1.8);
  }
  // Whiskers have no source imagery: three deliberate curves, cream on dark, slate on light.
  const whisker=id==='essie'?'#e4ddcf':mix(INK,c.muzzle,0.48);
  for(const side of [-1,1]){
    if(side<0&&hy>0.84)continue;
    const k=side<0?1-hy*0.65:1;
    for(let i=0;i<3;i++)line(g,`M ${mx+side*22*k} ${my+1+i*6} Q ${mx+side*57*k} ${my-13+i*17} ${mx+side*(88-i*4)*k} ${my-12+i*20}`,whisker,1.6);
    for(let i=0;i<3;i++)ellipse(g,mx+side*(24+i%2*5)*k,my-2+Math.floor(i/2)*7,1.2,1.2,whisker);
  }
  line(g,'M -74 37 l -9 6 M -80 18 l -10 3',id==='essie'?c.light:c.shadow,2);
  g.restore();g.restore();
}
