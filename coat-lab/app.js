import {COLORS,PATTERNS,evaluateRanking,makeRecord,toCSV} from './coat-logic.js';
const $=id=>document.getElementById(id);
const input=$('photo'),preview=$('preview'),button=$('analyze'),status=$('status'),results=$('results');
const trueColor=$('actual-color'),truePattern=$('actual-pattern'),record=$('record'),download=$('download'),clear=$('clear');
let selected=null,url=null,model=null,loading=null,busy=false,current=null;
const records=[];
function say(s){status.textContent=s;}
for(const [select,choices] of [[trueColor,COLORS],[truePattern,PATTERNS]]){
  for(const c of choices){const o=document.createElement('option');o.value=c.label;o.textContent=c.label;select.append(o);}
}
function busyState(on){busy=on;input.disabled=on;trueColor.disabled=on;truePattern.disabled=on;button.disabled=on||!selected||!preview.naturalWidth;}
input.addEventListener('change',()=>{
  current=null;results.hidden=true;record.disabled=true;$('record-status').textContent='';
  selected=null;button.disabled=true;preview.hidden=true;
  if(url){URL.revokeObjectURL(url);url=null;}
  const file=input.files?.[0];
  if(!file){say('Choose a cat photo to begin.');return;}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){say('Choose a JPG, PNG, or WebP under 10 MB.');return;}
  selected=file;url=URL.createObjectURL(file);
  preview.onload=()=>{button.disabled=false;say('Ready to analyze!');};
  preview.onerror=()=>{selected=null;button.disabled=true;say('Could not open this photo.');};
  preview.src=url;preview.hidden=false;say('Opening photo…');
});
async function getModel(){
  if(model)return model;
  if(!loading)loading=(async()=>{
    say('Loading the experimental AI model. First download may take a while…');
    const {pipeline}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
    return pipeline('zero-shot-image-classification','Xenova/clip-vit-base-patch32');
  })();
  try{model=await loading;return model;}finally{loading=null;}
}
async function prepareImage(file){
  const bitmap=await createImageBitmap(file);
  try{
    const scale=Math.min(1,640/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const {RawImage}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
    return RawImage.fromCanvas(canvas);
  }finally{bitmap.close?.();}
}
function show(prefix,ranking){
  $(prefix+'-name').textContent=ranking.best.label+(ranking.closeCall?' (close call)':'');
  $(prefix+'-score').textContent='Relative model score: '+(ranking.best.score*100).toFixed(1)+'%';
  const box=$(prefix+'-alternatives');box.replaceChildren();
  if(ranking.closeCall){const p=document.createElement('p');p.className='note-warning';p.textContent='The top two choices are close; treat this as uncertain.';box.append(p);}
  const p=document.createElement('p');p.textContent='Other possibilities:';box.append(p);
  const list=document.createElement('ul');
  for(const a of ranking.alternatives){const li=document.createElement('li');li.textContent=a.label+' — '+(a.score*100).toFixed(1)+'%';list.append(li);}
  box.append(list);
}
button.addEventListener('click',async()=>{
  if(busy||!selected)return;
  busyState(true);results.hidden=true;current=null;
  try{
    const classifier=await getModel();
    say('Preparing photo…');const image=await prepareImage(selected);
    say('Comparing colors…');const colors=await classifier(image,COLORS.map(c=>c.prompt),{top_k:null});
    say('Comparing patterns…');const patterns=await classifier(image,PATTERNS.map(c=>c.prompt),{top_k:null});
    current={color:evaluateRanking(colors,COLORS),pattern:evaluateRanking(patterns,PATTERNS),actualColor:trueColor.value,actualPattern:truePattern.value};
    show('color',current.color);show('pattern',current.pattern);
    record.disabled=false;$('record-status').textContent='';results.hidden=false;say('Done! Compare the guesses with your cat.');
  }catch(e){console.error(e);say('Could not run the model. Check internet access and device memory, then retry.');}
  finally{busyState(false);}
});
function render(){
  $('counter').textContent=records.length+' sample'+(records.length===1?'':'s');
  download.disabled=clear.disabled=!records.length;
  function score(field,correct){const labeled=records.filter(r=>r[field]!=='');const n=labeled.filter(r=>r[correct]==='true').length;return labeled.length?n+'/'+labeled.length+' correct':'no labeled examples';}
  $('metrics').textContent='Color: '+score('annotated_color','color_correct')+' · Pattern: '+score('annotated_pattern','pattern_correct');
}
record.addEventListener('click',()=>{
  if(!current)return;
  records.push(makeRecord(records.length+1,current.color,current.pattern,current.actualColor,current.actualPattern));
  current=null;record.disabled=true;$('record-status').textContent='Recorded in this tab. Export before closing.';render();
});
download.addEventListener('click',()=>{
  if(!records.length)return;
  const blob=new Blob([toCSV(records)],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='cat-coat-lab-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
clear.addEventListener('click',()=>{
  if(!records.length||!confirm('Clear the session test log? Export it first if you want to keep it.'))return;
  records.length=0;render();
});
render();