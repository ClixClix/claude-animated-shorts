/** The current scene's shared real-mesh staging is the camera authority. */
import {studioRoot} from './lib/runtime.mjs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const r=spawnSync(process.execPath,[path.join(studioRoot,'src/v2/episodes/in-this-town-02/tools/scene-visibility-test.mjs')],{cwd:studioRoot,stdio:'inherit'});
if(r.error)throw r.error;process.exitCode=r.status??1;
