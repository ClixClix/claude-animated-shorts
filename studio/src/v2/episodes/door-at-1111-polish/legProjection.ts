/** Map the ankle to its projected planted foot while keeping the hip attached to the body.
 * The old adapter translated the entire leg, including its hip, to chase the foot. */
export function legProjection(hipX:number,footX:number,footY:number,lift:number):[number,number,number,number,number,number]{
 const hipY=370,ankleY=483-lift,span=ankleY-hipY;
 const shear=(footX-hipX)/span,stretch=(footY-hipY)/span;
 return [1,0,shear,stretch,-shear*hipY,hipY*(1-stretch)];
}
