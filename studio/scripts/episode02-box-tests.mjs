// Offline, no narration, no browser, no render. Run from C:\\V2\\studio:
//   node scripts/episode02-box-tests.mjs
import './lib/runtime.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import * as T from 'three';

const target=path.resolve('out/v2-episodes/in-this-town-02');
await fs.mkdir(target,{recursive:true});
const output=path.join(target,'box-asset-test-bundle.mjs');
await build({
  stdin:{resolveDir:process.cwd(),loader:'ts',contents:[
    "export {BOX_SPECS,BOX_IDENTITY_ORDER,createEpisodeBox} from './src/v2/episodes/in-this-town-02/boxProps.ts';",
    "export {ROOM,FIXTURES} from './src/v2/cafe/config.ts';",
  ].join('\n')},
  outfile:output,bundle:true,platform:'node',format:'esm',external:['three'],target:'node24',
});
const {BOX_SPECS,BOX_IDENTITY_ORDER,createEpisodeBox,ROOM,FIXTURES}=await import(pathToFileURL(output).href);
let passed=0;
const check=(condition,label)=>{assert.ok(condition,label);passed++;};
check(BOX_IDENTITY_ORDER.join(',')==='latte,essie,shared','Three stable box identities');
check(new Set(BOX_IDENTITY_ORDER.map(id=>BOX_SPECS[id].id)).size===3,'Unique canonical stable names');
check(BOX_SPECS.latte.tape==='striped'&&BOX_SPECS.essie.tape==='none'&&BOX_SPECS.shared.tape==='none','Latte remains the only striped box');
check(BOX_SPECS.shared.width>BOX_SPECS.essie.width&&BOX_SPECS.essie.width>BOX_SPECS.latte.width,'Distinct widths and shared capacity');
check(ROOM.width===8&&ROOM.depth===8.4,'Known fixed cafe dimensions were preserved');

check(BOX_SPECS.latte.height<=.52&&BOX_SPECS.essie.height<=.60&&
 BOX_SPECS.shared.height<=.60,'Low box sidewalls leave Episode 01 cat faces visible');
check(BOX_SPECS.shared.width>=2.3&&BOX_SPECS.shared.width<=2.6,
 'Final one-box trio has plausible width without swallowing cafe room');
const timelineSource=await fs.readFile(
 path.resolve('src/v2/episodes/in-this-town-02/timeline.ts'),'utf8');
const sceneSource=await fs.readFile(
 path.resolve('src/v2/episodes/in-this-town-02/Episode.tsx'),'utf8');
const felineSource=await fs.readFile(
 path.resolve('src/v2/episodes/in-this-town-02/catBehaviors.ts'),'utf8');
check(timelineSource.includes('latte:n>=6&&n<=55'),
 'Latte original box vanishes when the shared box appears');
check(!sceneSource.includes('pawRig(')&&!sceneSource.includes('gesture('),
 'No disembodied human-like forearm in Episode 02 main render');
check(sceneSource.includes("catBehaviorFor(s,'mocha')")&&
 sceneSource.includes("catBehaviorFor(s,'essie')"),
 'Nose and mouth action director controls the actual Episode 01 cat assets');
check(felineSource.includes("mode:'mouth-carry'")&&
 felineSource.includes("mode:'nose-nudge'"),
 'Light cardboard is carried by mouth or nudged by nose, never hand-grabbed');


// Default stationary room placements must not intersect existing permanent
// solid fixtures. This does not certify animation or cinematographic framing.
const solids=FIXTURES.filter(f=>['serving-counter','preparation-counter','customer-table','chair','bench','riser','plant'].includes(f.role));
for(const identity of BOX_IDENTITY_ORDER){
  const spec=BOX_SPECS[identity];
  const box=createEpisodeBox(identity);
  const names=[];
  const mats=[];
  box.root.traverse(o=>{
    if(o instanceof T.Mesh){
      names.push(o.name);
      mats.push(o.material);
      check(!!o.geometry.getAttribute('position')?.count,identity+' has complete mesh geometry');
      const p=o.geometry.getAttribute('position');
      for(let i=0;i<p.count;i++)check(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)),identity+' has finite vertices');
    }
  });
  check(box.root.name===spec.id,identity+' name is stable');
  check(box.root.userData.identity===identity,identity+' identity metadata');
  // Four extra recessed cardboard lining panels (floor, back, left,
  // right) are physical depth cues, not duplicate exterior box shells.
  check(names.length===(identity==='latte'?15:13),
   identity+' exact expected panel count including four inset liners');
  check(names.filter(n=>n.endsWith('-inner')||
   n.endsWith('-floor-liner')).length===4,
   identity+' has exactly one floor liner and three inside wall liners');
  check(names.filter(n=>n.includes('-flap')&&!n.includes('pivot')).length===4,identity+' four real flaps');
  check(names.filter(n=>n.includes('-tape-')).length===(identity==='latte'?2:0),identity+' tape identity');
  box.setOpenAmount(0);
  check(Math.abs(box.flaps.front.rotation.x)<1e-12,identity+' can close flaps');
  box.setOpenAmount(1);
  check(box.flaps.front.rotation.x>2,identity+' can open flaps');
  assert.throws(()=>box.setOpenAmount(Number.NaN));
  passed++;
  box.setOpenAmount(.82);
  box.root.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(box.root);
  check(bounds.min.y>=-.005,identity+' never drops geometry below the floor');
  check(bounds.max.y<2.5,identity+' geometry stays plausibly scaled');

  const [x,,z]=spec.home;
  const footprint={left:x-spec.width/2,right:x+spec.width/2,back:z-spec.depth/2,front:z+spec.depth/2};
  check(footprint.left>-ROOM.half&&footprint.right<ROOM.half&&footprint.back>ROOM.back&&footprint.front<ROOM.front,identity+' fits room perimeter');
  for(const fixture of solids){
    const [fx,,fz]=fixture.position,[fw,,fd]=fixture.size;
    const overlapX=footprint.left<fx+fw/2-.005&&footprint.right>fx-fw/2+.005;
    const overlapZ=footprint.back<fz+fd/2-.005&&footprint.front>fz-fd/2+.005;
    check(!(overlapX&&overlapZ),identity+' avoids protected fixture '+fixture.id);
  }
  box.dispose();
}
console.log(JSON.stringify({passed,assets:BOX_IDENTITY_ORDER,protectedFixtures:solids.map(f=>f.id),note:'Static source-and-geometry tests only. Native rendered motion not yet reviewed.'},null,2));
