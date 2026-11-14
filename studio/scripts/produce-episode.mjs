import {studioRoot,renderConcurrency,browserExecutable,chromiumOptions} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {hash,visualSourceHash,validSegment} from './lib/render-cache.mjs';

const args=process.argv.slice(2),stage=(args[0]??'all').toLowerCase(),at=args.indexOf('--concurrency');
const concurrency=renderConcurrency(at<0?undefined:args[at+1]);
const out=path.join(studioRoot,'out/v2-episodes/door-at-1111');
const manifest=JSON.parse(await fs.readFile(path.join(out,'The_Door_At_1111_Shot_Manifest.json'),'utf8'));
const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));props.optimize=true;props.previewScale=1;
const sourceHash=await visualSourceHash(),propsHash=hash(JSON.stringify(props));
let cursor=0;for(const shot of manifest.shots){if(shot.start!==cursor||shot.end<=shot.start||shot.end-shot.start>120)throw Error('Invalid shot manifest.');cursor=shot.end;}
if(cursor!==4800||manifest.width!==1080||manifest.height!==1920||manifest.fps!==30)throw Error('Unexpected episode format.');
const complete=[],pending=[];
for(const shot of manifest.shots)(await validSegment(path.join(out,'segments',shot.id+'.mp4'),shot,sourceHash,propsHash)?complete:pending).push(shot);
const {build}=await import('esbuild');
const configFile=path.join(out,'portable-music-config.mjs');
await build({entryPoints:['src/v2/narration/server/music.ts'],outfile:configFile,bundle:true,platform:'node',format:'esm'});
const {SERIES_MUSIC}=await import((await import('node:url')).pathToFileURL(configFile).href);
let musicAvailable=true;try{await fs.access(SERIES_MUSIC.in_this_town.privateFile);}catch{musicAvailable=false;}
const status={episode:'The Door at 11:11',format:'1080x1920 / 30 fps / 160 seconds',completedShots:complete.length,totalShots:manifest.shots.length,completedFrames:complete.reduce((n,s)=>n+s.end-s.start,0),remainingShots:pending.map(s=>s.id),sourceHash,propsHash,concurrency,browser:browserExecutable??'Remotion-managed Chrome',gl:chromiumOptions.gl,musicAvailable,paidRequests:0};
console.log(JSON.stringify(status,null,2));
if(stage==='status')process.exit(0);
const python=process.env.V2_PYTHON||path.join(studioRoot,'..','.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
function run(program,argv){const r=spawnSync(program,argv,{stdio:'inherit',cwd:studioRoot});if(r.error)throw r.error;if(r.status!==0)throw Error('Stage failed: '+argv[0]+' (exit '+r.status+'). Existing valid shots are retained.');}
const node=(file,...rest)=>run(process.execPath,['scripts/'+file,...rest]);
const py=file=>run(python,['scripts/'+file]);
if(stage==='smoke'){node('door-at-1111-render.mjs','render','--shots','19','--sample','6','--concurrency',String(concurrency));console.log('Six native frames saved to native-samples/. Full-shot cache unchanged.');process.exit(0);}
if(!['all','render','assemble','audio','qa'].includes(stage))throw Error('Use all, status, smoke, render, assemble, audio or qa.');
if(stage==='all'){
 node('v2-tests.mjs');
 let sfxCached=false;
 try{const meta=JSON.parse(await fs.readFile(path.join(out,'SFX_PROVENANCE.json'),'utf8'));sfxCached=meta.cuesSHA256===hash(await fs.readFile(path.join(out,'SFX_CUES.json')))&&meta.sourceSHA256===hash(await fs.readFile('scripts/door-at-1111-sfx.py'))&&meta.audioSHA256===hash(await fs.readFile(path.join(out,'SFX_Stem.wav')));}catch{}
 if(sfxCached)console.log('Verified cached SFX stem; no synthesis needed.');else py('door-at-1111-sfx.py');
}
if(stage==='all'||stage==='render')node('door-at-1111-render.mjs','render','--concurrency',String(concurrency));
if(stage==='all'||stage==='assemble')node('door-at-1111-assemble.mjs');
if(stage==='all'||stage==='audio')node('door-at-1111-finish.mjs');
if(stage==='all'||stage==='qa'){
 if(musicAvailable){py('door-at-1111-video-qa.py');}else console.log('Music-inclusive QA deferred: transfer the authorized private soundtrack, then rerun the audio and qa stages.');
 py('door-at-1111-boards.py');
 // The motion boards need the actual native segments rather than the earlier draft gates.
 run(python,['scripts/door-at-1111-motion-boards.py','--native']);
 if(musicAvailable)node('door-at-1111-reports.mjs');
}
console.log('Requested local stage completed. Review the actual movies for visual and listening approval; nothing is published.');
