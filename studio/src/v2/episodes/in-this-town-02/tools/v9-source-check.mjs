/**
 * Read-only Phase 3 source inspection. Run from studio/:
 *   node src/v2/episodes/in-this-town-02/tools/v9-source-check.mjs
 * Source repairs must be validated in the user's Windows renderer.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const self=fileURLToPath(import.meta.url);
const scene=path.resolve(path.dirname(self),'..');
const studio=path.resolve(scene,'../../../..');
const out=path.join(studio,'out/v2-episodes/in-this-town-02');
const manifest=JSON.parse(await fs.readFile(path.join(scene,'V9_SOURCE_RECONCILIATION.json'),'utf8'));
const details=[];
const code={};
for (const file of manifest.files){
 const p=path.join(studio,file.path);
 try {
  const s=await fs.readFile(p,'utf8');
  const sha256=createHash('sha256').update(s).digest('hex');
  details.push({file:file.path,sha256,knownV9:sha256===file.sha256,status:sha256===file.sha256?'V9_MATCH':'MODIFIED_OR_DIFFERENT_BASELINE'});
  code[path.basename(file.path)]=s;
 }catch(e){details.push({file:file.path,status:'MISSING',error:String(e.message)});}
}
const defects=[];
const add=(test,id,description)=>{if(test)defects.push({id,description,requiresMovingPictureReview:true});};
const story=code['timeline.ts']||'',box=code['boxProps.ts']||'',episode=code['Episode.tsx']||'',rig=code['episode1Cast.ts']||'';
add(/gateWalk\s*=/.test(story)&&/n===51/.test(story),'SHOT_51_GATE_WALKOUT','Shot 51 uses gateWalk instead of the director-locked tip, tumble and embrace.');
add(/setExitOpening/.test(box)&&/setExitOpening/.test(episode),'SHOT_51_HINGED_FRONT','Box/episode scene uses a hinged front opening; this must not substitute for the locked intact-box rescue.');
add(/boxes\.essie\.flaps\.(front|right)\.visible\s*=/.test(episode),'SHOT_BASED_FLAP_HIDING','Scene code hides whole box flaps; reframe and animate existing flaps instead.');
add(/restTexture/.test(rig)&&/card\.mesh\.scale\.y\s*\*=/.test(rig),'RESTING_CARD_SCALE_UNVERIFIED','Sprite and rest-pose compositing include additional Y scaling; verify actual silhouette, contact and box fit on moving renders.');
add(/s\.shot\.sequence===6/.test(code['cameraDirector.ts']||'')&&/if\(n===6\)/.test(code['cameraDirector.ts']||''),'CAMERA_PATHS_REQUIRE_REVIEW','There are multiple camera pathways for Shot 06. Inspect the final camera actually used in real frames.');
const sourceIsV9=details.length===5&&details.every(x=>x.status==='V9_MATCH');
const result={
 stage:defects.some(x=>x.id==='SHOT_51_GATE_WALKOUT')?'BLOCKED_SOURCE_STORY_DEVIATION':'SOURCE_INSPECTION_DONE_VISUAL_REVIEW_REQUIRED',
 sourceIsV9,files:details,defects,publishingAllowed:false,
 note:'A source audit cannot approve character movement, camera composition, sound effects, box contacts, or Episode 01 parity. Do not overwrite locally newer sources with stale GitHub files.'
};
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'EP02_PHASE3_SOURCE_AUDIT.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({stage:result.stage,sourceIsV9,sourceFiles:details.length,defects:defects.map(x=>x.id),report:path.join(out,'EP02_PHASE3_SOURCE_AUDIT.json')},null,2));
if(result.stage==='BLOCKED_SOURCE_STORY_DEVIATION'||details.some(x=>x.status==='MISSING'))process.exitCode=2;
