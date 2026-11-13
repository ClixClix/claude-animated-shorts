/** Original illustrated palettes. No reference photographs are loaded by this project. */
export type CatId = 'mocha' | 'essie' | 'latte';
export type CatDesign = {
  name: string; coat: string; light: string; shadow: string; marking: string;
  bib: string; muzzle: string; ear: string; iris: string; nose: string;
  headWidth: number; cheek: number; bodyWidth: number; tailWidth: number;
  description: string;
};
export const CAT_IDS: CatId[] = ['mocha', 'essie', 'latte'];
export const DESIGNS: Record<CatId, CatDesign> = {
  mocha: {name:'Mocha', coat:'#92958d', light:'#b7bbb0', shadow:'#737a77', marking:'#505b59',
    bib:'#fff8e8', muzzle:'#fff8e8', ear:'#d9aaa4', iris:'#c1be63', nose:'#c48e89',
    headWidth:101, cheek:24, bodyWidth:92, tailWidth:49,
    description:'Silver tabby · white ruff & socks · plume tail'},
  essie: {name:'Essie', coat:'#303039', light:'#484650', shadow:'#24232c', marking:'#1e2029',
    bib:'#f3eddf', muzzle:'#f3eddf', ear:'#775b68', iris:'#b9c877', nose:'#59505b',
    headWidth:103, cheek:30, bodyWidth:94, tailWidth:42,
    description:'Black longhair · small white chin · white whiskers'},
  latte: {name:'Latte', coat:'#eadbc0', light:'#f9edda', shadow:'#c5b79f', marking:'#5a463f',
    bib:'#fff1d9', muzzle:'#e8d6bc', ear:'#a4807c', iris:'#acc6cd', nose:'#9f7d78',
    headWidth:99, cheek:23, bodyWidth:98, tailWidth:43,
    description:'Cream longhair · chocolate points · pale muzzle'},
};
