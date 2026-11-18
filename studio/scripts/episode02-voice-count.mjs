// Safe preflight only. Never contacts ElevenLabs or generates audio.
import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const text=(await fs.readFile('src/v2/episodes/in-this-town-02/DRAFT_BOX_NARRATION.txt','utf8')).trim();
const chars=[...text].length;
const sha256=createHash('sha256').update(text).digest('hex');
console.log(JSON.stringify({
 stage:'EP02_ADAM_VOICE_REQUEST_PREFLIGHT_ONLY',
 narrator:'Adam',voiceId:'pNInz6obpgDQGcFmaJgB',
 model:'eleven_multilingual_v2',series:'in_this_town',
 characters:chars,scriptSHA256:sha256,estimatedCredits:'NOT_KNOWN',
 voiceGenerationRequiresExplicitProviderCostApproval:true,
 approvalCommand:'npm.cmd run episode2:generate-adam -- --allow-paid --rotated-key-confirmed --approve-characters '+chars,
 providerCalls:0
},null,2));
