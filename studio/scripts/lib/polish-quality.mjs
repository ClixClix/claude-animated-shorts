// Read the actual per-frame Remotion audits before spending time on the rest of a preview.
export const criticalShots=['01A','01B','21','22','30','31','44','47','53','56','58C','59A','60C'];
const clearSubjects=new Set(['latte','mocha','essie','kitten','clock','clock-left','clock-right','clock-top','clock-bottom','sign','sign-left','sign-right','sign-top','sign-bottom','bus','bus-front','bus-rear','bus-roof','bus-wheels','shelter-guest']);
export function qualityErrors(audits){
 const errors=[];
 for(const a of audits){
  if(a.earlyInteriorVisible)errors.push({frame:a.frame,issue:'Cafe occupants visible before reveal'});
  if(a.sourceShot<50&&a.openerVisible)errors.push({frame:a.frame,issue:'Unknown opener revealed early'});
  if(a.sourceShot<46&&(a.kittenVisible||a.kittenPawVisible))errors.push({frame:a.frame,issue:'Kitten revealed early'});
  if(a.cameraHits?.length)errors.push({frame:a.frame,issue:'Camera inside geometry',hits:a.cameraHits});
  for(const v of a.visibility??[])if(clearSubjects.has(v.id)&&(!v.inFrame||v.occluder))errors.push({frame:a.frame,issue:'Critical subject obstructed or outside frame',id:v.id,occluder:v.occluder});
 }
 return errors;
}
