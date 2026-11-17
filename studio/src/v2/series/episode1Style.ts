import type {GradeParams} from '../../videos/bridge/grade';

/**
 * Locked visual defaults lifted from approved Episode 01.
 * Original Episode 01 source remains unchanged.
 * Story-specific staging, acting and night/day lighting still require review.
 */
const grade:GradeParams={
 ky:[.015,.09,.26,.52,.77,.92,1],
 sat:[.92,.98,.90],
 tintS:[.008,.002],
 tintM:[0,.002],
 tintH:[-.003,.002],
 vig:[.10,.4],
};
export const EPISODE1_STYLE={
 referenceSeries:'In This Town',
 referenceEpisode:'The Door at 11:11',
 format:{width:1080,height:1920,fps:30},
 grade,
 ink:{color:'#262737',widthNear:2.5,widthFar:1.7,creaseScale:.55,strength:.8},
 bloom:{intensity:.18,luminanceThreshold:1.05,luminanceSmoothing:.25,mipmapBlur:true,levels:5,radius:.5},
 lens:{maxCoC:8,nearScale:.5},
 character:{
  tint:[1,.96,.92] as [number,number,number],
  shade:.88,gradient:.055,bodyGradient:.15,
  sideTint:[.80,.88,1] as [number,number,number],
 },
 nightBackground:'#14283c',
 duskyBackground:'#aa756b',
} as const;
