import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {build} from 'esbuild';import * as T from 'three';
const scene=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),studio=path.resolve(scene,'../../../..'),out=path.join(studio,'out/v2-episodes/in-this-town-02');
const dest=path.join(out,'review-polish-regression.mjs');
await build({stdin:{contents:"export {stateAt,STREET_BOX_CENTERS} from './src/v2/episodes/in-this-town-02/timeline';export {directEpisodeCamera} from './src/v2/episodes/in-this-town-02/cameraDirector';export {BOX_SPECS,createEpisodeBox} from './src/v2/episodes/in-this-town-02/boxProps';",resolveDir:studio,loader:'ts'},outfile:dest,bundle:true,platform:'node',format:'esm',external:['three']});
const {stateAt,directEpisodeCamera,STREET_BOX_CENTERS,BOX_SPECS,createEpisodeBox}=await import(pathToFileURL(dest).href);
const {shots}=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
const four=shots.filter(s=>s.sequence===4),five=shots.filter(s=>s.sequence===5),a=four[0].start,b=four.at(-1).end;
const first=stateAt(a,shots),last=stateAt(b-1,shots);
assert(last.mocha.position[0]-first.mocha.position[0]>4,'Mocha must cover multiple storefronts in one direction');
assert(Math.hypot(...last.mocha.position.map((v,i)=>v-stateAt(five[0].start,shots).mocha.position[i]))<.001,'Street run teleports at 04/05 cut');
let largestStep=0;
for(let f=a+1;f<=five.at(-1).end-1;f++){
 const prior=directEpisodeCamera(stateAt(f-1,shots)),now=directEpisodeCamera(stateAt(f,shots));
 const step=Math.hypot(...now.camera.map((x,i)=>x-prior.camera[i]));largestStep=Math.max(largestStep,step);assert(step<.20,'Unexpected street camera jump at '+f);
 assert.equal(prior.fov,now.fov,'Street camera lens resets');
}
assert(STREET_BOX_CENTERS[0][0]<STREET_BOX_CENTERS[1][0],'Box encounters must follow the run direction');
for(const kind of ['latte','essie']){
 const box=createEpisodeBox(kind),spec=BOX_SPECS[kind],length=spec.depth*.47;
 const angle=Math.PI+Math.asin(Math.min(length,spec.height+.04-.07)/length);
 box.flaps.front.rotation.x=angle;box.root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(box.flaps.front);
 assert(bounds.min.y>.04,'Folded front flap clips the floor: '+kind);
 assert(bounds.max.y<spec.height+.065,'Folded front flap rises into faces: '+kind);
 box.dispose();
}
const sceneSource=await fs.readFile(path.join(scene,'Episode.tsx'),'utf8');
assert(sceneSource.includes('const streetCenters=STREET_BOX_CENTERS;')&&sceneSource.includes('n===4?STREET_BOX_CENTERS.map'), 'Street cats and their cartons must share the same world anchors');
const policy=JSON.parse(await fs.readFile(path.join(scene,'AUDIO_POLICY.json'),'utf8'));
assert.equal(policy.events.filter(e=>e.kind==='cat-meow').length,6);
assert(policy.events.every(e=>['cat-meow','box'].includes(e.kind)),'Unapproved sound effect category');
console.log(JSON.stringify({stage:'SOURCE_POLISH_REGRESSION_PASSED',streetTravelMeters:last.mocha.position[0]-first.mocha.position[0],largestCameraStep:largestStep,foldedFlapsClearFloor:true,allowedSFX:['cat-meow','box'],visualReview:'PENDING_LOCAL_RENDER'}));
