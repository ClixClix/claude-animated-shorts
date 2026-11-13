/** Metres, Y up. Street/front is +Z; preparation/back is -Z. No shot owns geometry. */
export type V3 = [number,number,number];
export type Role='serving-counter'|'preparation-counter'|'customer-table'|'chair'|'bench'|'riser'|'espresso-machine'|'grinder'|'shelf'|'mug'|'pastry-plate'|'pendant'|'plant'|'menu'|'rug';
export type Fixture={id:string;role:Role;position:V3;size:V3;rotation?:number;support?:string;color?:string;surface?:number};
const fixture=(id:string,role:Role,position:V3,size:V3,extra:Partial<Fixture>={}):Fixture=>({id,role,position,size,...extra});
export const ROOM={width:8,depth:8.4,height:4.5,front:4.2,back:-4.2,half:4,floor:0};
/** Position is the bottom centre of a fixture, size is its conservative occupancy box. */
export const FIXTURES:Fixture[]=[
 fixture('counter-serving','serving-counter',[-1.35,0,-0.95],[4.4,1.12,0.9],{surface:1.12}),
 fixture('counter-preparation','preparation-counter',[-1.35,0,-3.55],[4.4,1.12,1.0],{surface:1.12}),
 fixture('barista-riser','riser',[0.02,0,-2.08],[1.05,0.60,1.0],{surface:0.60}),
 fixture('table-window-front','customer-table',[1.95,0,2.13],[1.05,0.83,1.05],{surface:0.83}),
 fixture('table-window-back','customer-table',[2.38,0,-1.14],[1.05,0.83,1.05],{surface:0.83}),
 fixture('chair-front-west','chair',[0.96,0,2.13],[0.54,1.03,0.54],{rotation:Math.PI/2,color:'#b8874e'}),
 fixture('chair-front-east','chair',[2.94,0,2.13],[0.54,1.03,0.54],{rotation:-Math.PI/2,color:'#b8874e'}),
 fixture('chair-back-north','chair',[2.38,0,-2.14],[0.54,1.03,0.54],{rotation:0,color:'#8caa9a'}),
 fixture('chair-back-south','chair',[2.38,0,-0.14],[0.54,1.03,0.54],{rotation:Math.PI,color:'#8caa9a'}),
 fixture('cat-bench','bench',[-2.9,0,0.25],[1.6,0.46,1.12],{surface:0.46}),
 fixture('cat-rug','rug',[-2.75,0.007,0.35],[2.0,0.012,2.05]),
 fixture('espresso','espresso-machine',[-0.98,1.12,-3.55],[1.24,0.68,0.63],{support:'counter-preparation',color:'#b15e42'}),
 fixture('grinder','grinder',[0.12,1.12,-3.55],[0.34,0.73,0.35],{support:'counter-preparation'}),
 fixture('pastry-display','pastry-plate',[-2.65,1.12,-0.95],[0.65,0.22,0.54],{support:'counter-serving'}),
 fixture('service-mug','mug',[0.15,1.12,-0.83],[0.2,0.23,0.2],{support:'counter-serving',color:'#e7cca3'}),
 fixture('shelf-lower','shelf',[-1.2,2.27,-3.98],[4.2,0.10,0.35],{surface:2.37}),
 fixture('shelf-upper','shelf',[-1.2,3.02,-3.98],[4.2,0.10,0.35],{surface:3.12}),
 ...[-2.65,-2.24,-1.83].map((x,i)=>fixture(`shelf-cup-${i+1}`,'mug',[x,2.37,-3.98],[0.2,0.22,0.2],{support:'shelf-lower',color:['#d89362','#a8bba7','#f1dbb0'][i]})),
 fixture('window-table-mug-front','mug',[1.82,0.83,2.13],[0.2,0.21,0.2],{support:'table-window-front',color:'#a8c2b5'}),
 fixture('window-table-mug-back','mug',[2.25,0.83,-1.14],[0.2,0.21,0.2],{support:'table-window-back',color:'#f5dfb6'}),
 fixture('pendant-service','pendant',[-1.3,3.28,-0.85],[0.66,1.22,0.66]),
 fixture('pendant-table-front','pendant',[1.95,3.35,2.13],[0.62,1.15,0.62]),
 fixture('pendant-table-back','pendant',[2.38,3.35,-1.14],[0.62,1.15,0.62]),
 fixture('entrance-plant','plant',[-3.25,0,3.35],[0.58,1.4,0.58]),
 fixture('menu-board','menu',[-3.91,1.80,-1.95],[0.1,1.25,1.08],{rotation:Math.PI/2}),
];
export const OPENINGS=[
 {id:'front-window-left',wall:'front',center:-1.45,width:4.45,bottom:0.8,top:3.65},
 {id:'entrance',wall:'front',center:2.25,width:1.45,bottom:0,top:3.65},
 {id:'side-window-front',wall:'right',center:1.9,width:3.1,bottom:0.85,top:3.65},
 {id:'side-window-back',wall:'right',center:-2.0,width:3.0,bottom:0.85,top:3.65},
] as const;
export const CAT_PLACEMENTS=[
 {id:'mocha',position:[-2.6,0.46,0.25] as V3,support:'cat-bench',height:1.52,heading:0.45},
 {id:'essie',position:[0.02,0.60,-2.08] as V3,support:'barista-riser',height:1.52,heading:0},
 {id:'latte',position:[-2.62,1.12,-3.52] as V3,support:'counter-preparation',height:1.52,heading:0.25},
] as const;
export type ShotId='exterior'|'interior-wide'|'counter-interaction'|'essie-closeup';
export type Shot={id:ShotId;position:V3;target:V3;fov:number;focus:V3;blur:number;required:string[]};
export const SHOTS:Shot[]=[
 {id:'exterior',position:[8.4,6.3,14.8],target:[0,2.45,0.6],fov:68,focus:[0,2,4.2],blur:0,required:['entrance','front-window-left']},
 {id:'interior-wide',position:[3.6,3.05,3.75],target:[-0.4,1.15,-0.4],fov:100,focus:[-0.5,1,-1],blur:0,required:['mocha','essie','latte','counter-serving','counter-preparation','table-window-front','table-window-back']},
 {id:'counter-interaction',position:[-0.3,2.2,3.8],target:[-1.65,1.5,-1.0],fov:83,focus:[0.02,1.4,-2.08],blur:0,required:['mocha','essie','latte','espresso']},
 {id:'essie-closeup',position:[1.02,1.69,-0.17],target:[0.02,1.37,-2.08],fov:35,focus:[0.02,1.37,-2.08],blur:7,required:['essie']},
];
export const CAFE_CONFIG={room:ROOM,fixtures:FIXTURES,openings:OPENINGS,cats:CAT_PLACEMENTS};
