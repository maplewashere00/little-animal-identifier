'use strict';
export const COLORS = Object.freeze([
  { id:'black', label:'Black', prompt:'A clear photo of a domestic cat with mostly black fur.' },
  { id:'gray', label:'Gray', prompt:'A clear photo of a domestic cat with mostly gray or blue-gray fur.' },
  { id:'brown', label:'Brown', prompt:'A clear photo of a domestic cat with mostly brown fur.' },
  { id:'orange', label:'Orange / ginger', prompt:'A clear photo of a domestic cat with mostly orange or ginger fur.' },
  { id:'white', label:'White', prompt:'A clear photo of a domestic cat with mostly white fur.' },
  { id:'cream', label:'Cream / buff', prompt:'A clear photo of a domestic cat with mostly pale cream or buff fur.' },
  { id:'mixed', label:'Mixed colors', prompt:'A clear photo of a domestic cat with fur in several distinctly different colors.' }
]);
export const PATTERNS = Object.freeze([
  { id:'tabby-stripes', label:'Striped tabby', prompt:'A clear photo of a tabby cat with narrow dark stripes along its fur.' },
  { id:'tabby-swirls', label:'Swirled tabby', prompt:'A clear photo of a classic tabby cat with broad swirl markings on its fur.' },
  { id:'spotted', label:'Spotted', prompt:'A clear photo of a domestic cat with distinct spotted fur markings.' },
  { id:'solid', label:'Solid', prompt:'A clear photo of a solid-colored cat with no visible stripes or patches.' },
  { id:'tuxedo', label:'Tuxedo', prompt:'A clear photo of a tuxedo cat, black with a white chest and white paws.' },
  { id:'bicolor', label:'Bicolor / with white', prompt:'A clear photo of a bicolor domestic cat with white fur and another fur color.' },
  { id:'calico', label:'Calico', prompt:'A clear photo of a calico cat with distinct white, orange and black fur patches.' },
  { id:'tortoiseshell', label:'Tortoiseshell', prompt:'A clear photo of a tortoiseshell cat with mottled black and orange fur.' },
  { id:'colorpoint', label:'Colorpoint', prompt:'A clear photo of a colorpoint cat with a darker face, ears, paws and tail.' }
]);
export function evaluateRanking(raw,candidates) {
  if(!Array.isArray(raw)||!Array.isArray(candidates)||candidates.length<2)throw new TypeError('Expected model scores and candidates');
  const map=new Map(candidates.map(c=>[c.prompt,c]));
  if(map.size!==candidates.length)throw new TypeError('Duplicate prompts');
  const found=[];const used=new Set();
  for(const p of raw){
    if(!p||typeof p.label!=='string'||!Number.isFinite(p.score)||p.score<0||p.score>1)throw new TypeError('Malformed prediction');
    const c=map.get(p.label);
    if(!c||used.has(c.id))throw new TypeError('Unknown or duplicate label');
    used.add(c.id);found.push({id:c.id,label:c.label,score:p.score});
  }
  if(used.size!==candidates.length)throw new TypeError('Incomplete predictions');
  found.sort((a,b)=>b.score-a.score);
  return {best:found[0],alternatives:found.slice(1,3),gap:found[0].score-found[1].score,closeCall:found[0].score-found[1].score<.08,all:found};
}
export function makeRecord(index,color,pattern,trueColor='',truePattern=''){
  if(!Number.isSafeInteger(index)||index<1||!color||!pattern)throw new TypeError('Invalid test record');
  return {sample:'sample-'+index,predicted_color:color.best.label,color_relative_score:color.best.score,predicted_pattern:pattern.best.label,pattern_relative_score:pattern.best.score,annotated_color:trueColor,annotated_pattern:truePattern,color_correct:trueColor?String(trueColor===color.best.label):'',pattern_correct:truePattern?String(truePattern===pattern.best.label):''};
}
export function toCSV(records){
  const keys=['sample','predicted_color','color_relative_score','predicted_pattern','pattern_relative_score','annotated_color','annotated_pattern','color_correct','pattern_correct'];
  const quote=v=>{const s=String(v??'');const safe=/^[=+@\-\t\r]/.test(s)?"'"+s:s;return '"'+safe.replace(/"/g,'""')+'"';};
  return [keys.join(','),...records.map(r=>keys.map(k=>quote(r[k])).join(','))].join('\r\n')+'\r\n';
}
