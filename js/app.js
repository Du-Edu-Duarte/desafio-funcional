const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='desafio-funcional-thalison-3';
const EXEMPLOS=[['Mariana Costa','aluno'],['Rafael Oliveira','aluno'],['Juliana Alves','aluno'],['Pedro Henrique','nao'],['Camila Ribeiro','nao'],['Lucas Martins','aluno']];

let S=load()||{
  seq:1,
  participantes:EXEMPLOS.map(([nome,tipo],i)=>({id:i+1,num:i+1,nome,tipo,tel:'',exemplo:true})),
  prova:null
};
if(!load())S.seq=EXEMPLOS.length+1;
const LOGO_PADRAO=document.querySelector('.logo').src;
const CFG_PADRAO={titulo:'3º Desafio Funcional do Thalison',destaque:'Funcional',sub:'Cronometragem e classificação da prova',logo:null,cor:'#FFD21A'};
S.config={...CFG_PADRAO,...(S.config||{})};
const CORES=[['#FFD21A','Amarelo'],['#FF8A1F','Laranja'],['#C6F432','Verde-limão'],['#FF4D4D','Vermelho'],['#3DA5FF','Azul'],['#FF5FB4','Rosa'],['#B98CFF','Roxo'],['#F2F2F2','Branco']];
let tab='prova',filtro='todos',editId=null,confirmAction=null;

function load(){try{const d=localStorage.getItem(KEY);return d?JSON.parse(d):null;}catch(e){return null;}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}

function fmt(ms,cs=true){
  if(ms==null)return '—';ms=Math.max(0,ms);
  const t=Math.floor(ms/1000),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60,c=Math.floor(ms%1000/10);
  const base=(h?h+':'+String(m).padStart(2,'0'):String(m).padStart(2,'0'))+':'+String(s).padStart(2,'0');
  return cs?base+'.'+String(c).padStart(2,'0'):base;
}
const tipoTag=t=>t==='aluno'?'<span class="tag">Aluno</span>':'<span class="tag nao">Não aluno</span>';

/* ---------- prova ---------- */
const PROVA_NOVA=()=>({v:2,status:'aberta',res:{},hist:[]});
if(!S.prova||S.prova.v!==2)S.prova=PROVA_NOVA();
const getP=id=>S.participantes.find(x=>x.id===id);
const estado=r=>!r?'wait':r.run?'run':r.dnf?'dnf':'fin';
function contagem(){const n={wait:0,run:0,fin:0,dnf:0};S.participantes.forEach(p=>n[estado(S.prova.res[p.id])]++);return n;}
function terminou(){const n=contagem();return S.prova.status==='encerrada'||(S.participantes.length>0&&n.wait===0&&n.run===0);}
function iniciarP(id){
  if(S.prova.status!=='aberta'||S.prova.res[id])return;
  S.prova.res[id]={inicio:Date.now(),ms:null,dnf:false,run:true};S.prova.hist.push({tipo:'inicio',id});save();
  toast(`${getP(id).nome} largou!`);renderProva(id);
}
function finalizarP(id){
  const r=S.prova.res[id];if(!r||!r.run)return;
  const ms=Date.now()-r.inicio;if(ms<800)return; // evita toque duplo
  r.ms=ms;r.run=false;S.prova.hist.push({tipo:'fim',id});save();
  toast(`${getP(id).nome}: ${fmt(ms)}`);renderProva(id);checarFim();
}
function desistiu(id){
  const r=S.prova.res[id];if(!r||!r.run)return;
  r.run=false;r.dnf=true;r.ms=null;S.prova.hist.push({tipo:'dnf',id});save();renderProva();checarFim();
}
function checarFim(){if(terminou()&&S.prova.status!=='encerrada'){S.prova.status='encerrada';save();renderProva();toast('Todos terminaram! Resultado final pronto');}}
function desfazer(){
  const h=S.prova.hist.pop();if(!h)return;const r=S.prova.res[h.id],p=getP(h.id);
  if(p){
    if(h.tipo==='inicio'){delete S.prova.res[h.id];toast(`Largada de ${p.nome} desfeita`);}
    else if(r){r.run=true;r.dnf=false;r.ms=null;toast(`${h.tipo==='fim'?'Chegada':'Desistência'} de ${p.nome} desfeita. O cronômetro dele continua.`);}
  }
  S.prova.status='aberta';save();renderProva();
}
function encerrar(){
  Object.values(S.prova.res).forEach(r=>{if(r.run){r.run=false;r.dnf=true;r.ms=null;}});
  S.prova.status='encerrada';save();renderProva();toast('Prova encerrada');
}
function pedirConfirmacao(msg,fn){confirmAction=fn;$('#confirmMsg').textContent=msg;$('#confirmBox').hidden=false;}
function fecharConfirmacao(){confirmAction=null;$('#confirmBox').hidden=true;}

function renderProva(flashId){
  const st=S.prova.status,res=S.prova.res,n=contagem(),algum=Object.keys(res).length>0;
  $('#sumWait').textContent=n.wait;$('#sumRun').textContent=n.run;$('#sumFin').textContent=n.fin+(n.dnf?` +${n.dnf}`:'');
  const pill=$('#status');
  pill.textContent=st==='encerrada'?'Encerrada':n.run?`${n.run} na pista`:algum?'Em andamento':'Pronta para largar';
  pill.className='pill '+(st==='encerrada'?'ok':n.run?'run':'');
  $('#btnUndo').hidden=!S.prova.hist.length;
  $('#btnEnd').hidden=st==='encerrada'||!algum;
  $('#btnNew').hidden=!algum;
  $('#provaHint').textContent=st==='encerrada'?'Prova encerrada. Veja a aba Resultado.':'Toque em Iniciar quando a pessoa largar e toque de novo quando ela terminar.';
  if(!S.participantes.length){$('#grid').innerHTML='<div class="empty" style="grid-column:1/-1">Nenhum participante cadastrado. Vá em <b>Cadastro</b> para adicionar.</div>';return;}
  const q=$('#busca').value.trim().toLowerCase();
  const lista=S.participantes.filter(p=>!q||p.nome.toLowerCase().includes(q)||String(p.num)===q);
  const ordemE={run:0,wait:1,fin:2,dnf:3},pos=posicoes();
  lista.sort((a,b)=>{const ra=res[a.id],rb=res[b.id],ea=estado(ra),eb=estado(rb);
    if(ea!==eb)return ordemE[ea]-ordemE[eb];
    if(ea==='run')return ra.inicio-rb.inicio; if(ea==='fin')return ra.ms-rb.ms; return a.num-b.num;});
  if(!lista.length){$('#grid').innerHTML='<div class="empty" style="grid-column:1/-1">Ninguém encontrado com essa busca.</div>';return;}
  const fl=id=>flashId===id?' flash':'';
  $('#grid').innerHTML=lista.map(p=>{
    const r=res[p.id],e=estado(r);
    if(e==='run')return `<button type="button" class="pc run${fl(p.id)}" data-fim="${p.id}" aria-label="Finalizar ${esc(p.nome)}"><span class="num">${p.num}</span><span class="nm">${esc(p.nome)}</span><span class="sub"><span class="live" data-ini="${r.inicio}">00:00.00</span></span><span class="sub" style="grid-column:2">${tipoTag(p.tipo)}<span class="go">■ Toque para finalizar</span></span><span class="x" data-dnf="${p.id}" role="button" tabindex="0" title="Marcar desistência">Desistiu</span></button>`;
    if(e==='fin')return `<div class="pc fin${fl(p.id)}"><span class="num">${p.num}</span><span class="nm">${esc(p.nome)}</span><span class="sub"><span class="t">${fmt(r.ms)}</span><span>${pos[p.id]}º geral</span></span></div>`;
    if(e==='dnf')return `<div class="pc dnf"><span class="num">${p.num}</span><span class="nm">${esc(p.nome)}</span><span class="sub">${tipoTag(p.tipo)}<span>Não concluiu</span></span></div>`;
    if(st==='encerrada')return `<div class="pc idle dnf"><span class="num">${p.num}</span><span class="nm">${esc(p.nome)}</span><span class="sub">${tipoTag(p.tipo)}<span>Não largou</span></span></div>`;
    return `<button type="button" class="pc wait" data-ini-id="${p.id}" aria-label="Iniciar ${esc(p.nome)}"><span class="num">${p.num}</span><span class="nm">${esc(p.nome)}</span><span class="sub">${tipoTag(p.tipo)}<span class="go">▶ Iniciar</span></span></button>`;
  }).join('');
  tickTimers();
}
function tickTimers(){const now=Date.now();document.querySelectorAll('[data-ini]').forEach(el=>el.textContent=fmt(now-+el.dataset.ini));}
function loop(){tickTimers();requestAnimationFrame(loop);}

/* ---------- cadastro ---------- */
function proxNum(){return S.participantes.reduce((m,p)=>Math.max(m,p.num),0)+1;}
function salvarCad(e){
  e.preventDefault();
  const nome=$('#cNome').value.trim().replace(/\s+/g,' '),tipo=document.querySelector('input[name=tipo]:checked').value,tel=$('#cTel').value.trim();
  let num=$('#cNum').value.trim();
  if(nome.length<3){$('#cErr').textContent='Digite o nome do participante.';return;}
  num=num?parseInt(num,10):(editId?S.participantes.find(p=>p.id===editId).num:proxNum());
  if(!(num>0)){$('#cErr').textContent='O número de peito precisa ser um número.';return;}
  if(S.participantes.some(p=>p.num===num&&p.id!==editId)){$('#cErr').textContent=`O número ${num} já está com outro participante.`;return;}
  if(S.participantes.some(p=>p.nome.toLowerCase()===nome.toLowerCase()&&p.id!==editId)){$('#cErr').textContent='Já existe um participante com esse nome.';return;}
  if(editId){Object.assign(S.participantes.find(p=>p.id===editId),{nome,tipo,tel,num,exemplo:false});toast('Cadastro atualizado');}
  else{S.participantes.push({id:S.seq++,num,nome,tipo,tel,exemplo:false});toast(`${nome} cadastrado com o nº ${num}`);}
  save();limparForm();renderCad();renderProva();
  $('#cNome').focus();
}
function limparForm(){editId=null;$('#formCad').reset();$('#cErr').textContent='';$('#formTitle').textContent='Novo participante';$('#btnSalvar').textContent='Cadastrar participante';$('#btnCancelEdit').hidden=true;$('#cNum').placeholder='Automático: '+proxNum();}
function editar(id){
  const p=S.participantes.find(x=>x.id===id);editId=id;
  $('#cNome').value=p.nome;$('#cTel').value=p.tel;$('#cNum').value=p.num;$(p.tipo==='aluno'?'#tAluno':'#tNao').checked=true;
  $('#formTitle').textContent='Editar participante';$('#btnSalvar').textContent='Salvar alterações';$('#btnCancelEdit').hidden=false;$('#cErr').textContent='';$('#cNome').focus();
}
let removendo=null;
function renderCad(){
  const ps=[...S.participantes].sort((a,b)=>a.num-b.num);
  const al=ps.filter(p=>p.tipo==='aluno').length;
  $('#nCad').textContent=`(${ps.length})`;
  $('#cadStats').innerHTML=`<div class="stat"><b>${ps.length}</b>Total</div><div class="stat"><b>${al}</b>Alunos</div><div class="stat"><b>${ps.length-al}</b>Não alunos</div>`;
  $('#demoBox').hidden=!ps.some(p=>p.exemplo);
  const travado=true;
  $('#tblCad').innerHTML=`<thead><tr><th class="num">Nº</th><th>Nome</th><th>Tipo</th><th>Telefone</th><th></th></tr></thead><tbody>${
    ps.length?ps.map(p=>`<tr><td class="num"><span class="bign">${p.num}</span></td><td><b>${esc(p.nome)}</b></td><td>${tipoTag(p.tipo)}</td><td class="muted">${esc(p.tel)||'—'}</td>
    <td><div class="rowact">${removendo===p.id?`<span class="muted" style="align-self:center">Remover?</span><button type="button" class="btn sm danger" data-delok="${p.id}">Sim</button><button type="button" class="btn sm ghost" data-delno="1">Não</button>`:
    `<button type="button" class="btn sm" data-edit="${p.id}">Editar</button><button type="button" class="btn sm ghost" data-del="${p.id}" ${travado&&S.prova.res[p.id]?'disabled title="Já tem tempo registrado"':''}>Remover</button>`}</div></td></tr>`).join(''):
    '<tr><td colspan="5" style="padding:20px;text-align:center" class="muted">Nenhum participante. Use o formulário para cadastrar.</td></tr>'}</tbody>`;
  if(!editId)$('#cNum').placeholder='Automático: '+proxNum();
}

/* ---------- resultado ---------- */
function posicoes(){
  const fin=S.participantes.filter(p=>estado(S.prova.res[p.id])==='fin').sort((a,b)=>S.prova.res[a.id].ms-S.prova.res[b.id].ms);
  const o={};fin.forEach((p,i)=>o[p.id]=i+1);return o;
}
function classificacao(){
  const res=S.prova.res;
  const base=S.participantes.filter(p=>filtro==='todos'||p.tipo===filtro);
  const fin=base.filter(p=>estado(res[p.id])==='fin').sort((a,b)=>res[a.id].ms-res[b.id].ms);
  const dnf=base.filter(p=>estado(res[p.id])==='dnf');
  const corr=base.filter(p=>['run','wait'].includes(estado(res[p.id])));
  return {fin,dnf,corr};
}
function renderRes(){
  const st=S.prova.status,res=S.prova.res,{fin,dnf,corr}=classificacao();
  const algum=Object.keys(res).length>0;$('#resStatus').textContent=!algum?'Prova ainda não começou':terminou()?'Resultado final':'Parcial · prova em andamento';
  const nomeFiltro={todos:'',aluno:' entre alunos',nao:' entre não alunos'}[filtro];
  $('#podium').innerHTML=fin.length?[1,0,2].map(i=>fin[i]?`<div class="pod p${i+1}"><div class="place">${i+1}º</div><div class="nm">${esc(fin[i].nome)}</div><div class="t">${fmt(res[fin[i].id].ms)}</div><div>${tipoTag(fin[i].tipo)}</div></div>`:'<div></div>').join(''):
    `<div class="empty" style="grid-column:1/-1">${!algum?'A classificação aparece aqui quando os participantes começarem a chegar.':'Ninguém chegou ainda'+nomeFiltro+'.'}</div>`;
  const lider=fin[0]?res[fin[0].id].ms:0;
  const rows=[...fin.map((p,i)=>`<tr class="${i===0?'top1':''}"><td><span class="pos">${i+1}º</span></td><td class="num">${p.num}</td><td><b>${esc(p.nome)}</b></td><td>${tipoTag(p.tipo)}</td><td class="num"><b>${fmt(res[p.id].ms)}</b></td><td class="num muted">${i?'+'+fmt(res[p.id].ms-lider):'—'}</td></tr>`),
    ...corr.map(p=>`<tr><td class="muted">—</td><td class="num">${p.num}</td><td>${esc(p.nome)}</td><td>${tipoTag(p.tipo)}</td><td class="num muted">${estado(res[p.id])==='run'?'na pista':st==='encerrada'?'não largou':'aguardando'}</td><td></td></tr>`),
    ...dnf.map(p=>`<tr><td class="muted">—</td><td class="num">${p.num}</td><td class="muted">${esc(p.nome)}</td><td>${tipoTag(p.tipo)}</td><td class="num muted">Não concluiu</td><td></td></tr>`)];
  $('#tblRes').innerHTML=`<thead><tr><th>Pos.</th><th class="num">Nº</th><th>Nome</th><th>Tipo</th><th class="num">Tempo</th><th class="num">Dif. p/ 1º</th></tr></thead><tbody>${rows.join('')||'<tr><td colspan="6" class="muted" style="padding:18px;text-align:center">Sem participantes nesse filtro.</td></tr>'}</tbody>`;
}
function textoResultado(){
  const {fin,dnf}=classificacao(),res=S.prova.res;
  const titulo={todos:'Geral',aluno:'Alunos',nao:'Não alunos'}[filtro];
  const med=['🥇','🥈','🥉'];
  return `🏆 ${S.config.titulo.toUpperCase()}\nClassificação ${titulo}${terminou()?'':' (parcial)'}\n\n`+
    fin.map((p,i)=>`${med[i]||(i+1)+'º'} ${p.nome} — ${fmt(res[p.id].ms)}`).join('\n')+
    (dnf.length?`\n\nNão concluíram: ${dnf.map(p=>p.nome).join(', ')}`:'')+`\n\nParabéns a todos! 💪`;
}

/* ---------- geral ---------- */
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2200);}
function setTab(t){
  tab=t;document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t));
  ['prova','cadastro','resultado','config'].forEach(x=>$('#tab-'+x).hidden=x!==t);
  if(t==='prova')renderProva();if(t==='cadastro')renderCad();if(t==='resultado')renderRes();if(t==='config')renderCfg();
}

/* ---------- configurações ---------- */
function tituloHTML(){
  const t=S.config.titulo||'Desafio',d=(S.config.destaque||'').trim();
  const i=d?t.toLowerCase().indexOf(d.toLowerCase()):-1;
  return i<0?esc(t):esc(t.slice(0,i))+'<span>'+esc(t.slice(i,i+d.length))+'</span>'+esc(t.slice(i+d.length));
}
function inkPara(hex){const n=parseInt(hex.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;return (0.299*r+0.587*g+0.114*b)>150?'#121000':'#FFFFFF';}
function aplicarConfig(){
  const c=S.config,root=document.documentElement.style;
  root.setProperty('--yellow',c.cor);
  root.setProperty('--yellow-soft',`color-mix(in srgb, ${c.cor} 20%, #0C0C0C)`);
  root.setProperty('--yellow-ink',inkPara(c.cor));
  const logo=c.logo||LOGO_PADRAO;
  document.querySelector('.logo').src=logo;document.querySelector('.logo').alt='Logo do '+c.titulo;
  $('#appTitle').innerHTML=tituloHTML();$('#appSub').textContent=c.sub;
  document.title=c.titulo;
}
function renderCfg(){
  const c=S.config;
  if(document.activeElement!==$('#cfgTitulo'))$('#cfgTitulo').value=c.titulo;
  if(document.activeElement!==$('#cfgDestaque'))$('#cfgDestaque').value=c.destaque;
  if(document.activeElement!==$('#cfgSub'))$('#cfgSub').value=c.sub;
  $('#cfgCor').value=c.cor.length===7?c.cor:'#FFD21A';
  $('#cfgLogoPrev').src=$('#prevLogo').src=c.logo||LOGO_PADRAO;
  $('#cfgLogoReset').hidden=!c.logo;
  $('#prevTitle').innerHTML=tituloHTML();
  $('#swatches').innerHTML=CORES.map(([hex,nome])=>`<button type="button" class="sw" data-cor="${hex}" style="background:${hex};--sw-ink:${inkPara(hex)}" aria-label="${nome}" title="${nome}" aria-pressed="${hex.toLowerCase()===c.cor.toLowerCase()}"></button>`).join('');
}
function mudarCfg(k,v){S.config[k]=v;save();aplicarConfig();renderCfg();}
function carregarFoto(file){
  if(!file)return;
  if(!file.type.startsWith('image/')){toast('Escolha um arquivo de imagem');return;}
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
    const s=Math.min(img.width,img.height),cv=document.createElement('canvas');cv.width=cv.height=320;
    const ctx=cv.getContext('2d');ctx.fillStyle='#0C0C0C';ctx.fillRect(0,0,320,320);
    ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,320,320);
    URL.revokeObjectURL(url);
    mudarCfg('logo',cv.toDataURL('image/jpeg',0.86));toast('Foto do desafio atualizada');
  };
  img.onerror=()=>{URL.revokeObjectURL(url);toast('Não consegui abrir essa imagem. Tente outra.');};
  img.src=url;
}

document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)setTab(b.dataset.tab);});
$('#btnUndo').onclick=desfazer;
$('#btnEnd').onclick=()=>pedirConfirmacao('Encerrar a prova? Quem está na pista fica como "não concluiu" e quem não largou fica fora da classificação.',encerrar);
$('#btnNew').onclick=()=>pedirConfirmacao('Começar uma nova prova? Os tempos atuais serão apagados. Os cadastros continuam.',()=>{S.prova=PROVA_NOVA();save();renderProva();renderCad();});
$('#confirmYes').onclick=()=>{const f=confirmAction;fecharConfirmacao();if(f)f();};
$('#confirmNo').onclick=fecharConfirmacao;
$('#busca').oninput=()=>renderProva();
$('#grid').addEventListener('click',e=>{
  const d=e.target.closest('[data-dnf]');if(d){e.stopPropagation();desistiu(+d.dataset.dnf);return;}
  const f=e.target.closest('[data-fim]'),i=e.target.closest('[data-ini-id]');
  if(!f&&!i)return;
  const id=f?+f.dataset.fim:+i.dataset.iniId;
  if($('#busca').value)$('#busca').value='';
  f?finalizarP(id):iniciarP(id);
});
$('#grid').addEventListener('keydown',e=>{const d=e.target.closest('[data-dnf]');if(d&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();desistiu(+d.dataset.dnf);}});
$('#formCad').addEventListener('submit',salvarCad);
$('#btnCancelEdit').onclick=limparForm;
$('#tblCad').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.edit)editar(+b.dataset.edit);
  else if(b.dataset.del){removendo=+b.dataset.del;renderCad();}
  else if(b.dataset.delno){removendo=null;renderCad();}
  else if(b.dataset.delok){const id=+b.dataset.delok;S.participantes=S.participantes.filter(p=>p.id!==id);delete S.prova.res[id];S.prova.hist=S.prova.hist.filter(x=>x.id!==id);removendo=null;if(editId===id)limparForm();save();renderCad();renderProva();toast('Participante removido');}
});
$('#btnClearDemo').onclick=()=>{const ids=S.participantes.filter(p=>p.exemplo).map(p=>p.id);S.participantes=S.participantes.filter(p=>!p.exemplo);ids.forEach(id=>delete S.prova.res[id]);S.prova.hist=S.prova.hist.filter(x=>!ids.includes(x.id));save();limparForm();renderCad();renderProva();toast('Exemplos apagados');};
$('#filters').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;filtro=b.dataset.f;document.querySelectorAll('#filters button').forEach(x=>x.setAttribute('aria-pressed',x===b));$('#copyArea').hidden=true;renderRes();});
$('#btnCopy').onclick=()=>{
  const txt=textoResultado(),ta=$('#copyArea');
  const fallback=()=>{ta.value=txt;ta.hidden=false;ta.focus();ta.select();toast('Texto selecionado: copie e cole no WhatsApp');};
  try{navigator.clipboard.writeText(txt).then(()=>toast('Resultado copiado! Cole no WhatsApp'),fallback);}catch(e){fallback();}
};

$('#cfgTitulo').oninput=e=>mudarCfg('titulo',e.target.value.trim()||'Desafio');
$('#cfgDestaque').oninput=e=>mudarCfg('destaque',e.target.value.trim());
$('#cfgSub').oninput=e=>mudarCfg('sub',e.target.value);
$('#cfgCor').oninput=e=>mudarCfg('cor',e.target.value);
$('#swatches').addEventListener('click',e=>{const b=e.target.closest('[data-cor]');if(b)mudarCfg('cor',b.dataset.cor);});
$('#cfgLogo').onchange=e=>{carregarFoto(e.target.files[0]);e.target.value='';};
$('#cfgLogoReset').onclick=()=>{mudarCfg('logo',null);toast('Logo original de volta');};
$('#cfgReset').onclick=()=>{$('#cfgConfirm').hidden=false;};
$('#cfgNo').onclick=()=>{$('#cfgConfirm').hidden=true;};
$('#cfgYes').onclick=()=>{$('#cfgConfirm').hidden=true;S.config={...CFG_PADRAO};save();aplicarConfig();renderCfg();toast('Configurações restauradas');};

aplicarConfig();
limparForm();renderCad();renderProva();
requestAnimationFrame(loop);
setInterval(()=>{if(tab==='resultado'&&contagem().run)renderRes();},1000);

/* ---------- app instalável (PWA) ---------- */
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
