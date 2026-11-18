import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {compileStory,createWorkspace} from './series-one-prompt.mjs';

const story=`In this town, a cat jumps into a striped box and becomes the box.
Mocha checks the bus stop and the empty market. He runs through every alley he can find.

Essie drags her cardboard box to the quiet corner, then Mocha pulls her out. At home, Essie sleeps in her cat bed. The next morning, the cats climb inside a box together.`;

test('one natural story generates traceable show-not-tell beats',()=>{
 const plan=compileStory(story,{title:'Box Story'});
 assert.equal(plan.series,'In This Town');
 assert.ok(plan.storyBeatCount>=6);
 assert.equal(plan.storyBeats.at(0).sourceParagraph,1);
 assert.ok(plan.storyBeats.some(b=>b.actionTypes.includes('enter-box')));
 assert.ok(plan.storyBeats.some(b=>b.actionTypes.includes('transform-to-box')));
 assert.ok(plan.storyBeats.some(b=>b.actionTypes.includes('mouth-contact')));
 assert.equal(plan.requirements.minimumDistinctAlleys,3);
 for(const place of ['market','bus-stop','alley','house'])assert.ok(plan.requirements.locations.some(x=>x.id===place),place);
 for(const prop of ['striped-box','cat-bed'])assert.ok(plan.requirements.props.some(x=>x.id===prop),prop);
 assert.ok(plan.storyBeats.every(b=>b.mustShow&&b.cameraIntent&&b.continuityChecks.length>0));
 assert.equal(plan.production.actualVideoRendered,false);
 assert.equal(plan.production.publishingAllowed,false);
});

test('single prompt creates an isolated, non-overwriting local project',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'in-this-town-oneprompt-'));
 const output=path.join(tmp,'ep-next');
 try{
  const result=await createWorkspace(story,{title:'Next Episode',outputDir:output});
  assert.equal(result.folder,output);
  const files=await fs.readdir(output);
  for(const name of ['USER_STORY.txt','EPISODE_PLAN.json','SHOT_BLUEPRINT.json','ASSET_REQUIREMENTS.json','PRODUCTION_STATUS.json','README.md'])
   assert.ok(files.includes(name),name);
  const blueprint=JSON.parse(await fs.readFile(path.join(output,'SHOT_BLUEPRINT.json'),'utf8'));
  assert.ok(blueprint.shots.every(s=>s.performanceImplementation===null&&s.cameraImplementation===null));
  await assert.rejects(createWorkspace(story,{title:'Next Episode',outputDir:output}),/already exists/);
  assert.match(await fs.readFile(path.join(output,'README.md'),'utf8'),/not.*animated shots/i);
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});

test('empty or truncated prompt is rejected rather than pretending to produce a film',()=>{
 assert.throws(()=>compileStory('cats'),/real story prompt/);
});

test('natural past-tense transformation, three different alleys and Espresso alias remain traceable',()=>{
 const story='In this town, Espresso became a box beside the cafe. Mocha searched three different alleys while Latte watched from the window. At the end Espresso walks home to her cat bed.';
 const plan=compileStory(story,{title:'Past Tense'});
 assert.ok(plan.storyBeats.some(b=>b.actionTypes.includes('transform-to-box')),'became a box must generate a physical transformation beat');
 assert.equal(plan.requirements.minimumDistinctAlleys,3,'three different alleys must require three distinct sets');
 assert.ok(plan.storyBeats.some(b=>b.castMentions.includes('essie')),'Espresso is the same canonical Essie rig');
 assert.ok(!plan.storyBeats.some(b=>b.castMentions.includes('espresso')),'avoid a duplicate Espresso actor');
 assert.equal(plan.production.actualVideoRendered,false,'planning never certifies CGI');
});
