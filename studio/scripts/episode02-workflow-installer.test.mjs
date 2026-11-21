import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
const studio=fileURLToPath(new URL('../',import.meta.url));
const installer=path.join(studio,'src/v2/episodes/in-this-town-02/tools/apply-workflow-reliability.mjs');
const source=await fs.readFile(installer,'utf8');
const data=JSON.parse(gunzipSync(Buffer.from(source.match(/Buffer.from\('([^']+)','base64'/)[1],'base64')));
async function fixture(t){
 const home=await fs.mkdtemp(path.join(os.tmpdir(),'ep02-install-regression-')),root=path.join(home,'studio');
 t.after(()=>fs.rm(home,{recursive:true,force:true}));await fs.mkdir(root);
 const write=async(name,bytes)=>{const file=path.resolve(root,name);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);};
 for(const [name,item] of Object.entries(data.files))await write(name,item.text);
 for(const name of Object.keys(data.guards))await write(name,await fs.readFile(path.join(studio,name)));
 const pkg={name:'isolated-installer-test-fixture',scripts:{...data.aliasBefore,'user:keep':'node custom-local.mjs'}};
 await write('package.json',JSON.stringify(pkg));
 // Synthetic timing only, confined to this temporary installer fixture. No private audio metadata.
 const shots=Array.from({length:62},(_,i)=>({id:String(i+1),start:Math.floor(i*3737/62),end:Math.floor((i+1)*3737/62)}));
 await write('out/v2-episodes/in-this-town-02/render-props.json',JSON.stringify({audioApproved:true,shots}));
 await write('scripts/episode02-action-evidence.mjs','LOCAL AUDIT EDIT MUST SURVIVE');
 await write('out/v2-episodes/in-this-town-02/MASTER_With_Music.wav','PRIVATE INPUT SENTINEL');
 const run=(...args)=>spawnSync(process.execPath,[installer,...args],{cwd:root,encoding:'utf8'});
 const read=name=>fs.readFile(path.resolve(root,name),'utf8');
 return {root,write,read,run};
}
test('a modified historical audit survives while all active action gates migrate',async t=>{
 const f=await fixture(t);let result=f.run('--apply');assert.equal(result.status,0,result.stderr);
 assert.equal(await f.read('scripts/episode02-action-evidence.mjs'),'LOCAL AUDIT EDIT MUST SURVIVE');
 const pkg=JSON.parse(await f.read('package.json'));assert.equal(pkg.scripts['user:keep'],'node custom-local.mjs');
 assert.equal(pkg.scripts['episode2:action-audit'],'node scripts/episode02-live-action-evidence.mjs');
 assert.match(await f.read('scripts/lib/episode02-source-checks.mjs'),/scripts\/episode02-live-action-evidence\.mjs/);
 assert.equal(await f.read('scripts/episode02-live-action-evidence.mjs'),data.files['scripts/episode02-live-action-evidence.mjs'].text);
 assert.equal(await f.read('out/v2-episodes/in-this-town-02/MASTER_With_Music.wav'),'PRIVATE INPUT SENTINEL');
 result=f.run('--apply');assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/Already installed/);
});
test('unknown executable changes still stop the entire update before writing',async t=>{
 const f=await fixture(t);await f.write('scripts/episode02-render.mjs','LOCAL_RENDER');await f.write('scripts/episode02-assemble.mjs','LOCAL_ASSEMBLY');
 const before=await f.read('package.json'),result=f.run('--apply');assert.notEqual(result.status,0);
 assert.match(result.stderr,/episode02-render\.mjs/);assert.match(result.stderr,/episode02-assemble\.mjs/);
 assert.equal(await f.read('package.json'),before);assert.equal(await f.read('scripts/episode02-render.mjs'),'LOCAL_RENDER');
});
