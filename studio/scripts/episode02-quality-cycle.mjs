/** Current, real-edit source checks. No scratch preparation or paid/media calls. */
import {studioRoot} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {sourceChecks} from './lib/episode02-source-checks.mjs';
const checks=[];
for(const item of sourceChecks){
 console.log('EP02 CHECK: '+item.name);
 const r=spawnSync(process.execPath,[path.join(studioRoot,item.script),...(item.args??[])],{cwd:studioRoot,stdio:'inherit'});
 checks.push({name:item.name,passed:!r.error&&r.status===0,error:r.error?.message??null});
 if(!checks.at(-1).passed&&item.name==='TypeScript')break;
}
const passed=checks.length===sourceChecks.length&&checks.every(c=>c.passed);
let preview='NOT_REQUESTED';
if(passed&&process.argv.includes('--preview')){
 const r=spawnSync(process.execPath,['src/v2/episodes/in-this-town-02/tools/three-frame-gate.mjs'],{cwd:studioRoot,stdio:'inherit'});
 preview=r.status===0?'RENDERED_LOCAL_PNGS_REQUIRE_INSPECTION':'FAILED';
}
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02/series-style-qa');await fs.mkdir(out,{recursive:true});
const report={stage:passed?'SOURCE_AND_GEOMETRY_CHECKS_PASS_VISUAL_REVIEW_PENDING':'CODE_AUDIT_FAILED',passed,checks,preview,
 editSource:'LIVE_APPROVED_RENDER_PROPS',artisticReviewComplete:false,paidRequests:0,publishingAllowed:false,
 note:'One current suite for all entry points. Numeric and source success does not certify the actual rendered film.'};
await fs.writeFile(path.join(out,'EP2_REPEATABLE_CODE_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
if(!passed||preview==='FAILED')process.exitCode=2;
