// Verifies immutable Episode 01 production source and Episode 02 style wiring.
// No browser, no render, no audio, no network, no spending, no publishing.
// npm run episode2:style-check
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {studioRoot} from './lib/runtime.mjs';

const lockPath=path.join(studioRoot,'src/v2/series/IN_THIS_TOWN_STYLE_LOCK.json');
const lock=JSON.parse(await fs.readFile(lockPath,'utf8'));
const toPath=(p)=>path.join(studioRoot,p);
const gitBlobSha=(buffer)=>createHash('sha1')
 .update('blob '+buffer.byteLength+'\0').update(buffer).digest('hex');
const sha256=(buffer)=>createHash('sha256').update(buffer).digest('hex');
const checks=[];
function check(id,ok,detail){
 checks.push({id,passed:Boolean(ok),detail});
 if(!ok)console.error('STYLE LOCK FAIL '+id+': '+detail);
}
for(const [relative,expectedSha] of Object.entries(lock.lockedSources)){
 const data=await fs.readFile(toPath(relative));
 const actual=gitBlobSha(data);
 check('locked-source:'+relative,actual===expectedSha,
  actual===expectedSha?'Matches approved Episode 01 source':'Expected '+expectedSha+' but found '+actual);
}
const [ep1,ep2,adapter,style,box,timeline,behaviors,baseline]=await Promise.all([
 'src/v2/episodes/door-at-1111-polish/Episode.tsx',
 'src/v2/episodes/in-this-town-02/Episode.tsx',
 'src/v2/episodes/in-this-town-02/episode1Cast.ts',
 lock.renderStyleModule,
 'src/v2/episodes/in-this-town-02/boxProps.ts',
 'src/v2/episodes/in-this-town-02/timeline.ts',
 'src/v2/episodes/in-this-town-02/catBehaviors.ts',
 '../QUALITY_BASELINE.md'
].map(f=>fs.readFile(toPath(f),'utf8')));
check('baseline-identity',baseline.includes(lock.referenceMp4Sha256),
 'Expected approved Episode 01 final-file SHA-256 documented in QUALITY_BASELINE.md');
check('ep1-actor-source',ep1.includes("createEpisodeCat(id)")&&
 ep1.includes("new LensBlur("),
 'Actual Episode 01 main composition still uses its original cat rig and lens');
check('ep2-origin-rigs',adapter.includes("createEpisodeCat(id)")&&
 adapter.includes("from '../door-at-1111-polish/actors'")&&
 ['mocha','essie','latte'].every(id=>ep2.includes("createEpisode1CastCat('"+id+"')")),
 'All three lead cats must come from the exact Episode 01 performer');
check('ep2-original-world',ep2.includes("new EpisodeWorld(optimize)")&&
 ep2.includes("new TownPopulation()")&&ep2.includes("createKitten()"),
 'Reuse established café, town extras and original kitten');
check('ep2-render-style',ep2.includes("import {EPISODE1_STYLE}")&&
 ep2.includes("new GradeEffect(EPISODE1_STYLE.grade")&&
 ep2.includes("...EPISODE1_STYLE.ink")&&
 ep2.includes("...EPISODE1_STYLE.bloom")&&
 ep2.includes("...EPISODE1_STYLE.lens")&&
 ep2.includes("EPISODE1_STYLE.character.sideTint"),
 'No new invented ink, bloom, grade, lens or cat-lighting settings in Episode 02');
check('ep1-grade-parameters',ep1.includes("ky:[.015,.09,.26,.52,.77,.92,1]")&&
 ep1.includes("tintS:[.008,.002]")&&
 ep1.includes("tintH:[-.003,.002]")&&
 style.includes("ky:[.015,.09,.26,.52,.77,.92,1]")&&
 style.includes("tintS:[.008,.002]")&&
 style.includes("tintH:[-.003,.002]"),
 'Shared style module agrees with original Episode01 graded palette');
check('ep1-ink-bloom-lens',style.includes("color:'#262737'")&&
 style.includes("intensity:.18,luminanceThreshold:1.05")&&
 style.includes("maxCoC:8,nearScale:.5")&&
 style.includes("sideTint:[.80,.88,1]"),
 'Episode 01 exact ink, bloom, lens and shade defaults were retained');
check('no-replacement-puppet',!ep2.includes('createArticulatedGuest(')&&
 !ep2.includes('makeCharacter(')&&!ep2.includes('createCatCard('),
 'The rejected oval-body, flat-actor code is not used in Episode 02 production');
check('feline-actions',!ep2.includes('pawRig(')&&
 !ep2.includes('gesture(')&&
 ep2.includes('catBehaviorFor(')&&
 behaviors.includes("mode:'nose-nudge'")&&
 behaviors.includes("mode:'mouth-carry'"),
 'No detached human grabbing arm; original cats use noses and mouths');
check('box-continuity',timeline.includes("latte:n>=6&&n<=55")&&
 box.includes("id:'LATTE_BOX'")&&box.includes("tape:'striped'")&&
 box.includes("id:'SHARED_BOX'"),
 'Only the correct story box identities are present; no duplicate final Latte box');
check('narrative-cure-order',timeline.includes('if(n===50)')&&
 timeline.includes('if(n===55)')&&
 timeline.indexOf('if(n===50)')<timeline.indexOf('if(n===55)'),
 'Essie restored before Latte; preserve approved Episode 02 reveal');

const refIndex=process.argv.indexOf('--reference');
let referenceStatus='NOT_SUPPLIED';
if(refIndex!==-1){
 const filename=process.argv[refIndex+1];
 if(!filename)throw Error('Usage: --reference "C:\\path\\to\\approved-episode01.mp4"');
 const actual=sha256(await fs.readFile(filename));
 referenceStatus=actual===lock.referenceMp4Sha256?'EXACT_FINAL_MP4_VERIFIED':'HASH_MISMATCH';
 check('exact-episode01-final-mp4',actual===lock.referenceMp4Sha256,
  'Measured SHA-256 '+actual+' against approved reference '+lock.referenceMp4Sha256);
}
const passed=checks.every(c=>c.passed);
const outputDir=path.join(studioRoot,'out/v2-episodes/in-this-town-02/series-style-qa');
await fs.mkdir(outputDir,{recursive:true});
const report={
 series:lock.series,referenceEpisode:lock.referenceEpisode,
 referenceMp4Sha256:lock.referenceMp4Sha256,referenceStatus,
 stage:passed?'SOURCE_STYLE_LOCK_PASSED_VISUAL_REVIEW_REQUIRED':'SOURCE_STYLE_LOCK_FAILED',
 passed,checks,creativeReviewPassed:false,renderedFrameReviewPassed:false,
 publishingAllowed:false,paidNarrationRequests:0,
 next:'Preview actual Episode 02 frames and motion against the Episode 01 MP4. Source identity/format cannot certify cinematic quality.'
};
const out=path.join(outputDir,'EP2_SERIES_STYLE_QA.json');
await fs.writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage:report.stage,passed,checks:checks.length,
 failures:checks.filter(x=>!x.passed).map(x=>x.id),referenceStatus,report:out},null,2));
if(!passed)process.exitCode=2;
