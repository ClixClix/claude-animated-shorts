import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {renderInputs,requireUnchangedInputs,segmentMatches,renderProps,SIGNATURE_VERSION} from './lib/episode02-render-inputs.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ep02-deps-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'src'));
 await fs.writeFile(path.join(root,'src/index.ts'),"import {value} from './storyDirection'; export const result=value;\n");
 await fs.writeFile(path.join(root,'src/storyDirection.ts'),'export const value=1;\n');
 return root;
}
test('a transitive scene change invalidates otherwise identical cached footage',async t=>{
 const root=await fixture(t),props={shots:[{id:'01',start:0,end:30}]};
 const before=await renderInputs(root,props,true);
 assert(before.sources.some(s=>s.file==='src/storyDirection.ts'));
 await fs.writeFile(path.join(root,'src/storyDirection.ts'),'export const value=2;\n');
 const after=await renderInputs(root,props,true);
 assert.notEqual(before.sourceHash,after.sourceHash);
 assert.equal(before.propsHash,after.propsHash);
 assert.equal((await renderInputs(root,{shots:[{end:30,start:0,id:'01'}]},true)).propsHash,after.propsHash,'JSON key order must not change the render identity');
 await assert.rejects(requireUnchangedInputs(root,before),/storyDirection/);
});
test('an unimported unrelated file does not invalidate the dependency graph',async t=>{
 const root=await fixture(t),before=await renderInputs(root,{},true);
 await fs.writeFile(path.join(root,'src/unrelated.ts'),'export const unused=12;');
 assert.equal((await renderInputs(root,{},true)).sourceHash,before.sourceHash);
});
test('preview/native props differ and input objects are not mutated',()=>{
 const p={shots:[],previewScale:9,optimize:false},copy=structuredClone(p);
 assert.equal(renderProps(p,true).previewScale,.5);
 assert.equal(renderProps(p,false).previewScale,1);assert.deepEqual(p,copy);
});
test('missing, corrupt, old-version, wrong-mode and stale-source segments are rejected',async t=>{
 const root=await fixture(t),file=path.join(root,'01.mp4'),bytes=Buffer.from('SEGMENT_TEST_FIXTURE_NOT_A_VIDEO');
 const inputs=await renderInputs(root,{},true),shot={id:'01',start:0,end:30};
 const metadata={...inputs,preview:true,start:0,end:30,sha256:sha(bytes)};
 const match=meta=>segmentMatches({file,metadata:meta,shot,inputs,preview:true});
 assert.equal(await match(metadata),false);await fs.writeFile(file,bytes);assert.equal(await match(metadata),true);
 for(const change of [{signatureVersion:SIGNATURE_VERSION-1},{sourceHash:'older'},{propsHash:'other'},{preview:false},{end:29}])assert.equal(await match({...metadata,...change}),false);
 await fs.writeFile(file,'CORRUPT');assert.equal(await match(metadata),false);
});
