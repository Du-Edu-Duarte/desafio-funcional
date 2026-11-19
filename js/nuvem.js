/* Login + sincronização na nuvem (Firebase Authentication + Cloud Firestore).
   - Só entra quem tem o e-mail liberado na coleção "acessos" (ou o dono do sistema).
   - Participantes, tempos e configurações ficam no Firestore e aparecem ao vivo em todos os aparelhos.
   - Sem internet o app continua funcionando: o Firestore guarda no aparelho e envia quando o sinal voltar. */
import {firebaseConfig,EVENTO,DONO} from './firebase-config.js';

const FB='https://www.gstatic.com/firebasejs/10.14.1/';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const App=window.App;
const LEGADO='desafio-funcional-thalison-3',MIGRADO=LEGADO+':migrado';
const VIEWS=['vCarregando','vLogin','vCriar','vVerificar','vBloqueado','vErro'];
const dono=DONO.toLowerCase();

function tela(v){$('#auth').hidden=false;$('#appRoot').hidden=true;VIEWS.forEach(x=>$('#'+x).hidden=x!==v);}
function erroFatal(msg){$('#eMsg').textContent=msg;tela('vErro');}

let A,F,auth,db;           // módulos e instâncias do Firebase
let dentro=false,papelAtual=null;
let unsubs=[],pronto={parts:false,estado:false},servidor=false,pend={parts:false,estado:false},erroSync=false;
let R={parts:new Map(),status:'aberta',cfg:''};   // último estado conhecido da nuvem
let cfgTimer=null,legadoVisto=false,legadoPend=null;

const partsCol=()=>F.collection(db,'eventos',EVENTO,'participantes');
const estCol=()=>F.collection(db,'eventos',EVENTO,'estado');
const docDe=(p,r)=>({num:p.num,nome:p.nome,tipo:p.tipo,sexo:p.sexo||'',idade:p.idade??null,tel:p.tel||'',
  res:r?{inicio:r.inicio,ms:r.ms??null,dnf:!!r.dnf,run:!!r.run}:null});
const cfgJson=c=>JSON.stringify({...App.CFG_PADRAO,...(c||{})});

/* ---------- início ---------- */
main();
async function main(){
  if(!firebaseConfig.apiKey||firebaseConfig.apiKey.startsWith('COLE')){
    erroFatal('O Firebase ainda não foi configurado. Preencha o arquivo js/firebase-config.js (passo a passo no README).');return;
  }
  try{
    let app;
    [app,A,F]=await Promise.all([import(FB+'firebase-app.js'),import(FB+'firebase-auth.js'),import(FB+'firebase-firestore.js')]);
    const fb=app.initializeApp(firebaseConfig);
    auth=A.getAuth(fb);auth.languageCode='pt-BR';
    try{db=F.initializeFirestore(fb,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})});}
    catch(e){db=F.getFirestore(fb);}
  }catch(e){
    console.error(e);
    erroFatal('Não consegui conectar. Verifique a internet e abra o app de novo.');return;
  }
  window.Nuvem={salvar};
  ligarTelas();
  A.onAuthStateChanged(auth,rotear);
  window.addEventListener('online',pintarSync);window.addEventListener('offline',pintarSync);
}

/* ---------- login ---------- */
const MSG={
  'auth/invalid-credential':'E-mail ou senha incorretos.','auth/wrong-password':'E-mail ou senha incorretos.','auth/user-not-found':'E-mail ou senha incorretos.',
  'auth/invalid-email':'Digite um e-mail válido.','auth/missing-password':'Digite a senha.','auth/weak-password':'A senha precisa ter pelo menos 6 caracteres.',
  'auth/email-already-in-use':'Já existe uma conta com esse e-mail. Use "Já tenho conta".','auth/too-many-requests':'Muitas tentativas. Espere alguns minutos e tente de novo.',
  'auth/network-request-failed':'Sem internet. Conecte e tente de novo.'
};
const msgErro=e=>MSG[e?.code]||'Não deu certo. Tente de novo.';

async function consultarAcesso(user){   // 'admin' | 'equipe' | null (sem acesso) | undefined (não deu para conferir)
  const email=user.email.toLowerCase();
  if(email===dono)return 'admin';
  try{const s=await F.getDoc(F.doc(db,'acessos',email));return s.exists()?(s.data().papel==='admin'?'admin':'equipe'):null;}
  catch(e){return e?.code==='permission-denied'?null:undefined;}
}
async function rotear(user){
  sairDoApp();
  if(!user){tela('vLogin');return;}
  if(!user.emailVerified){$('#vEmail').textContent=user.email;$('#vErr').textContent='';tela('vVerificar');return;}
  const ck='desafio-papel:'+user.uid,guardado=user.email.toLowerCase()===dono?'admin':localStorage.getItem(ck);
  if(guardado){   // já entrou antes neste aparelho: abre na hora (funciona sem internet) e confere por trás
    entrar(user,guardado);
    consultarAcesso(user).then(p=>{
      if(auth.currentUser!==user||p===undefined)return;
      if(p===null){localStorage.removeItem(ck);bloquear(user);}
      else if(p!==papelAtual){localStorage.setItem(ck,p);sairDoApp();entrar(user,p);}
    });
    return;
  }
  tela('vCarregando');
  const p=await consultarAcesso(user);
  if(auth.currentUser!==user)return;
  if(!p){bloquear(user);return;}
  localStorage.setItem(ck,p);entrar(user,p);
}
function bloquear(user){sairDoApp();$('#bEmail').textContent=user.email;tela('vBloqueado');}

function entrar(user,papel){
  if(dentro)return;dentro=true;papelAtual=papel;
  $('#ctNome').textContent=user.displayName||user.email;$('#ctEmail').textContent=user.email;
  $('#ctPapel').textContent=papel==='admin'?'Administrador':'Equipe';
  $('#cardEquipe').hidden=papel!=='admin';
  $('#auth').hidden=true;$('#appRoot').hidden=false;
  iniciarSync();if(papel==='admin')ouvirEquipe(user);
}
function sairDoApp(){
  unsubs.forEach(u=>{try{u();}catch(e){}});unsubs=[];
  clearTimeout(cfgTimer);cfgTimer=null;
  dentro=false;papelAtual=null;pronto={parts:false,estado:false};servidor=false;pend={parts:false,estado:false};erroSync=false;
  legadoVisto=false;legadoPend=null;$('#migraBox').hidden=true;
}

function ligarTelas(){
  $('#vLogin').addEventListener('submit',async e=>{
    e.preventDefault();$('#lErr').textContent='';
    try{await A.signInWithEmailAndPassword(auth,$('#lEmail').value.trim(),$('#lSenha').value);$('#lSenha').value='';}
    catch(err){$('#lErr').textContent=msgErro(err);}
  });
  $('#lCriar').onclick=()=>{$('#rEmail').value=$('#lEmail').value;tela('vCriar');};
  $('#rVoltar').onclick=()=>tela('vLogin');
  $('#lEsqueci').onclick=async()=>{
    const email=$('#lEmail').value.trim();
    if(!email){$('#lErr').textContent='Digite seu e-mail acima e toque de novo em "Esqueci a senha".';return;}
    try{await A.sendPasswordResetEmail(auth,email);$('#lErr').textContent='Enviamos um link para trocar a senha. Olhe seu e-mail.';}
    catch(err){$('#lErr').textContent=msgErro(err);}
  };
  $('#vCriar').addEventListener('submit',async e=>{
    e.preventDefault();
    const nome=$('#rNome').value.trim().replace(/\s+/g,' '),setor=$('#rSetor').value.trim(),email=$('#rEmail').value.trim().toLowerCase(),senha=$('#rSenha').value;
    if(nome.length<3){$('#rErr').textContent='Digite seu nome completo.';return;}
    if(!setor){$('#rErr').textContent='Digite seu setor ou função.';return;}
    $('#rErr').textContent='';
    try{
      const cred=await A.createUserWithEmailAndPassword(auth,email,senha);
      await A.updateProfile(cred.user,{displayName:nome}).catch(()=>{});
      F.setDoc(F.doc(db,'usuarios',cred.user.uid),{nome,setor,email,criadoEm:F.serverTimestamp()}).catch(()=>{});
      await A.sendEmailVerification(cred.user);
      $('#rSenha').value='';
    }catch(err){$('#rErr').textContent=msgErro(err);}
  });
  $('#vJa').onclick=async()=>{
    const u=auth.currentUser;if(!u)return;
    try{await u.reload();
      if(!u.emailVerified){$('#vErr').textContent='Ainda não confirmado. Abra o e-mail e toque no link.';return;}
      await u.getIdToken(true);rotear(u);
    }catch(err){$('#vErr').textContent=msgErro(err);}
  };
  $('#vReenviar').onclick=async()=>{
    try{await A.sendEmailVerification(auth.currentUser);$('#vErr').textContent='E-mail reenviado.';}
    catch(err){$('#vErr').textContent=msgErro(err);}
  };
  $('#bTentar').onclick=async()=>{const u=auth.currentUser;if(!u)return;try{await u.getIdToken(true);}catch(e){}rotear(u);};
  ['#vSair','#bSair','#ctSair'].forEach(s=>$(s).onclick=()=>A.signOut(auth));
  $('#migraSim').onclick=()=>{if(legadoPend)importar(legadoPend.L,legadoPend.novos,false);};
  $('#migraNao').onclick=()=>{localStorage.setItem(MIGRADO,'1');legadoPend=null;$('#migraBox').hidden=true;};
}

/* ---------- sincronização ---------- */
function iniciarSync(){
  unsubs.push(F.onSnapshot(partsCol(),{includeMetadataChanges:true},snap=>{
    const m=new Map(),lista=[];
    snap.forEach(d=>{const x=docDe(d.data(),d.data().res);m.set(d.id,JSON.stringify(x));lista.push({id:d.id,...x});});
    let mudou=!pronto.parts||m.size!==R.parts.size;
    if(!mudou)for(const [id,j] of m)if(R.parts.get(id)!==j){mudou=true;break;}
    R.parts=m;pronto.parts=true;pend.parts=snap.metadata.hasPendingWrites;
    if(!snap.metadata.fromCache)servidor=true;
    if(mudou)App.aplicarParts(lista);
    pintarSync();checarLegado();
  },falha));
  unsubs.push(F.onSnapshot(estCol(),{includeMetadataChanges:true},snap=>{
    let st='aberta',cfg=null;
    snap.forEach(d=>{if(d.id==='prova')st=d.data().status||'aberta';if(d.id==='config')cfg=d.data();});
    const cj=cfgJson(cfg),primeira=!pronto.estado;
    if(primeira||st!==R.status){R.status=st;App.aplicarStatus(st);}
    if(!cfgTimer&&(primeira||cj!==R.cfg)){R.cfg=cj;App.aplicarCfg(cfg);}   // se estou digitando uma configuração, não sobrescreve
    pronto.estado=true;pend.estado=snap.metadata.hasPendingWrites;
    if(!snap.metadata.fromCache)servidor=true;
    pintarSync();checarLegado();
  },falha));
}
function falha(e){
  console.error(e);erroSync=true;pintarSync();
  App.toast(e?.code==='permission-denied'?'Sem permissão para salvar. Saia e entre de novo.':'Erro ao sincronizar');
}
function pintarSync(){
  const el=$('#sync');let txt='Sincronizado',cls='ok';
  if(erroSync){txt='Erro ao sincronizar';cls='err';}
  else if(!navigator.onLine){txt='Sem internet · salvo no aparelho';cls='off';}
  else if(pend.parts||pend.estado){txt='Enviando…';cls='off';}
  else if(!servidor){txt='Conectando';cls='';}
  el.textContent=txt;el.className='pill sync '+cls;
}

/* Chamado pelo app a cada mudança: envia para a nuvem só o que mudou. */
function salvar(S){
  if(!dentro||!pronto.parts||!pronto.estado)return;
  const ops=[],atual=new Map();
  S.participantes.forEach(p=>{
    const id=String(p.id),d=docDe(p,S.prova.res[p.id]),j=JSON.stringify(d);atual.set(id,j);
    if(R.parts.get(id)!==j)ops.push(b=>b.set(F.doc(partsCol(),id),d));
  });
  R.parts.forEach((_,id)=>{if(!atual.has(id))ops.push(b=>b.delete(F.doc(partsCol(),id)));});
  R.parts=atual;
  if(S.prova.status!==R.status){const st=S.prova.status;R.status=st;ops.push(b=>b.set(F.doc(estCol(),'prova'),{status:st}));}
  for(let i=0;i<ops.length;i+=400){const b=F.writeBatch(db);ops.slice(i,i+400).forEach(f=>f(b));b.commit().catch(falha);}
  if(cfgJson(S.config)!==R.cfg){   // configurações: espera parar de digitar
    clearTimeout(cfgTimer);
    cfgTimer=setTimeout(()=>{cfgTimer=null;const c={...App.estado().config};R.cfg=cfgJson(c);F.setDoc(F.doc(estCol(),'config'),c).catch(falha);},600);
  }
}

/* ---------- dados antigos deste aparelho (cadastrados antes do login) ---------- */
function checarLegado(){
  if(legadoVisto||!servidor||!pronto.parts||!pronto.estado)return;
  legadoVisto=true;
  if(localStorage.getItem(MIGRADO))return;
  let L=null;try{L=JSON.parse(localStorage.getItem(LEGADO));}catch(e){}
  const reais=(L?.participantes||[]).filter(p=>p&&!p.exemplo&&p.nome);
  if(!reais.length)return;
  const S=App.estado();
  if(!S.participantes.length){importar(L,reais,true);return;}   // nuvem vazia: sobe tudo sozinho
  const nomes=new Set(S.participantes.map(p=>p.nome.toLowerCase()));
  const novos=reais.filter(p=>!nomes.has(p.nome.toLowerCase()));
  if(!novos.length){localStorage.setItem(MIGRADO,'1');return;}
  legadoPend={L,novos};
  $('#migraMsg').innerHTML=`Este aparelho tem <b>${novos.length}</b> participante(s) cadastrado(s) antes do login que ainda não estão na nuvem.`;
  $('#migraBox').hidden=false;
}
function importar(L,lista,tudo){
  const S=App.estado(),nomes=new Set(S.participantes.map(p=>p.nome.toLowerCase())),nums=new Set(S.participantes.map(p=>p.num));
  let n=0;
  lista.forEach(p=>{
    const k=p.nome.toLowerCase();if(nomes.has(k))return;nomes.add(k);
    let num=p.num>0&&!nums.has(p.num)?p.num:Math.max(0,...nums)+1;nums.add(num);
    const id=App.novoId();
    S.participantes.push({id,num,nome:p.nome,tipo:p.tipo==='nao'?'nao':'aluno',sexo:p.sexo||'',idade:p.idade??null,tel:p.tel||''});
    const r=L.prova?.v===2?L.prova.res?.[p.id]:null;
    if(r)S.prova.res[id]={inicio:r.inicio,ms:r.ms??null,dnf:!!r.dnf,run:!!r.run};
    n++;
  });
  if(tudo){
    if(L.prova?.v===2&&L.prova.status==='encerrada')S.prova.status='encerrada';
    if(L.config)App.aplicarCfg(L.config);
  }
  App.save();App.redesenhar();
  localStorage.setItem(MIGRADO,'1');legadoPend=null;$('#migraBox').hidden=true;
  App.toast(`${n} participante(s) deste aparelho enviados para a nuvem`);
}

/* ---------- equipe (só administrador) ---------- */
function ouvirEquipe(user){
  const eu=user.email.toLowerCase();
  unsubs.push(F.onSnapshot(F.collection(db,'acessos'),snap=>{
    const ls=[];snap.forEach(d=>ls.push({email:d.id,papel:d.data().papel==='admin'?'admin':'equipe'}));
    ls.sort((a,b)=>a.email.localeCompare(b.email));
    $('#tblEquipe').innerHTML=`<thead><tr><th>E-mail</th><th>Permissão</th><th></th></tr></thead><tbody>${
      ls.length?ls.map(a=>`<tr><td><b>${esc(a.email)}</b></td><td class="muted">${a.papel==='admin'?'Administrador':'Equipe'}</td><td><div class="rowact">${
        a.email===eu?'<span class="muted">você</span>':`<button type="button" class="btn sm ghost" data-tirar="${esc(a.email)}">Remover</button>`}</div></td></tr>`).join('')
      :'<tr><td colspan="3" class="muted" style="padding:16px;text-align:center">Ninguém liberado ainda.</td></tr>'}</tbody>`;
  },e=>console.error(e)));
  $('#formEquipe').onsubmit=async e=>{
    e.preventDefault();
    const email=$('#eqEmail').value.trim().toLowerCase(),papel=document.querySelector('input[name=eqPapel]:checked').value;
    if(!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email)){$('#eqErr').textContent='Digite um e-mail válido.';return;}
    $('#eqErr').textContent='';
    try{await F.setDoc(F.doc(db,'acessos',email),{papel,liberadoPor:eu,em:F.serverTimestamp()});$('#eqEmail').value='';App.toast('Acesso liberado para '+email);}
    catch(err){$('#eqErr').textContent='Não consegui liberar. Verifique a internet.';}
  };
  $('#tblEquipe').onclick=e=>{
    const b=e.target.closest('[data-tirar]');if(!b)return;
    F.deleteDoc(F.doc(db,'acessos',b.dataset.tirar)).then(()=>App.toast('Acesso removido')).catch(()=>App.toast('Não consegui remover'));
  };
}
