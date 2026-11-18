import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

// Reuse the EXACT music selection and clean intro-loop implementation used by
// Episode 01. This is a local mix stage only: no audio-generation API calls.
const studio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(studio,'out/v2-episodes/in-this-town-02');
const bundle=path.join(out,'EP02_01_MUSIC_PRESET.bundle.mjs');
await fs.mkdir(out,{recursive:true});
await build({entryPoints:[path.join(studio,'src/v2/narration/server/music.ts')],
 outfile:bundle,bundle:true,platform:'node',format:'esm',target:'node24'});
const {SERIES_MUSIC,musicSourceFilter}=await import(pathToFileURL(bundle).href);
const preset=SERIES_MUSIC.in_this_town;
if(!preset||preset.title!=='Numbers — Instrumental Intro Loop')
 throw Error('EP02_SERIES_MUSIC_PRESET_DRIFT: Episode 01 music preset is missing or changed.');
const exists=await fs.access(preset.privateFile).then(()=>true,()=>false);
if(!exists)throw Error('EP02_MISSING_EP1_MUSIC: The real Episode 01 intro recording is not present at '+preset.privateFile+
 '. Set V2_MUSIC_FILE to your already-owned original music file. Never synthesize or substitute music.');
const manifest=JSON.parse(await fs.readFile(path.join(out,'EP02_SHOT_MANIFEST.json'),'utf8'));
const duration=manifest.durationInFrames/30;
const loop=musicSourceFilter(preset.cleanLoop,duration);
const sourceSeconds=Number(JSON.parse(execFileSync('ffprobe',
 ['-v','error','-show_entries','format=duration','-of','json',preset.privateFile],{encoding:'utf8'})).format.duration);
if(!Number.isFinite(sourceSeconds)||sourceSeconds<loop.sourceEndSeconds)
 throw Error('EP02_SERIES_MUSIC_TOO_SHORT: file cannot supply Episode 01 clean intro loop.');
const output=path.join(out,'Music_Stem.wav');
const fade=Math.min(duration,preset.fadeOutSeconds);
const filter=loop.filter+
 ';[music-source]volume='+preset.gainDB+'dB,'+
 'afade=t=out:st='+Math.max(0,duration-fade)+':d='+fade+','+
 'apad=whole_dur='+duration+',atrim=end='+duration+
 ',aformat=sample_fmts=fltp:channel_layouts=stereo[out]';
execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y',
 '-i',preset.privateFile,'-filter_complex',filter,'-map','[out]',
 '-ar','48000','-ac','2','-c:a','pcm_f32le',output]);
const report={stage:'EP01_SERIES_MUSIC_REUSED',sourceTitle:preset.title,
 artist:preset.artist,sourceSHA256:createHash('sha256').update(await fs.readFile(preset.privateFile)).digest('hex'),
 output, duration,sourceRange:{start:loop.sourceStartSeconds,end:loop.sourceEndSeconds},
 repeatCount:loop.repetitions,gainDB:preset.gainDB,
 rightsConfirmedForPublishing:false,
 note:'Same Episode 01 user-provided clean intro phrase; private source stays local. Confirm license separately before publishing.'};
await fs.writeFile(path.join(out,'EP02_SERIES_MUSIC_SOURCE.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage:report.stage,sourceTitle:report.sourceTitle,
 artist:report.artist,duration:report.duration,repeatCount:report.repeatCount,rightsConfirmedForPublishing:false},null,2));
