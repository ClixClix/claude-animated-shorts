/** One list used by code audit, full review and final checks. Never requests media APIs. */
export const sourceChecks=[
 {name:'TypeScript',script:'node_modules/typescript/bin/tsc',args:['--noEmit']},
 {name:'Approved narration/edit/director agreement',script:'src/v2/episodes/in-this-town-02/tools/locked-edit-gate.mjs'},
 {name:'Original Episode01 appearance',script:'scripts/episode02-style-preflight.mjs'},
 {name:'Live director assets',script:'scripts/episode02-director-preflight.mjs',args:['--strict']},
 {name:'Physical cardboard and protected cafe fixtures',script:'scripts/episode02-box-tests.mjs'},
 {name:'Actual narration-aligned action evidence',script:'scripts/episode02-live-action-evidence.mjs',args:['--strict']},
 {name:'Current finale and rescue transforms',script:'scripts/episode02-finale-audit.mjs'},
 {name:'Real mesh camera and body obstruction probes',script:'src/v2/episodes/in-this-town-02/tools/scene-visibility-test.mjs'},
];
