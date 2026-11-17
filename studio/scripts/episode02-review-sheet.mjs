// Static preview review board. Human/visual agent review still required.
// Does not render or infer artistic pass/fail. No paid services.
import fs from 'node:fs/promises';
import path from 'node:path';
import {studioRoot} from './lib/runtime.mjs';
const source=path.join(studioRoot,'src/v2/episodes/in-this-town-02');
const queue=JSON.parse(await fs.readFile(path.join(source,'VISUAL_APPROVAL_QUEUE.json'),'utf8'));
const lock=JSON.parse(await fs.readFile(path.join(studioRoot,'src/v2/series/IN_THIS_TOWN_STYLE_LOCK.json'),'utf8'));
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02/ep1-asset-reuse-proof');
await fs.mkdir(out,{recursive:true});
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const frames=[];
for(const item of queue.keyShotChecks){
 const image='EP2_EP1_assets_shot_'+String(item.shot).padStart(2,'0')+'.png';
 const found=await fs.access(path.join(out,image)).then(()=>true,()=>false);
 frames.push({...item,image:found?image:null,artisticApproval:false});
}
const cards=frames.map(f=>[
 '<article><header><b>Shot '+String(f.shot).padStart(2,'0')+'</b> · '+safe(f.priority)+' priority</header>',
 f.image?'<img src="'+safe(f.image)+'" alt="Real rendered frame from Episode02 shot '+f.shot+'">':'<div class="missing">No render yet</div>',
 '<p>'+safe(f.notes)+'</p>',
 '<small>Creative approval: <strong>NOT APPROVED</strong></small></article>'
].join('\n')).join('\n');
const endingSamples=[
 [58,55],[58,93],[59,6],[59,24],[59,37],[59,50],[59,68],[59,90],
 [60,8],[60,50],[60,90]
];
const endingFrames=[];
for(const [shot,percent] of endingSamples){
 const image='EP2_FINALE_motion_'+String(shot).padStart(2,'0')+
  '_'+String(percent).padStart(2,'0')+'.png';
 const found=await fs.access(path.join(out,image)).then(()=>true,()=>false);
 endingFrames.push({shot,percent,image:found?image:null,artisticApproval:false});
}
const endingCards=endingFrames.map(item=>[
 '<article><header><b>Shot '+item.shot+'</b> · '+item.percent+'% of action</header>',
 item.image?'<img src="'+safe(item.image)+'" alt="Real cinematic motion sample">':
  '<div class="missing">No render yet</div>',
 '<p>Check the foot-to-rim relationship, visible ears, face direction and motivated move into one shared box.</p>',
 '<small>Motion and acting approval: <strong>NOT APPROVED</strong></small></article>'
].join('\n')).join('\n');
const criteria=queue.reviewCriteria.map(x=>'<li>'+safe(x)+'</li>').join('\n');
const html=[
 '<!doctype html><html lang="en"><head><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1">',
 '<title>In This Town — Episode 02 Style Review</title>',
 '<style>',
 'body{font-family:system-ui,Arial,sans-serif;background:#17252f;color:#f8f5ec;max-width:1500px;margin:0 auto;padding:25px}',
 'h1{margin-bottom:5px}p{line-height:1.55}li{margin-bottom:8px}',
 '.lead{color:#d5d9da;max-width:1000px}',
 '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:15px}',
 'article{background:#263845;padding:12px;border:1px solid #536674;border-radius:12px}',
 'article img{width:100%;aspect-ratio:9/16;object-fit:contain;background:#0e1b23;border-radius:7px}',
 'article header{margin-bottom:12px}article p{font-size:13px;min-height:85px}',
 'article small{display:block;border-top:1px solid #4a5962;padding-top:9px;color:#ffce97}',
 '.missing{aspect-ratio:9/16;display:grid;place-items:center;background:#10212b}',
 '</style></head><body>',
 '<h1>Episode 02 — Episode 01 Style Review</h1>',
 '<p class="lead">Reference: final Episode 01, The Door at 11:11. The original cast and visual settings are locked. These are actual Episode 02 preview frames, not visual approval. Review meaningful motion and sound separately.</p>',
 '<p>Original film fingerprint: '+safe(lock.referenceMp4Sha256.slice(0,16))+'… · Final format 1080×1920, 30fps · <b>Creative approval pending</b></p>',
 '<h2>Required visual checks</h2><ul>'+criteria+'</ul>',
 '<h2>Shot review — latest renders</h2><section class="grid">'+cards+'</section>',
 '<h2>Ending motion continuity — shots 58–60</h2>',
 '<p class="lead">Eleven actual progressive motion samples reveal whether Mocha clears the cardboard rim and joins Essie and Latte. A middle frame alone cannot show an entry path.</p>',
 '<section class="grid">'+endingCards+'</section>',
 '<p class="lead">Matching Episode 01 source assets and color settings cannot prove matching acting, staging, geography, emotional storytelling or music rights. Those require actual movie review.</p>',
 '</body></html>'
].join('\n');
await fs.writeFile(path.join(out,'EP2_STYLE_REVIEW.html'),html);
const packet={
 series:lock.series,episode:queue.episode,
 referenceMp4Sha256:lock.referenceMp4Sha256,
 stage:'REAL_RENDERED_FRAMES_REQUIRE_VISUAL_SIGNOFF',
 shots:frames,endingMotion:endingFrames,
 framesPresent:frames.filter(f=>f.image).length,
 framesMissing:frames.filter(f=>!f.image).map(f=>f.shot),
 creativeApproval:false,publishingAllowed:false
};
await fs.writeFile(path.join(out,'EP2_STYLE_REVIEW_PACKET.json'),JSON.stringify(packet,null,2)+'\n');
console.log(JSON.stringify({board:path.join(out,'EP2_STYLE_REVIEW.html'),framesPresent:packet.framesPresent,
 missing:packet.framesMissing,stage:packet.stage},null,2));
