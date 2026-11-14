import {studioRoot,renderConcurrency} from './lib/runtime.mjs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const stage=(process.argv[2]??'preview').toLowerCase(),c=renderConcurrency();
const python=process.env.V2_PYTHON||path.join(studioRoot,'..','.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
function run(program,args){const r=spawnSync(program,args,{stdio:'inherit',cwd:studioRoot});if(r.error)throw r.error;if(r.status!==0)throw Error('Polish stage failed: '+args.join(' ')+'. Original finished movies are preserved.');}
const node=(name,...args)=>run(process.execPath,['scripts/door-polish-'+name+'.mjs',...args]);
const py=(name,...args)=>run(python,['scripts/door-polish-'+name+'.py',...args]);
if(!['preview','all','qa'].includes(stage))throw Error('Use preview, all or qa.');
if(stage!=='qa'){node('prepare');node('tests');node('story-tests');}
if(stage==='preview'){
 node('render','motion','--shots','01,04,23,27,28,34,39A,39B,40,41,47,48,49,50A,50B,57A,57B,58A,58B,58C,58D,59A,59B,59C,60B','--concurrency',String(c));
 console.log('Polish preview clips are in out/v2-episodes/door-at-1111-polish/motion. They include one-word subtitles; preview audio is not mixed. Listen to ../Polish_Narration_Flow.mp3 for the continuous cached voice track.');
 if(process.platform==='win32')spawnSync('explorer.exe',[path.join(studioRoot,'out/v2-episodes/door-at-1111-polish/motion')]);
}else{
 if(stage==='all'){py('sfx');node('render','render','--concurrency',String(c));node('assemble');node('finish');}
 py('video-qa');py('boards');py('motion-boards','--native');node('reports');
}
