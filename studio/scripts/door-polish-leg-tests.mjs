import {build} from 'esbuild';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const out=path.resolve('out/v2-episodes/door-at-1111-polish/leg-projection-tools.mjs');
await build({entryPoints:['src/v2/episodes/door-at-1111-polish/legProjection.ts'],outfile:out,bundle:true,platform:'node',format:'esm'});
const {legProjection}=await import(pathToFileURL(out).href);let count=0;
for(const hip of [-85,-30,20,80])for(const foot of [-100,-50,0,50,100])for(const y of [410,440,480,505])for(const lift of [0,6,13]){
 const [a,b,c,d,e,f]=legProjection(hip,foot,y,lift);
 assert.ok(Math.abs(c*370+e)<1e-9&&Math.abs(d*370+f-370)<1e-9,'Hip detached');
 assert.ok(Math.abs(hip+c*(483-lift)+e-foot)<1e-9&&Math.abs(d*(483-lift)+f-y)<1e-9,'Foot no longer planted');
 count+=2;
}
console.log(count+' hip attachment and projected foot checks passed. Actual motion review remains required.');
