#!/usr/bin/env node
/**
 * In This Town: one-story-prompt preproduction compiler.
 *
 * Converts a creator's single natural-language story into an actionable,
 * traceable first storyboard and location/prop continuity inventory.
 * Does NOT claim that text-only heuristics create CGI animation, approved
 * narration or publication rights. Actual shots must be implemented/rendered,
 * inspected and corrected using the locked Episode 01 series pipeline.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const studio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const STYLE='src/v2/series/IN_THIS_TOWN_STYLE_LOCK.json';
const EP1='src/v2/episodes/door-at-1111-polish';
const STOPWORDS=new Set('in this town a an the of at from to into and or with for on it they she he we their his her our is was were be had that then one two by as but while no when if too so not after before'.split(' '));

export const ACTIONS=[
 {id:'transform-to-box',rx:/\b(becom(?:e|es|ing)|became|turn(?:s|ed)? into|transform(?:s|ed)?|fold(?:s|ed)? into)\b.*\bbox\b|\bbox\b.*\b(transform(?:s|ed)?|becom(?:e|es))\b/i,
  camera:'Keep the SAME cardboard identity and scale; uninterrupted three-quarter action insert, restrained impact shake.',
  checks:['Visible cat shape changes into cardboard; no sudden disappearance','Same box geometry/identity in both adjoining shots']},
 {id:'enter-box',rx:/\b(jump(?:s|ed|ing)?|climb(?:s|ed|ing)?|curl(?:s|ed|ing)?)\b.*\b(box|carton)\b/i,
  camera:'Low side follow for the actual jump, then shallow high-three-quarter of the curl.',
  checks:['Clear jump arc above intact box lip','No body/wall phasing','Paws contact physical box floor']},
 {id:'rescue',rx:/\b(rescu(?:e|es|ed)|sav(?:e|es|ed)|pull(?:s|ed)? (?:her|him|them|a cat|the cat) out|come(?:s)? back|came back)\b/i,
  camera:'Hold both actors and object contact until the rescue physically completes.',
  checks:['Every rescuer/rescued actor remains legible','Connected contact and supported landing','Cause visible before reaction']},
 {id:'run',rx:/\b(run(?:s|ning)?|ran|rac(?:e|es|ed)|sprint(?:s|ed)?|chas(?:e|es|ed))\b/i,
  camera:'Motivated tracking follow on a physically continuous street/room route.',
  checks:['Grounded planted gait','No teleport between positions','No intervening solid walls']},
 {id:'walk',rx:/\b(walk(?:s|ed|ing)?|pass(?:es|ed)?|approach(?:es|ed)?|follow(?:s|ed)?)\b/i,
  camera:'Purposeful low tracking two-shot, cut to the character’s expression at destination.',
  checks:['Visible travel beyond idle bob','Paws grounded and direction consistent']},
 {id:'mouth-contact',rx:/\b(drag(?:s|ged|ging)?|carr(?:y|ies|ied)|pull(?:s|ed|ing)?|hold(?:s|ing)?|pick(?:s|ed)? up|open(?:s|ed)?|clos(?:e|es|ed)?)\b/i,
  camera:'Contact close-up showing cat muzzle/mouth and object moving together; no human hands.',
  checks:['Muzzle contact is visible','Object responds while contact continues','No clipping or unsupported reach']},
 {id:'react',rx:/\b(panic(?:s|ked)?|worr(?:y|ies|ied)|shock(?:s|ed)?|freez(?:e|es)|froze|confus(?:e|ed)|beg(?:s|ged)?|smil(?:e|es|ed)|cri(?:e|es|ed)|sad|scared|surpris(?:e|ed))\b/i,
  camera:'Motivated expressive eye-level closeup with coherent eyeline and movement.',
  checks:['Facial acting legible in real frames','Reaction occurs after visible cause']},
 {id:'look',rx:/\b(look(?:s|ed|ing)?|check(?:s|ed)?|search(?:es|ed)?|see(?:s|ing)?|saw|watch(?:es|ed)?)\b/i,
  camera:'Character POV pan to the exact subject; reverse for reaction.',
  checks:['The searched-for subject/location is visible or intentionally absent','POV direction matches actor gaze']},
 {id:'time-change',rx:/\b(sunris(?:e|es)|sunset|morning|night|dawn|dusk|next day|next morning)\b/i,
  camera:'Wide crane or match cut establishing real day/night lighting and geography.',
  checks:['Consistent sun/sky and practical lights','Background activity appropriate to time']},
 {id:'reveal',rx:/\b(reveal(?:s|ed)?|discover(?:s|ed)?|finally|appea(?:r|rs|red)|emerg(?:e|es|ed)|popp(?:ed|ing)?|pop!)\b/i,
  camera:'Motivated reveal that establishes then isolates the important object/character.',
  checks:['Readable reveal in at least one continuous passage','No prop popping or character duplicate']},
];

export const LOCATIONS=[
 {id:'cafe',rx:/\b(caf[eé]|coffee shop|counter|register|barista)\b/i,asset:'Episode01 CaféEnvironment with two counters'},
 {id:'house',rx:/\b(house|home|bedroom|living room)\b/i,asset:'Episode01 house/home geometry'},
 {id:'market',rx:/\b(market|stall|vendor|bazaar)\b/i,asset:'Real miniature town market with actual stalls/canopies/merchandise'},
 {id:'bus-stop',rx:/\b(bus stop|bus shelter|bus station)\b/i,asset:'Episode01 bus shelter, physical bench and stop marker'},
 {id:'alley',rx:/\b(alleys|alley|alleyway)\b/i,asset:'One or more physically distinct alleys with unique geometry'},
 {id:'town',rx:/\b(town|city|street|sidewalk|square|intersection|streetlamp)\b/i,asset:'Episode01 connected city/town geometry'},
];
export const PROPS=[
 {id:'striped-box',rx:/\bstriped\s+(?:cardboard\s+)?box\b/i,continuity:'Striped box stays recognizable with same tape, size and location across cuts'},
 {id:'plain-box',rx:/\b(?:cardboard|plain|favorite|favourite)\s+box\b/i,continuity:'Four intact physical sides; never hide front wall for camera'},
 {id:'cat-bed',rx:/\b(?:cat|her|his|their|soft)\s+bed\b|\bsleeping spot\b/i,continuity:'Real soft cat bed geometry, consistent home location'},
 {id:'window',rx:/\bwindow\b/i,continuity:'Same café window/house window relative to actors'},
 {id:'food',rx:/\bfood|kibble|treat|bowl\b/i,continuity:'Physical cat food and bowl with plausible mouth delivery'},
 {id:'door',rx:/\bdoor\b/i,continuity:'Actual hinged door with correct swing and muzzle contact'},
 {id:'streetlamp',rx:/\bstreetlamp|street light|lamp post\b/i,continuity:'Physical illuminated lamp; no camera obstruction'},
 {id:'stool',rx:/\bstool\b/i,continuity:'Physically grounded stool supports cat paws'},
 {id:'market-stalls',rx:/\bmarket\b/i,continuity:'Visible market stalls, not merely an empty street'},
];

const compact=(s)=>s.replace(/\s+/g,' ').trim();
const sha=(s)=>createHash('sha256').update(s).digest('hex');
const token=(s)=>s.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
const safeSlug=(s)=>token(s).slice(0,56)||'untitled-episode';

function paragraphsAndSentences(text){
 const chunks=[];
 const pars=text.replace(/\r\n/g,'\n').split(/\n\s*\n/);
 for(let pi=0;pi<pars.length;pi++){
  const paragraph=compact(pars[pi]);
  if(!paragraph)continue;
  // Splitting for initial planning, NOT a true speech or edit alignment.
  // Keep ellipses and internal quotations; do not manufacture VO timings.
  const sentences=paragraph.split(/(?<=[.!?])\s+(?=[“"A-Z0-9])/);
  for(const sentence of sentences){
   const bits=sentence.split(/\s*(?:;|\b(?:and then|then|meanwhile|after that)\b(?=\s))\s*/i);
   for(const bit of bits){const phrase=compact(bit);if(phrase)chunks.push({text:phrase,paragraph:pi+1});}
  }
 }
 return chunks;
}

export function compileStory(story,options={}){
 const source=String(story??'').trim();
 if(source.length<35)throw new Error('Provide a real story prompt (at least 35 characters). A blank template cannot generate a finished film.');
 const title=compact(options.title||'Untitled In This Town Episode');
 const id=safeSlug(options.slug||title);
 const atoms=paragraphsAndSentences(source);
 if(atoms.length===0)throw new Error('No actionable story text found.');
 let location='town';
 const assets=new Map(),propUsed=new Map();
 const shots=atoms.map((atom,i)=>{
  const locations=LOCATIONS.filter(loc=>loc.rx.test(atom.text));
  if(locations.length){
   // A location mentioned inside a sentence has priority over the prior location.
   location=locations[0].id;
  }
  const current=locations.map(l=>l.id);if(!current.includes(location))current.push(location);
  for(const l of LOCATIONS.filter(l=>current.includes(l.id)))assets.set(l.id,l.asset);
  const props=PROPS.filter(p=>p.rx.test(atom.text));
  for(const p of props)propUsed.set(p.id,p.continuity);
  const actions=ACTIONS.filter(a=>a.rx.test(atom.text));
  const types=actions.length?actions.map(a=>a.id):['narrative-beat-needs-action'];
  const requireVisual=actions.length?
    actions.flatMap(a=>a.checks):['Invent a specific visible physical action or visual reaction for this line; narration-only static tableaux are prohibited'];
  const camera=actions.length?actions[0].camera:'Choose an Episode01-motivated camera that visibly communicates the narrated event.';
  return {id:'BEAT-'+String(i+1).padStart(3,'0'),sourceParagraph:atom.paragraph,
   narrationText:atom.text,location,locationMentions:current,
   castMentions:['mocha','essie','latte'].filter(name=>new RegExp('\\b'+(name==='essie'?'(?:essie|espresso)':name)+'\\b','i').test(atom.text)),
   propReferences:props.map(p=>p.id),actionTypes:types,
   mustShow:'ACT ON SCREEN: '+atom.text,
   cameraIntent:camera,continuityChecks:[...new Set([...requireVisual,...props.map(p=>p.continuity)])],
   requiresRealActing:true,visualStatus:'NOT_IMPLEMENTED',renderedFrameReview:'PENDING'};
 });
 const alleyPhrase=/\bevery alley\b|\b(?:many|several|multiple|different|three|3)\s+(?:(?:distinct|different)\s+)?alleys\b/i.test(source);
 const minAlleyLocations=alleyPhrase?3:assets.has('alley')?1:0;
 if(minAlleyLocations>=3)assets.set('alley-1/2/3','Three physically distinct sets with distinct bins/signage/walls, photographed via cuts');
 const warnings=[
  'Storyboard is an AUTOMATIC FIRST DRAFT from a single story prompt, NOT implemented animation or a licensed/approved movie.',
  'Timing is deliberately omitted until a real approved narration WAV + word alignment are supplied.',
  'Inspect every named location, prop, action, camera and physically moving character against the original story before rendering.',
  'Use locked original Episode01 character rigs, environments and grade; code source-lock passing cannot certify artistic parity.',
  'Real frame/motion review, visual self-correction loop, final audio rights and user approval remain mandatory.'
 ];
 return {version:1,projectId:id,title,series:'In This Town',storySHA256:sha(source),
  originalPrompt:source,sourceLength:source.length,storyBeatCount:shots.length,
  storyBeats:shots,requirements:{
   styleLock:STYLE,episode01World:EP1+'/world.ts',episode01Rigs:EP1+'/actors.ts',
   width:1080,height:1920,fps:30,minimumDistinctAlleys:minAlleyLocations,
   locations:[...assets].map(([id,asset])=>({id,asset,visuallyVerified:false})),
   props:[...propUsed].map(([id,continuity])=>({id,continuity,visuallyVerified:false})),
   animalBehavior:'Mouth, nose, muzzle and grounded paws only, no human hands or disappearing objects',
   music:'Use approved actual In This Town series music source; never synthesize a stand-in',
   narration:'A NEW approved narration track is required for each NEW episode (do not reuse Episode02 voice)'
  },
  production:{state:'STORYBOARD_DRAFT_ONLY',animatedScenesImplemented:0,
   actualVideoRendered:false,visualApproval:false,sourceMusicRightsVerified:false,
   paidRequests:0,publishingAllowed:false,autonomousVisionCorrectionAvailable:false},
  warnings};
}

export async function createWorkspace(story,opts={}){
 const plan=compileStory(story,opts);
 const folder=path.resolve(opts.outputDir||path.join(studio,'production',plan.projectId));
 // Never create an unexpected directory outside studio without explicit --out-dir.
 if(!opts.outputDir&&!folder.startsWith(path.join(studio,'production')+path.sep))
  throw new Error('Unsafe output path');
 if(await fs.stat(folder).then(()=>true,()=>false))
  throw new Error('Workspace already exists: '+folder+' (no files overwritten). Choose a new --slug.');
 await fs.mkdir(folder,{recursive:true});
 const blueprint={projectId:plan.projectId,styleLock:STYLE,status:'PLAN_ONLY_NOT_RENDERABLE',
  shots:plan.storyBeats.map(b=>({id:b.id,sourceParagraph:b.sourceParagraph,
   narrationAnchor:b.narrationText,location:b.location,cast:b.castMentions,
   props:b.propReferences,actionTypes:b.actionTypes,requiredVisibleAction:b.mustShow,
   cameraIntent:b.cameraIntent,continuityChecks:b.continuityChecks,
   performanceImplementation:null,cameraImplementation:null,
   beginningFrame:null,endingFrame:null,approved:null}))};
 const files={
  'USER_STORY.txt':String(story).trim()+'\n',
  'EPISODE_PLAN.json':JSON.stringify(plan,null,2)+'\n',
  'SHOT_BLUEPRINT.json':JSON.stringify(blueprint,null,2)+'\n',
  'ASSET_REQUIREMENTS.json':JSON.stringify(plan.requirements,null,2)+'\n',
  'PRODUCTION_STATUS.json':JSON.stringify(plan.production,null,2)+'\n',
  'README.md':`# ${plan.title}

Generated from ONE creator story prompt. **${plan.storyBeatCount} editorial beat drafts, not ${plan.storyBeatCount} animated shots.**

Original user words are in USER_STORY.txt. Every beat has a trace to that source, an action, camera intent and continuity check. You are not asked to manually author a shot list.

**Follow** repository root AGENTS.md, ONE_PROMPT_IN_THIS_TOWN.md and the approved Episode 01 style lock.

## Next pipeline stages
1. Inspect this automated initial story plan; identify missing physical action/locations. A production coding agent must implement the visual performances using the original Episode01 rig and camera system.
2. Source build / TypeScript / scene continuity tests. Use true named assets, physically grounded contact, stable box IDs and actual locations.
3. Only after source readiness, render shot previews and inspect **moving** footage frame by frame. Correct failures and rerender only affected shots.
4. Obtain a separate approved voice performance and real word-level timings for this new story. Do not reuse the Episode02 narration or spend provider credits without approval.
5. Reuse the privately supplied approved series soundtrack only if licensed for the new episode, keep foley, mix and verify final H264/AAC output. Require creator signoff before publishing.

**Not built automatically:** source animation/choreography code, a local renderer connected to an autonomous vision agent, creative parity proof. This script intentionally stops at planning; it must not claim to have delivered a movie.
`
 };
 for(const [name,content] of Object.entries(files))await fs.writeFile(path.join(folder,name),content);
 return {folder,projectId:plan.projectId,beats:plan.storyBeatCount,files:Object.keys(files)};
}

async function cli(){
 const args=process.argv.slice(2);
 if(args.includes('--help')||args.includes('-h')){
  console.log('Usage: npm.cmd run inthis:next -- --story-file C:\\path\\story.txt --title "Episode Title" [--slug id] [--out-dir folder]');
  console.log('Creates a non-destructive storyboard/asset/continuity starter, NOT a rendered movie or paid voice.');
  return;
 }
 const val=(key)=>{const i=args.indexOf(key);return i>=0?args[i+1]:undefined;};
 const file=val('--story-file'),direct=val('--prompt');
 if(Boolean(file)===Boolean(direct))
  throw new Error('Supply exactly one --story-file <text file> OR --prompt "<story text>". Use --help for details.');
 const story=file?await fs.readFile(path.resolve(file),'utf8'):direct;
 const result=await createWorkspace(story,{title:val('--title'),slug:val('--slug'),outputDir:val('--out-dir')});
 console.log(JSON.stringify({stage:'ONE_PROMPT_STORYBOARD_CREATED_NOT_ANIMATED',...result,
  next:'Open SHOT_BLUEPRINT.json and use the Episode01 coding/renderer pipeline; no videos or paid requests created.'},null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 cli().catch(e=>{console.error('ONE_PROMPT_ERROR: '+e.message);process.exitCode=1;});
