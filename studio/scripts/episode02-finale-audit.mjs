/**
 * Real-source Episode 02 shot 58/59/60 geometry, continuity and 9:16 checks.
 * IMPORTANT: uses the ACTUAL TypeScript stateAt() + directEpisodeCamera(),
 * bundled with the same esbuild TS bundler as our other verified tests; no duplicate
 * pose formulas. No browser, paid voice, rendered video, mutations, or uploads.
 * This proves numerical staging only. Visual/acting quality is NOT certified.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {studioRoot} from './lib/runtime.mjs';
// Use the same tested esbuild TypeScript pipeline as episode02-box-tests,
// rather than a hand-written CommonJS import/eval shim. The generated file
// contains the REAL timeline/camera/box modules, not duplicate pose formulas.
const outputDir=path.join(studioRoot,'out/v2-episodes/in-this-town-02/series-style-qa');
const src=path.join(studioRoot,'src/v2/episodes/in-this-town-02');
await fs.mkdir(outputDir,{recursive:true});
const bundlePath=path.join(outputDir,'episode02-finale-audit-bundle.mjs');
await build({
 stdin:{
  resolveDir:studioRoot,loader:'ts',
  contents:[
   "export {SCRATCH_EDIT,stateAt,HOME} from './src/v2/episodes/in-this-town-02/timeline.ts';",
   "export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector.ts';",
   "export {BOX_SPECS} from './src/v2/episodes/in-this-town-02/boxProps.ts';"
  ].join('\n')
 },
 outfile:bundlePath,bundle:true,platform:'node',format:'esm',target:'node24',
 external:['three']
});
const {SCRATCH_EDIT,stateAt:actualStateAt,HOME,directEpisodeCamera,BOX_SPECS}=
 await import(pathToFileURL(bundlePath).href);
const timeline={SCRATCH_EDIT,stateAt:actualStateAt,HOME};
const cameraDirector={directEpisodeCamera};
const boxes=BOX_SPECS;
const shots=timeline.SCRATCH_EDIT.shots;
const begin=n=>shots.find(x=>x.sequence===n);
const state=(n,u)=>{const s=begin(n);if(!s)throw Error('Missing shot '+n);
 return timeline.stateAt(s.start+Math.round((s.end-s.start-1)*u),shots);
};
const vecSub=(a,b)=>a.map((v,i)=>v-b[i]);
const norm=a=>{const length=Math.hypot(...a)||1;return a.map(v=>v/length)};
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function projected(x,cam,target,fov){
 const front=norm(vecSub(target,cam)),right=norm(cross(front,[0,1,0])),
  up=cross(right,front),delta=vecSub(x,cam),depth=dot(delta,front),
  tangent=Math.tan(fov*Math.PI/360);
 return {x:dot(delta,right)/(depth*tangent*1080/1920),
  y:dot(delta,up)/(depth*tangent),depth};
}
const catFace=(cat,cam)=>{
 const [x,y,z]=cat.position,scale=cat.scale;
 const mid=[x,y+.66*scale,z];
 const p=projected(mid,cam.camera,cam.target,cam.fov);
 const halfX=.67*scale/(p.depth*Math.tan(cam.fov*Math.PI/360)*1080/1920);
 const halfY=.72*scale/(p.depth*Math.tan(cam.fov*Math.PI/360));
 return {...p,halfX,halfY,fullyVisible:p.depth>0&&
  p.x-halfX>-.99&&p.x+halfX<.99&&p.y-halfY>-.98&&p.y+halfY<.98};
}
const issues=[],checks=[];
const record=(id,ok,data)=>{checks.push({id,passed:!!ok,...(data===undefined?{}:{data})});
 if(!ok)issues.push({id,data})};
const spec=boxes.shared,first=state(58,1),start=state(59,0),
 last=state(59,1),final=state(60,0);
const change=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
record('shot58-to59-directed-street-to-cafe-cut',first.room==='street'&&start.room==='cafe',
 {fromRoom:first.room,toRoom:start.room,from:first.mocha.position,to:start.mocha.position});
record('shot59-to60-position-no-teleport',change(last.mocha.position,final.mocha.position)<.03,
 {from:last.mocha.position,to:final.mocha.position});
record('shot58-to59-scale-change-only-on-location-cut',first.room!==start.room,
 {from:first.mocha.scale,to:start.mocha.scale});
record('shot59-to60-scale-no-pop',Math.abs(last.mocha.scale-final.mocha.scale)<.03);
record('shared-box-same-cafe-floor',spec.home[0]===timeline.HOME.shared[0]&&
 spec.home[2]===timeline.HOME.shared[2],{boxHome:spec.home,sceneHome:timeline.HOME.shared});
const finalCatScale=(final.mocha.scale+final.essie.scale+final.latte.scale)/3;
const nativeEpisode01CatHeight=1.52; // The original createEpisodeCat artwork height.
const widthPerVisibleCatHeight=spec.width/(nativeEpisode01CatHeight*finalCatScale);
record('finale-cat-not-miniature-relative-to-box',
 widthPerVisibleCatHeight>=1.8&&widthPerVisibleCatHeight<=2.2,
 {boxWidth:spec.width,boxDepth:spec.depth,finalCatScale,
  nativeEpisode01CatHeight,widthPerVisibleCatHeight});
const cam58=cameraDirector.directEpisodeCamera(first);
const cam59=cameraDirector.directEpisodeCamera(start);
const cam60=cameraDirector.directEpisodeCamera(final);
const cam59End=cameraDirector.directEpisodeCamera(last);
const pitch=Math.atan2(cam58.camera[1]-cam58.target[1],
 Math.hypot(cam58.camera[0]-cam58.target[0],cam58.camera[2]-cam58.target[2]))*180/Math.PI;
record('shot58-front-three-quarter-not-overhead',pitch>=15&&pitch<=30,{pitchDegrees:pitch,camera:cam58.camera});
const lensDelta=(a,b)=>change(a.camera,b.camera)+change(a.target,b.target)+Math.abs(a.fov-b.fov);
record('shot58-to59-motivated-location-cut',first.room==='street'&&start.room==='cafe',
 {from:cam58,to:cam59});
record('shot59-to60-camera-continuity',lensDelta(cam59End,cam60)<.05,
 {from:cam59End,to:cam60});

const left=timeline.HOME.shared[0]-spec.width/2,right=left+spec.width;
const front=timeline.HOME.shared[2]+spec.depth/2,back=front-spec.depth;
const rim=spec.height+.04;
let badJumpFrames=[],badCatFrames=[],finalFraming=[],airborneFraming=[];
for(let n=58;n<=60;n++){
 const shot=begin(n);
 for(let frame=shot.start;frame<shot.end;frame++){
  const s=timeline.stateAt(frame,shots);
  const cam=cameraDirector.directEpisodeCamera(s);
  if(n>=59){
   if(!s.show.shared||s.show.latte||s.show.essie)
    badCatFrames.push({frame,reason:'wrong box identity'});
  }
  if(n===59){
   const cat=s.mocha,half=.67*cat.scale;
   // Check near sidewall crossing only: the correctly staged entrance
   // goes over the left rim; once x is INSIDE the box, descent is legal.
   if(cat.position[0]<left&&cat.position[0]+half>left&&
      cat.position[1]<rim+.015){
    badJumpFrames.push({frame,x:cat.position[0],y:cat.position[1],half,left,rim});
   }
   // After takeoff, both ears/body must remain in a usable portrait frame.
   // A prior locked camera made the entire jump happen off the left edge.
   if(s.u>=.24&&s.u<=.74){
    const f=catFace(cat,cam);
    if(!f.fullyVisible)airborneFraming.push({frame,u:s.u,face:f});
   }
  }
  if(n===60){
   const all=['mocha','essie','latte'].map(name=>{
    const c=s[name],half=.67*c.scale;
    const boxFits=c.visible&&c.position[0]-half>=left-.01&&
      c.position[0]+half<=right+.01&&
      c.position[2]>=back-.01&&c.position[2]<=front+.01&&
      c.position[1]>=0&&c.position[1]<=.25;
    const face=catFace(c,cam);
    if(!boxFits)badCatFrames.push({frame,name,position:c.position,scale:c.scale,reason:'cat not physically in shared box'});
    if(!face.fullyVisible)finalFraming.push({frame,name,face,reason:'end-frame cat cropped'});
    return{name,boxFits,faceVisible:face.fullyVisible};
   });
  }
 }
}
record('no-premature-left-wall-crossover',badJumpFrames.length===0,badJumpFrames.slice(0,10));
record('entire-airborne-cat-visible',airborneFraming.length===0,airborneFraming.slice(0,10));
record('only-one-final-shared-box-and-physical-cats',badCatFrames.length===0,badCatFrames.slice(0,10));
record('all-end-shot-cats-in-portrait-frame',finalFraming.length===0,finalFraming.slice(0,10));
record('all-three-end-characters-visible',["mocha","essie","latte"].every(id=>final[id].visible));
record('shot58-is-street-walk-not-shared-box',first.room==='street'&&!first.show.shared&&first.mocha.walking);
// Every real Episode02 timeline frame should have finite actor/camera state.
 // A single numeric invalidity can produce a black render or a camera jump.
const timelineFailures=[],shotIds=new Set();
const alleyFacadeCollisions=[],alleyBoxWallCrossings=[],alleyRescueExitCrossings=[],mochaTooEarlyExit=[],missingEssieDuringLatteRescue=[];
for(const shot of shots){
 shotIds.add(shot.sequence);
 if(shot.end<=shot.start||shot.start<0||!Number.isInteger(shot.start)||
    !Number.isInteger(shot.end))timelineFailures.push({shot:shot.sequence,reason:'invalid frame interval'});
 for(let frame=shot.start;frame<shot.end;frame++){
  const state=timeline.stateAt(frame,shots);
  if(shot.sequence>=31&&shot.sequence<=52&&state.room!=='cafe'){
   // Physical west shop facade X=-8.35; original Episode01 cat half-width .67m.
   for(const id of ['mocha','essie']){
    const cat=state[id],right=cat.position[0]+.67*cat.scale;
    if(cat.visible&&right> -8.40)
     alleyFacadeCollisions.push({frame,shot:shot.sequence,id,x:cat.position[0],right});
   }
   if(shot.sequence===49||shot.sequence===50){
    const front=timeline.HOME.alleyBox[2]+boxes.essie.depth/2;
    if(Math.abs(state.mocha.position[2]-front)<.10&&
       state.mocha.position[1]<boxes.essie.height+.04)
     alleyBoxWallCrossings.push({frame,shot:shot.sequence,position:state.mocha.position,front});
   }
   if(shot.sequence===50&&
      Math.abs(state.mocha.position[2]-timeline.HOME.alleyBox[2])>
        boxes.essie.depth*.5)
    mochaTooEarlyExit.push({frame,shot:50,position:state.mocha.position});
   if(shot.sequence===51){
    const front=timeline.HOME.alleyBox[2]+boxes.essie.depth/2;
    for(const id of ['mocha','essie']){
     const cat=state[id];
     if(Math.abs(cat.position[2]-front)<.10&&
        cat.position[1]<boxes.essie.height+.04)
      alleyRescueExitCrossings.push({frame,shot:51,id,
       position:cat.position,front});
    }
   }
  }
  if([53,54,55].includes(shot.sequence)&&!state.essie.visible)
   missingEssieDuringLatteRescue.push({frame,shot:shot.sequence});
  if(state.shot.sequence!==shot.sequence){
   timelineFailures.push({frame,reason:'wrong shot lookup'});continue;
  }
  const cam=cameraDirector.directEpisodeCamera(state);
  const arr=[...cam.camera,...cam.target,cam.fov,
   ...state.mocha.position,...state.essie.position,...state.latte.position,
   ...state.demoCat.position,...state.latteBox,...state.essieBox,
   ...state.sharedBox,...state.demoBox,
   state.mocha.scale,state.essie.scale,state.latte.scale,state.demoCat.scale];
  if(arr.some(x=>!Number.isFinite(x))||cam.fov<15||cam.fov>115)
   timelineFailures.push({frame,shot:shot.sequence,reason:'invalid numeric pose or lens'});
  if(state.rescued.essie!== (shot.sequence>=51)||
     state.rescued.latte!== (shot.sequence>=55))
   timelineFailures.push({frame,reason:'rescue order invalid'});
  if(shot.sequence>=59&&(!state.show.shared||state.show.latte||state.show.essie))
   timelineFailures.push({frame,reason:'final boxes overlap'});
 }
}
record('alley-cats-clear-permanent-shop-facade',alleyFacadeCollisions.length===0,
 alleyFacadeCollisions.slice(0,12));
record('alley-rescue-clears-physical-box-rim',alleyBoxWallCrossings.length===0,
 alleyBoxWallCrossings.slice(0,12));
record('mocha-remains-in-essie-box-during-reformation',
 mochaTooEarlyExit.length===0,mochaTooEarlyExit.slice(0,12));
record('rescued-cats-step-over-cardboard-rim',
 alleyRescueExitCrossings.length===0,alleyRescueExitCrossings.slice(0,12));
record('essie-present-during-latte-rescue',missingEssieDuringLatteRescue.length===0,
 missingEssieDuringLatteRescue.slice(0,12));
record('all-60-shot-ids-present',shots.length===60&&shotIds.size===60&&
 Math.min(...shotIds)===1&&Math.max(...shotIds)===60);
record('all-frames-timing-and-poses-finite',timelineFailures.length===0,
 timelineFailures.slice(0,14));
const source=await fs.readFile(path.join(src,'Episode.tsx'),'utf8');
record('original-ep1-performer-active',["mocha","essie","latte"].every(id=>
 source.includes("createEpisode1CastCat('"+id+"')"))&&!source.includes('createArticulatedGuest('));
record('no-human-reaching-arms',!source.includes('pawRig(')&&!source.includes('gesture('));
const failed=issues.length>0;
const report={
 stage:failed?'FINALE_NUMERICAL_QA_FAILED':'FINALE_NUMERICAL_QA_PASSED_VISUAL_REVIEW_REQUIRED',
 mathematicalChecks:checks.length,failures:issues,checks,
 source:shots.filter(x=>x.sequence>=58).map(x=>({shot:x.sequence,start:x.start,end:x.end})),
 reference:'Episode 01 The Door at 11:11',
 visualComparisonMade:false,finalCreativeApproval:false,publishingAllowed:false,
 note:'Not a render or visual approval; frame-scale/collider/pose math only. Actual moving frames must be reviewed.'
};
const dir=path.join(studioRoot,'out/v2-episodes/in-this-town-02/series-style-qa');
await fs.mkdir(dir,{recursive:true});
const out=path.join(dir,'EP2_FINALE_NUMERICAL_AUDIT.json');
await fs.writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage:report.stage,mathematicalChecks:checks.length,
 failedChecks:issues.map(x=>x.id),report:out},null,2));
if(failed)process.exitCode=2;
