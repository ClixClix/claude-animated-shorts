import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cat} from './Cat';
import {CAT_IDS, CatId, DESIGNS} from './designs';
import {CatExpression, EXPRESSIONS, VIEW_YAW, CatView} from './pose';
const ink='#302d3a', muted='#797579', paper='#f7f1e6', rule='#dcd3c4';
const VIEWS:CatView[]=['front','side','three-quarter'];
const title=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
const Frame:React.FC<{title:string;subtitle:string;children:React.ReactNode;footer:string}>=p=>(
  <AbsoluteFill style={{background:paper,color:ink,fontFamily:'Arial, sans-serif',padding:'58px 72px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',borderBottom:`2px solid ${rule}`,paddingBottom:23}}>
      <div><div style={{fontSize:16,letterSpacing:4,color:muted,marginBottom:12}}>WHAT IF CATS / CHARACTER DEVELOPMENT</div>
      <div style={{fontSize:49,fontWeight:700,letterSpacing:-1}}>{p.title}</div></div>
      <div style={{fontSize:17,color:muted,letterSpacing:2}}>DESIGN STUDY 01</div>
    </div>
    <div style={{fontSize:22,color:muted,marginTop:21}}>{p.subtitle}</div>
    {p.children}
    <div style={{position:'absolute',bottom:36,left:72,right:72,borderTop:`1px solid ${rule}`,paddingTop:18,fontSize:16,color:muted,display:'flex',justifyContent:'space-between'}}><span>{p.footer}</span><span>ORIGINAL CANVAS ART · REMOTION STILL</span></div>
  </AbsoluteFill>
);
const Shadow:React.FC<{top?:number;width?:number}>=({top=481,width=195})=><div style={{position:'absolute',top,left:'50%',transform:'translateX(-50%)',width,height:17,borderRadius:'50%',background:'#d4cbbb',opacity:0.55}}/>;
const PALETTE:React.FC<{id:CatId}>=({id})=>{
 const c=DESIGNS[id];return <div style={{display:'flex',gap:9,justifyContent:'center',marginTop:14}}>{[c.coat,c.light,c.marking,c.bib,c.iris].map((x,i)=><div key={i} style={{width:25,height:25,borderRadius:'50%',background:x,border:'1px solid #b8ae9e'}}/>)}</div>;
};
export const TurnaroundSheet:React.FC<{cat:CatId}>=({cat})=><Frame title={DESIGNS[cat].name} subtitle={DESIGNS[cat].description} footer="Front / side / three-quarter · side markings interpreted where unseen · pending visual approval">
  <div style={{display:'flex',gap:20,marginTop:51}}>{VIEWS.map((view,i)=><div key={view} style={{flex:1,position:'relative',textAlign:'center'}}>
    <div style={{fontSize:14,color:muted,letterSpacing:3}}>{String(i+1).padStart(2,'0')} / {view.toUpperCase()}</div>
    <div style={{position:'relative',height:602,marginTop:25,display:'flex',justifyContent:'center',alignItems:'flex-start'}}>
      <div style={{position:'absolute',left:0,right:0,top:526,borderTop:`1px solid ${rule}`}}/>
      <Shadow top={520}/><Cat id={cat} pose={{yaw:VIEW_YAW[view]}} width={540} height={594}/>
    </div><PALETTE id={cat}/>
  </div>)}</div>
</Frame>;
const exprPose=(expression:CatExpression)=>({expression,yaw:0,headTilt:expression==='concerned'?-0.10:expression==='sad'?0.06:0,
  gazeX:expression==='concerned'?-0.35:0,gazeY:expression==='sad'?0.3:0,
  earLeft:expression==='surprised'?-0.15:0,earRight:expression==='concerned'?0.18:0});
export const ExpressionSheet:React.FC=()=><Frame title="One cast. Six expressions." subtitle="Mocha / Essie / Latte — the same face rig, with each cat’s own markings and silhouette." footer="Neutral · happy · sad · scared · surprised · concerned — static expression keys, pending approval">
  <div style={{display:'grid',gridTemplateColumns:'170px repeat(6, 1fr)',marginTop:33}}>
    <div/>{EXPRESSIONS.map(e=><div key={e} style={{textAlign:'center',fontSize:17,letterSpacing:2,color:muted,paddingBottom:18}}>{e.toUpperCase()}</div>)}
    {CAT_IDS.map((id,row)=><React.Fragment key={id}><div style={{paddingTop:102,fontSize:25,fontWeight:700,borderTop:`1px solid ${rule}`}}>{DESIGNS[id].name}<div style={{fontSize:13,fontWeight:400,color:muted,marginTop:9}}>0{row+1}</div></div>
      {EXPRESSIONS.map(e=><div key={e} style={{height:290,position:'relative',overflow:'hidden',borderTop:`1px solid ${rule}`}}>
        <div style={{position:'absolute',left:'50%',top:-48,transform:'translateX(-50%)'}}><Cat id={id} pose={exprPose(e)} headOnly width={450} height={495}/></div>
      </div>)}
    </React.Fragment>)}
  </div>
</Frame>;
export const CastSheet:React.FC=()=><Frame title="Meet Mocha, Essie & Latte" subtitle="Turnaround lineup / shared scale, upper-left light, warm paper and plum ink." footer="Design study 01 · interpreted side views · pending visual approval">
  <div style={{display:'grid',gridTemplateColumns:'190px repeat(3,1fr)',marginTop:22}}>
    <div/>{VIEWS.map(v=><div key={v} style={{textAlign:'center',fontSize:15,letterSpacing:2,color:muted}}>{v.toUpperCase()}</div>)}
    {CAT_IDS.map(id=><React.Fragment key={id}><div style={{fontSize:26,fontWeight:700,paddingTop:100,borderTop:`1px solid ${rule}`}}>{DESIGNS[id].name}</div>{VIEWS.map(view=><div key={view} style={{height:284,display:'flex',justifyContent:'center',position:'relative',borderTop:`1px solid ${rule}`}}>
      <Shadow top={250} width={100}/><Cat id={id} pose={{yaw:VIEW_YAW[view]}} width={260} height={286}/>
    </div>)}</React.Fragment>)}
  </div>
</Frame>;
