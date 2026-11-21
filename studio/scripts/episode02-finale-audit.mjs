/** Active director revision, actual narration edit and real box transforms.
 * Numerical actor-root/head probes only; never painted-silhouette or visual approval.
 */
import {studioRoot} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import * as T from 'three';
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02/series-style-qa');await fs.mkdir(out,{recursive:true});
const file=path.join(out,'episode02-finale-audit-bundle.mjs');
await build({stdin:{resolveDir:studioRoot,loader:'ts',contents:[
 "export {stateAt} from './src/v2/episodes/in-this-town-02/timeline';",
 "export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector';",
 "export {createEpisodeBox,BOX_SPECS} from './src/v2/episodes/in-this-town-02/boxProps';",
 "export {stageEpisodeBox} from './src/v2/episodes/in-this-town-02/boxStaging';",
 "export {catBehaviorFor} from './src/v2/episodes/in-this-town-02/catBehaviors';",
].join('\n')},outfile:file,bundle:true,platform:'node',format:'esm',external:['three']});
const {stateAt,directEpisodeCamera,createEpisodeBox,BOX_SPECS,stageEpisodeBox,catBehaviorFor}=await import(pathToFileURL(file).href);
const props=JSON.parse(await fs.readFile(path.join(studioRoot,'out/v2-episodes/in-this-town-02/render-props.json'),'utf8'));
if(props.audioApproved!==true)throw Error('Finale QA requires the existing approved narration edit; no scratch substitution.');
const shots=props.shots,at=f=>stateAt(f,shots,props.captions);
const group=n=>shots.filter(s=>s.sequence===n),first=n=>group(n)[0].start,last=n=>group(n).at(-1).end-1;
const state=(n,u)=>at(first(n)+Math.round((last(n)-first(n))*u));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const checks=[],issues=[];
const record=(id,passed,data)=>{const result={id,passed:!!passed,...(data===undefined?{}:{data})};checks.push(result);if(!passed)issues.push(result);};
record('all-60-narrated-beats-present',new Set(shots.map(s=>s.sequence)).size===60&&shots[0].sequence===1&&shots.at(-1).sequence===60);
record('actual-edit-contiguous',shots.every((s,i)=>Number.isInteger(s.start)&&Number.isInteger(s.end)&&s.start===(i?shots[i-1].end:0)&&s.end>s.start));
record('segment-ids-unique',new Set(shots.map(s=>s.id)).size===shots.length);
const settled=state(60,1),end59=state(59,1),start60=state(60,0),spec=BOX_SPECS.shared;
record('shared-box-real-cafe-size',spec.width>=2.3&&spec.width<=2.7&&spec.depth<=1.5&&spec.height<=.60);
record('all-three-end-characters-visible',['mocha','essie','latte'].every(id=>settled[id].visible));
record('shot59-to60-position-no-teleport',distance(end59.mocha.position,start60.mocha.position)<.03);
record('shot59-to60-scale-no-pop',end59.mocha.scale===start60.mocha.scale);
const c59=directEpisodeCamera(end59),c60=directEpisodeCamera(start60);
record('shot59-to60-camera-continuity',distance(c59.camera,c60.camera)+distance(c59.target,c60.target)+Math.abs(c59.fov-c60.fov)<.05);
record('shared-box-actually-dragged-to-window',distance(state(59,0).sharedBox,end59.sharedBox)>1&&distance(end59.sharedBox,spec.home)<.01);
record('shared-box-drag-uses-mouth',Array.from({length:9},(_,i)=>catBehaviorFor(state(59,i/8),'mocha')).every(b=>b?.mode==='mouth-carry'));
record('shot58-pushes-ordinary-box',state(58,1).room==='cafe'&&distance(state(58,.5).demoBox,state(58,1).demoBox)>.10&&!state(58,1).show.shared);
record('shot49-to50-landing-continuity',distance(state(49,1).mocha.position,state(50,0).mocha.position)<.03);
record('shot50-to51-rescue-continuity',['mocha','essie'].every(id=>distance(state(50,1)[id].position,state(51,0)[id].position)<.03));
record('shot51-to52-landing-continuity',['mocha','essie'].every(id=>distance(state(51,1)[id].position,state(52,0)[id].position)<.03));
record('shot54-to55-no-pre-impact-teleport',distance(state(54,1).mocha.position,state(55,0).mocha.position)<.03);
const problems={numeric:[],scale:[],shared:[],rootFits:[],framing:[],entryWalls:[],carriedFloor:[],shell:[],alley:[],rescuePresence:[],order:[]};
const apex={mocha:0,essie:0,latte:0};
const boxes={essie:createEpisodeBox('essie'),shared:createEpisodeBox('shared')};
function walls(box){return ['front','back','left','right'].map(side=>box.root.getObjectByName(box.spec.id+'-'+side));}
function wallHits(box,from,to){
 const a=new T.Vector3(...from),delta=new T.Vector3(...to).sub(a),length=delta.length();
 if(length<1e-8)return false;
 return new T.Raycaster(a,delta.normalize(),.0001,length).intersectObjects(walls(box),false).length>0;
}
for(const shot of shots)for(let f=shot.start;f<shot.end;f++){
 const s=at(f),n=s.shot.sequence,c=directEpisodeCamera(s);
 if([...c.camera,...c.target,c.fov,...['mocha','essie','latte'].flatMap(id=>s[id].position)].some(x=>!Number.isFinite(x))||c.fov<15||c.fov>115)problems.numeric.push({f,n});
 for(const id of ['mocha','essie','latte']){
  if(s[id].scale!==1||s[id].position[1]<-.001)problems.scale.push({f,id,pose:s[id]});
  if(n>=31&&n<=52&&s.room==='alley'&&s[id].visible&&['mocha','essie'].includes(id)&&Math.abs(s[id].position[0]+18)>1.5)problems.alley.push({f,id,position:s[id].position});
 }
 if(s.rescued.essie!==(n>=51)||s.rescued.latte!==(n>=55))problems.order.push({f,n});
 if([53,54,55].includes(n)&&!s.essie.visible)problems.rescuePresence.push({f,n});
 if(n===50&&(Math.abs(s.mocha.position[2]-s.essieBox[2])>BOX_SPECS.essie.depth/2||s.mocha.position[1]<.04))problems.rootFits.push({f,reason:'Mocha leaves carton before reformation'});
 if(n>=59){
  if(!s.show.shared||s.show.latte||s.show.essie||s.show.demo)problems.shared.push({f,n});
  const b=boxes.shared;stageEpisodeBox(b,'shared',s);b.root.updateMatrixWorld(true);
  if(n===60)for(const id of ['mocha','essie','latte']){
   const p=s[id].position;apex[id]=Math.max(apex[id],p[1]);
   if(f>first(60)&&wallHits(b,at(f-1)[id].position,p))problems.entryWalls.push({f,id,kind:'shared'});
   if(s.u>=.86){
    const [x,y,z]=p,[bx,,bz]=s.sharedBox;
    if(Math.abs(x-bx)>spec.width/2-.03||Math.abs(z-bz)>spec.depth/2-.03||y<.04||y>.10)problems.rootFits.push({f,id,p});
    const camera=new T.PerspectiveCamera(c.fov,9/16,.08,320);camera.position.set(...c.camera);camera.lookAt(...c.target);camera.updateMatrixWorld(true);
    const right=new T.Vector3(c.camera[2]-z,0,-(c.camera[0]-x)).normalize();
    for(const dx of [-.24,.24])for(const dy of [.70,1.20]){
     const q=new T.Vector3(x,y+dy,z).addScaledVector(right,dx).project(camera);
     if(Math.abs(q.x)>.99||Math.abs(q.y)>.97||q.z>1)problems.framing.push({f,id,probe:q.toArray()});
    }
   }
  }
 }
 if([49,51,52].includes(n)){
  const b=boxes.essie;stageEpisodeBox(b,'essie',s);b.root.updateMatrixWorld(true);
  for(const wall of walls(b))if(!wall.visible||wall.scale.toArray().some(v=>v!==1))problems.shell.push({f,wall:wall.name});
  if(new T.Box3().setFromObject(b.root).min.y<-.01)problems.shell.push({f,reason:'shell below ground'});
  if(n===49&&f>first(49)&&wallHits(b,at(f-1).mocha.position,s.mocha.position))problems.entryWalls.push({f,id:'mocha',kind:'essie'});
  if(n===51&&s.u<=.62)for(const id of ['mocha','essie']){
   const local=new T.Vector3(...s[id].position).applyMatrix4(b.root.matrixWorld.clone().invert());
   if(Math.abs(local.y-.055)>.015)problems.carriedFloor.push({f,id,local:local.toArray()});
  }
 }
}
record('all-frames-finite-camera-and-poses',problems.numeric.length===0,problems.numeric.slice(0,5));
record('original-living-cat-scale-and-floor-preserved',problems.scale.length===0,problems.scale.slice(0,5));
record('one-shared-carton-only-in-finale',problems.shared.length===0,problems.shared.slice(0,5));
record('settled-actor-roots-inside-carton',problems.rootFits.length===0,problems.rootFits.slice(0,5));
record('all-three-physically-jump',['mocha','essie','latte'].every(id=>apex[id]>.65),apex);
record('final-head-probes-in-portrait-frame',problems.framing.length===0,problems.framing.slice(0,5));
record('entry-foot-roots-clear-real-walls',problems.entryWalls.length===0,problems.entryWalls.slice(0,5));
record('rescue-feet-follow-tipping-floor',problems.carriedFloor.length===0,problems.carriedFloor.slice(0,5));
record('complete-shell-grounded',problems.shell.length===0,problems.shell.slice(0,5));
record('alley-actor-roots-clear-sidewalls',problems.alley.length===0,problems.alley.slice(0,5));
record('essie-present-through-latte-rescue',problems.rescuePresence.length===0,problems.rescuePresence.slice(0,5));
record('rescue-order-preserved',problems.order.length===0,problems.order.slice(0,5));
const source=await fs.readFile(path.join(studioRoot,'src/v2/episodes/in-this-town-02/Episode.tsx'),'utf8');
record('original-ep1-performers-active',['mocha','essie','latte'].every(id=>source.includes("createEpisode1CastCat('"+id+"')")));
record('no-human-reaching-arms',!source.includes('pawRig(')&&!source.includes('gesture('));
Object.values(boxes).forEach(b=>b.dispose());
const report={stage:issues.length?'FINALE_NUMERICAL_QA_FAILED':'FINALE_NUMERICAL_QA_PASSED_VISUAL_REVIEW_REQUIRED',mathematicalChecks:checks.length,failures:issues,checks,
 edit:{segments:shots.length,beats:60,frames:shots.at(-1).end,source:'LIVE_APPROVED_RENDER_PROPS'},visualComparisonMade:false,finalCreativeApproval:false,publishingAllowed:false,
 note:'Real box transforms, actor-root sweeps and head probes; not full painted-body collision or image/motion approval.'};
const reportFile=path.join(out,'EP2_FINALE_NUMERICAL_AUDIT.json');await fs.writeFile(reportFile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage:report.stage,mathematicalChecks:checks.length,failedChecks:issues.map(i=>i.id),report:reportFile},null,2));if(issues.length)process.exitCode=2;
