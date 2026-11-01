/* Loaded inside the unlocked game, after the existing quiz definitions. */
let subjectXP={'算数':0,'国語':0,'社会':0,'理科':0}, battleWins=0, battle=null;
const emptySubjects=()=>({'算数':0,'国語':0,'社会':0,'理科':0});
function progressData(){return {v:2,xp,got:[...cleared],subjects:{...subjectXP},wins:battleWins};}
function applyProgress(d){
  xp=d.xp;cleared.clear();(d.got||[]).forEach(i=>cleared.add(i));
  subjectXP=d.subjects?{...d.subjects}:emptySubjects();battleWins=d.wins||0;
}
const oldClean=clean;
clean=function(d){
  if(d&&d.v===2){try{return ManabiProgress.validate(d,SETS.length);}catch{return null;}}
  const v=oldClean(d);return v?{...v,subjects:emptySubjects(),wins:0}:null;
};
const oldAddXP=addXP;
addXP=function(n){
  const credited=Math.min(n,XP_MAX-xp), su=subjOf(SETS[cur]);
  if(su in subjectXP)subjectXP[su]+=credited;
  const up=oldAddXP(n);saveLocal();return up;
};
const oldFinish=finish;
finish=function(...args){oldFinish(...args);saveLocal();};
const oldPaintStatus=paintStatus;
paintStatus=function(){oldPaintStatus();statusEl.querySelector('.tap').textContent='おすと QRコードでセーブ';};
function monsterHTML(i){
  const body=['body_greenA','body_blueB','body_redF'][i];
  return `<div class="monster monster-${i}" aria-label="${ENEMIES[i].name}" role="img"><img class="monster-body" src="${ADVENTURE_ASSETS[body]}" alt=""><img class="monster-eye left" src="${ADVENTURE_ASSETS.eye_cute_dark}" alt=""><img class="monster-eye right" src="${ADVENTURE_ASSETS.eye_cute_dark}" alt=""><img class="monster-mouth" src="${ADVENTURE_ASSETS.mouth_closed_happy}" alt=""></div>`;
}
const ENEMIES=[{name:'わすれんぼモス',place:'はじまりの草原',hp:55,attack:12},{name:'もやもやブルー',place:'ひらめきの湖',hp:110,attack:19},{name:'ナゾナゾ大王',place:'まなびの古城',hp:180,attack:27}];
function heroHTML(){return `<img class="hero-lion" src="${STICKERS.hanamaru?.img||Object.values(STICKERS)[0].img}" alt="はなまらいおん">`;}
function hubHTML(){
  const s=ManabiProgress.stats(subjectXP);
  return `<section class="adventure-hub"><div class="hub-hero">${heroHTML()}<div><p class="eyebrow">LEARN • GROW • ADVENTURE</p><h2>学びが、ぼうけんの力になる。</h2><p>はなまらいおんと、ナゾの森へ！</p></div></div><div class="growth-grid"><div><span>⚔ こうげき</span><b>${s.attack}</b><small>算数 ${subjectXP['算数']} XP</small></div><div><span>🛡 しゅび</span><b>${s.defense}</b><small>国語 ${subjectXP['国語']} XP</small></div><div><span>🏆 しょうり</span><b>${battleWins}</b><small>学んで、何度もちょうせん</small></div></div><p class="growth-note">算数でこうげき、国語でしゅびがアップ！経験値は使ってもへらないよ。</p><div class="row"><button class="btn gold" data-adventure="battle">⚔ モンスターにちょうせん</button><button class="btn ghost" data-adventure="save">▦ QRセーブ・よみこみ</button></div></section>`;
}
function mountHub(){
  const box=stage.querySelector('.startbox');if(!box)return;
  box.insertAdjacentHTML('afterbegin',hubHTML());
  box.querySelector('[data-adventure="battle"]').textContent='⚔ バトルにちょうせん';
  const legacy=xp-Object.values(subjectXP).reduce((a,b)=>a+b,0);
  if(legacy>0)box.querySelector('.growth-note').insertAdjacentHTML('afterend',`<p class="growth-note">前の記録の ${legacy} XPも合計に残っているよ。教科別の力は、新しく学んだ分から育つよ。</p>`);
  box.querySelector('[data-adventure="battle"]').onclick=chooseBattle;
  box.querySelector('[data-adventure="save"]').onclick=showSpellModal;
}
const oldMenu=menu;menu=function(){battle=null;oldMenu();mountHub();};
const oldWelcome=welcome;welcome=function(){oldWelcome();
  const box=stage.querySelector('.startbox');
  box.insertAdjacentHTML('afterbegin','<section class="qr-welcome"><p class="eyebrow">ぼうけんの書</p><h2>QRコードで、つづきから。</h2><p>保存したQR画像をえらぶと、ほかの端末でも冒険をつづけられるよ。</p><button class="btn gold" id="welcomeQR">▦ QRをよみこむ</button><p>この端末の記録や、以前のじゅもんも使えるよ。</p></section>');
  document.getElementById('welcomeQR').onclick=showSpellModal;
};
function chooseBattle(){
  closeModal();gauge.innerHTML='';subjNav.hidden=true;setHead('モンスターの森','学びで育てた力をためそう');
  stage.innerHTML=`<section class="battle-select"><p class="eyebrow">MONSTER FOREST</p><h2>だれに、ちょうせんする？</h2><p>勝っても負けても学習の記録はへらないよ。何度でもやりなおせる！</p><div class="enemy-cards">${ENEMIES.map((e,i)=>`<button class="enemy-card" data-enemy="${i}">${monsterHTML(i)}<small>${e.place}</small><h3>${e.name}</h3><p>HP ${e.hp} ・ こうげき ${e.attack}</p><span class="btn">ちょうせん →</span></button>`).join('')}</div><button class="btn ghost" id="battleBack">← 学びにもどる</button></section>`;
  stage.querySelectorAll('[data-enemy]').forEach(b=>b.onclick=()=>{const id=+b.dataset.enemy,s=ManabiProgress.stats(subjectXP);battle={id,hp:s.hp,enemyHP:ENEMIES[id].hp,turn:0,guard:0,ended:false,log:'こうげきする？ それとも、しゅびをかためる？'};renderBattle();});
  document.getElementById('battleBack').onclick=menu;toTop();
}
function battleTurn(guard){
  if(!battle||battle.ended)return;
  const b=battle,e=ENEMIES[b.id],s=ManabiProgress.stats(subjectXP);b.turn++;
  if(guard){b.guard=Math.min(2,b.guard+1);b.hp=Math.min(s.hp,b.hp+8);b.log='しゅびをかためて HPを8かいふく！ 次のこうげきが強くなる！';}
  else{const damage=s.attack+b.guard*6;b.guard=0;b.enemyHP=Math.max(0,b.enemyHP-damage);b.log=`はなまらいおんのこうげき！ ${damage}ダメージ！`;}
  if(b.enemyHP===0){b.ended=true;battleWins=Math.min(9999,battleWins+1);b.log+=' やったね！ モンスターとなかよくなった！';saveLocal();}
  else{const strong=b.turn%3===0,damage=Math.max(1,(strong?e.attack+8:e.attack)-s.defense-(guard?10:0));b.hp=Math.max(0,b.hp-damage);b.log+=` ${e.name}の${strong?'大こうげき':'こうげき'}！ ${damage}ダメージ。`;if(b.hp===0){b.ended=true;b.log+=' ひとやすみしよう。国語や算数で力を育てて、また来よう！';}}
  renderBattle();
}
function renderBattle(){
  const b=battle,e=ENEMIES[b.id],s=ManabiProgress.stats(subjectXP);
  stage.innerHTML=`<section class="battle-screen"><div class="battle-heading"><p class="eyebrow">${e.place}</p><h2>${b.ended?(b.enemyHP===0?'なかまが、ふえた！':'また、ちょうせんしよう！'):'はなまらいおん VS '+e.name}</h2></div><div class="battle-field"><div class="fighter">${heroHTML()}<b>はなまらいおん</b><label>HP ${b.hp} / ${s.hp}<meter min="0" max="${s.hp}" value="${b.hp}"></meter></label></div><span class="vs">VS</span><div class="fighter">${monsterHTML(b.id)}<b>${e.name}</b><label>HP ${b.enemyHP} / ${e.hp}<meter min="0" max="${e.hp}" value="${b.enemyHP}"></meter></label></div></div><p class="battle-log" role="status" aria-live="polite">${b.log}</p><p>⚔ こうげき ${s.attack}　🛡 しゅび ${s.defense}　ためた力 ${b.guard}/2</p>${!b.ended?`<p class="enemy-intent">次は${(b.turn+1)%3===0?'大こうげき！ しゅびがおすすめ':'ふつうのこうげき'}。しゅびで回復し、次のこうげきに力をためよう。</p><div class="row"><button class="btn gold" id="attack">⚔ こうげき</button><button class="btn" id="guard">🛡 しゅび・かいふく</button></div>`:`<div class="row"><button class="btn gold" id="retryBattle">もう一度あそぶ</button><button class="btn" id="battleSave">QRでセーブ</button></div>`}<button class="btn ghost" id="leaveBattle">← 学びにもどる</button></section>`;
  if(!b.ended){document.getElementById('attack').onclick=()=>battleTurn(false);document.getElementById('guard').onclick=()=>battleTurn(true);}
  else{document.getElementById('retryBattle').onclick=chooseBattle;document.getElementById('battleSave').onclick=showSpellModal;}
  document.getElementById('leaveBattle').onclick=menu;
}
// QR images contain the save itself; no account or network request is required.
showSpellModal=function(){
  closeModal();
  const current=(xp||cleared.size)?progressData():(loadLocal()||progressData());
  const payload=ManabiProgress.encode({...current,v:2},SETS.length);
  const qr=qrcode(0,'M');qr.addData(payload);qr.make();
  const count=qr.getModuleCount(),scale=6,margin=4,canvas=document.createElement('canvas');
  canvas.width=canvas.height=(count+margin*2)*scale;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';
  for(let y=0;y<count;y++)for(let x=0;x<count;x++)if(qr.isDark(y,x))ctx.fillRect((x+margin)*scale,(y+margin)*scale,scale,scale);
  canvas.id='saveQR';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','冒険の記録を保存したQRコード');
  const m=document.createElement('dialog');m.id='spellModal';m.className='qr-dialog';
  m.innerHTML=`<div class="qr-dialog-head"><div><p class="eyebrow">ぼうけんの書</p><h2>QRコードでセーブ</h2></div><button class="btn ghost" id="mClose" aria-label="とじる">✕</button></div><p>合計 ${current.xp} XP ・ 算数 ${current.subjects['算数']} XP ・ 国語 ${current.subjects['国語']} XP ・ 勝利 ${current.wins}回</p><div id="qrCanvas"></div><a class="btn gold" id="downloadQR" download="manabiquest-${new Date().toISOString().slice(0,10)}-${current.xp}xp.png">QR画像をほぞん</a><p>学んだあとは、新しいQRをほぞんしてね。前の画像には、前の記録が入っているよ。</p><hr><h3>QRから、つづきへ</h3><label class="btn ghost qr-file">QR画像をえらぶ<input id="qrFile" type="file" accept="image/*"></label><label class="btn ghost qr-file">カメラでQRをとる<input id="qrCamera" type="file" accept="image/*" capture="environment"></label><p class="qr-status" id="qrStatus" role="status" aria-live="polite"></p><div id="importPreview"></div><details><summary>画像をよめないとき：セーブコード</summary><p>コードをコピーして保存し、下にはりつけても再開できるよ。</p><textarea id="saveCode" readonly aria-label="保存用セーブコード"></textarea><button class="btn ghost" id="copySaveCode">コードをコピー</button><textarea id="importCode" aria-label="読み込むセーブコード" placeholder="MQ2: ではじまるコード"></textarea><button class="btn" id="readSaveCode">コードをよみこむ</button></details><details><summary>以前のふっかつのじゅもん</summary><p>古いじゅもんでは、教科別の経験値とバトル記録は保存できません。新しい記録にはQRを使ってね。</p><input id="mSpell" readonly aria-label="以前の形式のじゅもん"><button class="btn ghost" id="mCopy">じゅもんをコピー</button><span id="mMsg" hidden></span></details><p class="asset-credit">敵の素材：<a href="https://kenney.nl/assets/monster-builder-pack" target="_blank" rel="noopener">Kenney / CC0</a></p>`;
  document.body.appendChild(m);document.getElementById('qrCanvas').appendChild(canvas);document.getElementById('downloadQR').href=canvas.toDataURL('image/png');document.getElementById('saveCode').value=payload;document.getElementById('mSpell').value=encodeAll(current.xp,new Set(current.got)).join(' ');
  let importing=false;
  const status=()=>m.querySelector('#qrStatus');
  function preview(code){
    try{const d=ManabiProgress.decode(code.trim(),SETS.length);const box=m.querySelector('#importPreview');box.innerHTML=`<div class="import-card"><h3>この記録でつづける？</h3><p>合計 ${d.xp} XP ・ ステッカー ${d.got.length}まい<br>算数 ${d.subjects['算数']} XP ・ 国語 ${d.subjects['国語']} XP ・ 勝利 ${d.wins}回</p><p>この端末の記録を、この内容におきかえるよ。</p><button class="btn gold" id="confirmImport">この記録でつづける</button></div>`;box.querySelector('button').onclick=()=>{applyProgress(d);saveLocal();closeModal();menu();};status().textContent='記録をよめたよ。内容をかくにんしてね。';}
    catch(e){m.querySelector('#importPreview').innerHTML='';status().textContent=e.message;}
  }
  async function readImage(file){
    m.querySelector('#importPreview').innerHTML='';if(!file||importing)return;
    if(file.size>20*1024*1024){status().textContent='画像が大きすぎるよ。QRの部分だけに切り取ってね。';return;}
    importing=true;status().textContent='QRをよんでいるよ…';const url=URL.createObjectURL(file);
    try{const img=new Image();img.src=url;await img.decode();if(!m.isConnected)return;
      const ratio=Math.min(1,1800/Math.max(img.width,img.height)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(img.width*ratio));cv.height=Math.max(1,Math.round(img.height*ratio));const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0,cv.width,cv.height);const data=c.getImageData(0,0,cv.width,cv.height);const result=jsQR(data.data,cv.width,cv.height,{inversionAttempts:'attemptBoth'});if(!result)throw Error('QRが見つからなかったよ。明るく、まっすぐ撮るか、保存した画像をえらんでね。');preview(result.data);
    }catch(e){if(m.isConnected)status().textContent=e.message||'画像をよめなかったよ。';}finally{URL.revokeObjectURL(url);importing=false;}
  }
  ['qrFile','qrCamera'].forEach(id=>m.querySelector('#'+id).onchange=e=>readImage(e.target.files[0]));
  m.querySelector('#readSaveCode').onclick=()=>preview(m.querySelector('#importCode').value);
  m.querySelector('#copySaveCode').onclick=async()=>{try{await navigator.clipboard.writeText(payload);status().textContent='コピーしたよ！';}catch{m.querySelector('#saveCode').select();status().textContent='えらばれたコードをコピーしてね。';}};
  m.querySelector('#mCopy').onclick=()=>copySpell('mSpell','mMsg');m.querySelector('#mClose').onclick=closeModal;
  m.showModal();m.querySelector('#mClose').focus();
};
const oldShowResult=showResult;
showResult=function(){oldShowResult();
  const box=stage.querySelector('.spellbox');box.innerHTML='<h3>学んだ力を、QRで持っていこう。</h3><p>この端末には自動保存したよ。ほかの端末であそぶときはQRをほぞんしよう。</p><button class="btn gold" id="resultQR">QRでセーブ</button><button class="btn" id="resultBattle">育った力でバトル</button>';
  box.querySelector('#resultQR').onclick=showSpellModal;box.querySelector('#resultBattle').onclick=chooseBattle;
};
