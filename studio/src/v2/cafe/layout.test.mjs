import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
// Run from studio/: node src/v2/cafe/layout.test.mjs
// Production configuration and checks under Node, with the actual Three.js math library.
import fs from 'node:fs';import ts from 'typescript';import * as THREE from 'three';import assert from 'node:assert/strict';
const cache={};function load(file){if(cache[file])return cache[file].exports;
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const mod={exports:{}};cache[file]=mod;new Function('require','module','exports',source)(name=>name==='three'?THREE:load(fileURLToPath(new URL(name+'.ts',pathToFileURL(path.resolve(file))))),mod,mod.exports);return mod.exports;
}
const {layoutChecks}=load('src/v2/cafe/layout.ts');const checks=layoutChecks();
for(const check of checks)assert.ok(check.pass,`${check.name}: ${check.detail}`);
const {FIXTURES}=load(path.resolve('src/v2/cafe/config.ts'));
FIXTURES.push({...FIXTURES[0]});assert.ok(layoutChecks().some(c=>!c.pass&&c.name.includes('Exactly one')));FIXTURES.pop();
const table=FIXTURES.find(f=>f.id==='table-window-front'),pos=table.position;
table.position=[...FIXTURES[0].position];assert.ok(layoutChecks().some(c=>!c.pass&&c.name.startsWith('Clear furniture footprints')));table.position=pos;
assert.ok(layoutChecks().every(c=>c.pass));
console.log(`${checks.length} structural layout checks passed; duplicate-counter and furniture-overlap regression probes passed`);
