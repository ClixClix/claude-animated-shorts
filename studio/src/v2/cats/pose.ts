export const EXPRESSIONS = ['neutral','happy','sad','scared','surprised','concerned'] as const;
export type CatExpression = typeof EXPRESSIONS[number];
export type CatView = 'front' | 'three-quarter' | 'side';
export const VIEW_YAW: Record<CatView, number> = {front:0, 'three-quarter':0.58, side:1};
/** All angles are radians; yaw, gaze and gestures are normalized. Positive yaw faces right. */
export type CatPose = {
  yaw: number; headTurn: number; headTilt: number; expression: CatExpression;
  gazeX: number; gazeY: number; blink: number; earLeft: number; earRight: number;
  tail: number; breath: number; gait: number; walking: boolean;
};
export const REST_POSE: CatPose = {yaw:0, headTurn:0, headTilt:0, expression:'neutral',
  gazeX:0, gazeY:0, blink:0, earLeft:0, earRight:0, tail:0, breath:0, gait:0, walking:false};
export const clamp = (v: number, a=-1, b=1) => Math.max(a,Math.min(b,v));
/** Frame-independent rig evaluation: no timers, accumulated state, or random calls. */
export function catMotion(seconds: number, motion: 'idle' | 'walk' = 'idle', seed=0): Partial<CatPose> {
  const t=seconds+seed*0.71, cycle=((t%3.7)+3.7)%3.7;
  const blink=Math.max(0,1-Math.abs(cycle-3.4)/0.095);
  return {blink, breath:Math.sin(t*2.1), tail:Math.sin(t*1.15)*0.35,
    earLeft:Math.sin(t*1.7)*0.07, earRight:Math.sin(t*1.3+0.6)*0.06,
    headTilt:Math.sin(t*0.8)*0.025, walking:motion==='walk', gait:t*Math.PI*2*1.25};
}
export function resolvePose(p: Partial<CatPose> = {}): CatPose {
  const q={...REST_POSE,...p};
  return {...q,yaw:clamp(q.yaw),headTurn:clamp(q.headTurn),headTilt:clamp(q.headTilt,-0.45,0.45),
    gazeX:clamp(q.gazeX),gazeY:clamp(q.gazeY),blink:clamp(q.blink,0,1),
    earLeft:clamp(q.earLeft),earRight:clamp(q.earRight),tail:clamp(q.tail),breath:clamp(q.breath)};
}
