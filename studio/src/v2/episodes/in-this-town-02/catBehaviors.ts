import type {V3} from '../../cafe/config';
import type {State} from './timeline';
import {BOX_SPECS} from './boxProps';

/**
 * Episode 02 animal-behavior contract:
 * Cats can sniff, nose-nudge and gently grip cardboard with their MOUTHS.
 * They can step, tap and balance on PAWS. They NEVER hold objects with
 * hand-like paws, point with forelimbs or extend a human-style arm.
 */
export type CatBehavior={
 mode:'sniff'|'nose-nudge'|'mouth-carry'|'muzzle-comfort';
 target:V3;intensity:number;
};
const lip=(pos:V3,kind:'latte'|'essie'|'shared'):V3=>{
 const spec=BOX_SPECS[kind];
 return [pos[0]+spec.width*.39,pos[1]+spec.height+.045,pos[2]+spec.depth*.38];
};
const ease=(v:number)=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x);};
const pulse=(u:number)=>ease(u/.23)*(1-ease((u-.75)/.22));
// Two discrete, supported feline muzzle taps, not an invented reaching arm.
const tap=(u:number,at:number)=>ease((u-at+.10)/.07)*(1-ease((u-at-.02)/.08));
export function catBehaviorFor(
 s:State,id:'mocha'|'essie'|'latte'
):CatBehavior|null{
 const n=s.shot.sequence;
 if(id==='mocha'){
  if(n===18)return{
   // Mocha catches Essie by the neck floof during the outside chase.
   // The face leans in without adding hands or replacing Episode01 body art.
   mode:'muzzle-comfort',
   target:[s.essie.position[0]-.14,s.essie.position[1]+.52,s.essie.position[2]],
   intensity:.74*pulse(s.u)
  };
  if(n===42)return{
   // Contact with the physical box front flap as he brings it closer.
   mode:'mouth-carry',target:lip(s.essieBox,'essie'),intensity:.92*pulse(s.u)
  };
  if([12,13,16].includes(n))return{
   mode:n===16?'sniff':'nose-nudge',target:lip(s.latteBox,'latte'),
   intensity:n===13?.42:.68*pulse(s.u)};
  if(n===20)return{mode:'muzzle-comfort',
   target:[s.essie.position[0],s.essie.position[1]+.47,s.essie.position[2]],
   intensity:.68*pulse(s.u)};
  if([41,42,43,48].includes(n))return{
   mode:'nose-nudge',target:lip(s.essieBox,'essie'),
   intensity:n===41?1.15*(tap(s.u,.29)+tap(s.u,.70)):.55*pulse(s.u)};
  // During rescue, Mocha places his WHOLE BODY into the boxes using his
  // paws, not a foreleg reaching toward something like a human hand.
  if(n===49||n===54||n===59)return null;
 }
 if(id==='essie'){
  if(n===32)return{mode:'mouth-carry',
   target:lip(s.essieBox,'essie'),intensity:.55};
  if(n===54)return{mode:'nose-nudge',
   target:lip(s.latteBox,'latte'),intensity:.50*pulse(s.u)};
 }
 // Latte springs out under his own power: no long artificial reaching arm.
 return null;
}
