import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {build} from 'esbuild';import assert from 'node:assert/strict';
const scene=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),studio=path.resolve(scene,'../../../..'),out=path.join(studio,'out/v2-episodes/in-this-town-02');
const file=path.join(out,'story-direction-test-bundle.mjs');await fs.mkdir(out,{recursive:true});
await build({stdin:{contents:"export {stateAt} from './src/v2/episodes/in-this-town-02/timeline';export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector';",resolveDir:studio,loader:'ts'},outfile:file,bundle:true,platform:'node',format:'esm',external:['three']});
const {stateAt,directEpisodeCamera}=await import(pathToFileURL(file).href);
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));const {shots,captions}=props;
checkInputs(props);
function checkInputs(p){
 assert.equal(p.audioApproved,true,'Use the existing approved narration edit');
 assert.equal(new Set(p.shots.map(s=>s.sequence)).size,60,'Missing narrated beat');
 assert(p.captions?.length>300,'Actual spoken word timings required');
}
const at=(n,u)=>{const group=shots.filter(s=>s.sequence===n),first=group[0],last=group.at(-1);return stateAt(first.start+Math.round((last.end-first.start-1)*u),shots,captions);};
let checks=0;const check=(c,m)=>{assert(c,m);checks++;};
for(const shot of shots)for(let f=shot.start;f<shot.end;f++){
 const s=stateAt(f,shots,captions),c=directEpisodeCamera(s);
 check([...c.camera,...c.target,c.fov,...s.mocha.position,...s.essie.position,...s.latte.position].every(Number.isFinite),'Invalid state at '+f);
 check(c.fov>=15&&c.fov<=115,'Unusable lens at '+f);
 for(const id of ['mocha','essie','latte']){check(s[id].scale===1,'Living cat scale changes: '+id+' '+f);check(s[id].position[1]>=-.001,'Actor below ground: '+id+' '+f);}
}
check(at(4,1).mocha.position[0]-at(4,0).mocha.position[0]>5,'Street run too short');
for(const n of [9,10,11,12,13,14,25,26])check(!at(n,.5).mocha.visible,'POV actor visible in own shot '+n);
for(const id of ['mocha','essie','latte'])check(at(60,1)[id].visible,'Missing end character '+id);
check(at(8,.4).story.cafeDoor<-1,'Door did not open before entry');
check(at(8,1).mocha.position[2]<4.2,'Mocha never enters cafe');
check(at(16,.25).story.food&&at(16,.8).story.food[1]<.15,'Food never deposited');
check(at(16,.75).story.shake>0,'Box shake missing');
check(at(17,.9).mocha.emotion==='sad','Nothing worked has no sad reaction');
check(!at(21,.5).mocha.visible&&at(21,.5).essie.emotion==='concerned','Confused Essie reaction is obstructed');
check(at(23,.5).essie.position[2]<-1,'Essie not on cafe bed');
check(at(24,.7).story.light===0,'Closing lights do not switch off');
check(at(31,.5).mocha.position[2]-at(31,.5).essieBox[2]>10,'No distance across road');
check(at(36,0).mocha.position[2]-at(36,1).mocha.position[2]>10,'Alley run is too short');
check(at(46,.5).story.friendNap,'Friends sleeping in boxes absent');
check(at(49,1).mocha.position[1]>.04,'Box entry has no supported landing');
check(!at(50,.1).essie.visible&&at(50,.8).essie.visible,'Ear reveal missing');
check(at(56,.5).story.townSquare,'Town-square crowd absent');
check(Math.hypot(...at(59,0).sharedBox.map((v,i)=>v-at(59,1).sharedBox[i]))>1,'Shared box never dragged');
check(at(60,1).mocha.position[1]<.07,'Ending cat floats above box liner');
for(const id of ['mocha','essie']){
 check(at(53,1)[id].position[2]<4.1,'Return run cuts before '+id+' enters cafe');
 for(let u=.78;u<.95;u+=.02){
  const p=at(53,u)[id].position;
  if(p[2]>4.1&&p[2]<4.6)check(p[0]>1.7&&p[0]<2.8,'Return cat crosses door jamb');
 }
}
const cameraDistance=(a,b)=>Math.hypot(...a.camera.map((v,i)=>v-b.camera[i]))+Math.hypot(...a.target.map((v,i)=>v-b.target[i]))+Math.abs(a.fov-b.fov);
check(cameraDistance(directEpisodeCamera(at(4,1)),directEpisodeCamera(at(5,0)))<.05,'Street sniff begins with a camera cut');
for(const n of [37,38])check(cameraDistance(directEpisodeCamera(at(n,1)),directEpisodeCamera(at(n+1,0)))<.05,'Transformation camera jumps at beat '+n);
// Portrait-space face-center checks catch offscreen actors without assuming a
// particular camera formula. Deliberate box-eye extreme closeups are excluded.
const norm=a=>{const d=Math.hypot(...a)||1;return a.map(x=>x/d);};
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
for(const n of [5,6,7,8,16,19,20,21,22,23,32,33,35,36,37,38,40,42,47,51,52,53,54,55,56,57,58,59,60]){
 const s=at(n,.5),c=directEpisodeCamera(s),forward=norm(sub(c.target,c.camera)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward),tan=Math.tan(c.fov*Math.PI/360);
 for(const id of ['mocha','essie','latte']){
  const a=s[id];if(!a.visible||a.morph>.7)continue;
  const delta=sub([a.position[0],a.position[1]+.83,a.position[2]],c.camera),depth=dot(delta,forward);
  check(depth>0&&Math.abs(dot(delta,right)/(depth*tan*.5625))<.95&&Math.abs(dot(delta,up)/(depth*tan))<.85,'Actor face center outside portrait: '+n+' '+id);
 }
}
const cast=await fs.readFile(path.join(scene,'episode1Cast.ts'),'utf8');check(!cast.includes('restTexture')&&cast.includes('card.mesh.material.map=card.texture;'),'Resting texture can still replace native artwork');
check(!cast.includes('card.mesh.scale.x*=')&&!cast.includes('card.mesh.scale.y*='),'Legacy per-shot proportion modifiers remain');
const snapshot=at(16,.6);check(JSON.stringify(snapshot)===JSON.stringify(at(16,.6)),'Animation is nondeterministic');
console.log(JSON.stringify({stage:'NEW_STORY_SOURCE_GATE_PASSED__LOCAL_VISUAL_REVIEW_REQUIRED',checks,frames:shots.at(-1).end,segments:shots.length,visualApproval:false},null,2));
