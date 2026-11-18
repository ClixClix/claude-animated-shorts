import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('src/v2/episodes/in-this-town-02');
const out=path.resolve('out/v2-episodes/in-this-town-02');
await fs.mkdir(out,{recursive:true});
const load=f=>fs.readFile(path.join(source,f),'utf8');
const [lock,draft,scene,timeline,camera,boxes,behaviors,audio,finish]=await Promise.all([
 load('PRODUCTION_DIRECTOR_LOCK.json').then(JSON.parse),
 load('EDITORIAL_SCRATCH_PLAN.json').then(JSON.parse),
 load('Episode.tsx'),load('timeline.ts'),load('cameraDirector.ts'),load('boxProps.ts'),
 load('catBehaviors.ts'),
 fs.readFile(path.resolve('scripts/episode02-audio.py'),'utf8'),
 fs.readFile(path.resolve('scripts/episode02-finish.mjs'),'utf8')
]);
const issues=[];
const must=(id,passes,reason)=>{if(!passes)issues.push({id,reason});};
must('DIRECTOR_LOCK_HAS_60_ACTION_BEATS',lock.shots.length===60&&lock.shots.every((b,i)=>
 b.sequence===i+1&&b.visibleAction&&b.camera&&b.location.length), 'Every narrated beat must have a locked visible action and purposeful camera.');
must('APPROVED_ADAM_ALIGNMENT_PRESERVED',draft.shots.length===60&&
 draft.shots.every((s,i)=>s.sequence===lock.shots[i].sequence),'Approved 60-beat word timings must map to the director specification.');
must('NO_RANDOM_SCORE',!audio.includes('Original_Music_Stem.wav')&&
 finish.includes('EP02_SERIES_MUSIC_SOURCE.json'),'Do not create a procedural substitute for Episode 01 music.');
must('STRIPED_LATTE_BOX',boxes.includes("tape:'striped'")&&
 timeline.includes('HOME.latte'),'Latte must keep his striped box at its fixed café window location.');
must('ESSIE_COMPLETE_BOX',!scene.includes('front.scale.y=enabled?.42')&&
 !scene.includes('box.flaps.front.visible=!enabled'),'Do not alter or remove Essie box front wall to make an easier portrait.');
must('VISIBLE_CITY_MARKET',scene.includes('episode02-market-stalls')&&
 (timeline.includes("room='market'")||timeline.includes("n===29?'market'")),'A real small market with physical stalls must be shown, not a blank coordinate or storefront.');
must('THREE_DISTINCT_ALLEYS',['episode02-search-alley-1','episode02-search-alley-2','episode02-search-alley-3']
 .every(id=>scene.includes(id))&&timeline.includes('searchAlleyIndex'),
 'Show three visually different alley locations rather than one repeating camera angle.');
must('EP01_HOUSE_ACTUALLY_USED',scene.includes('episode02-house-visible')&&
 timeline.includes("room='house'")&&camera.includes("'house'"),
 'The full Episode 01 house must be visible and used for the missing-Essie home scene.');
must('ESSIE_CAT_BEDS_VISIBLE',scene.includes('episode02-essie-cafe-bed')&&
 scene.includes('episode02-essie-home-bed'),
 'Use real Essie cat-bed models in both café and house, not only an empty floor mat.');
must('SLEEP_BEAT_TARGETS_BED',timeline.includes('HOME.essieCafeBed')&&
 timeline.includes('HOME.essieHomeBed'),
 'Essie must physically reach her bed; missing-Essie POV must target her home bed.');
must('MOUTH_DRAG_AND_RESCUE_ACTED',behaviors.includes("n===18")&&
 behaviors.includes("n===20")&&behaviors.includes("n===42"),
 'Mocha must use real feline muzzle/floof contact outside, when extracting Essie, and when moving her box.');
must('TOWN_GATHERING_HAS_STOOL_AND_CROWD',scene.includes('episode02-town-stool')&&
 scene.includes('episode02-town-audience'),
 'Mocha announces the cure from a stool to a visibly LARGE gathering, not an explanatory board.');
must('NO_EXPLANATORY_CURE_BOARD',scene.includes('props.board.visible=false'),
 'Show the actual cure by cats, never replace it with a text billboard.');
const report={status:issues.length?'BLOCKED_BY_CREATIVE_SCENE_GAPS':'STATIC_REQUIREMENTS_PRESENT_NEEDS_RENDERED_QA',
 checkedAt:new Date().toISOString(),beatCount:lock.shots.length,failed:issues.length,
 issues,note:'Source-only checks cannot certify motion, quality, synchronization or licensing. Rendered full-video creative review is mandatory.'};
const json=path.join(out,'EP02_DIRECTOR_PREFLIGHT.json');
await fs.writeFile(json,JSON.stringify(report,null,2)+'\n');
const md=['# Episode 02 production-gap report','',
 'Director specification: PRODUCTION_DIRECTOR_LOCK.json (60 authoritative user beats).','',
 'This is only a source check; screenshots, motion review and rights checks are still required.','',
 ...issues.flatMap(issue=>['## '+issue.id,'',issue.reason,'']),
 issues.length?'Do not render a costly full-resolution master until these gaps are fixed.':'Static checks passed; proceed to actual visual review.'];
await fs.writeFile(path.join(out,'EP02_REMAINING_WORK.md'),md.join('\n')+'\n');
console.log(JSON.stringify({stage:report.status,beats:report.beatCount,failed:issues.length,
 issues:issues.map(x=>x.id),report:json},null,2));
if(issues.length&&process.argv.includes('--strict'))process.exitCode=1;
