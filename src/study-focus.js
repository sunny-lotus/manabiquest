/* Question first. Existing answers, grading and saved data are unchanged. */
function studyFocusMenu(){
 const dialog=document.createElement('dialog');dialog.className='qr-dialog study-focus-menu';
 dialog.innerHTML='<div class="qr-dialog-head"><h2>学習メニュー</h2><button class="btn ghost" data-study-close aria-label="とじる">×</button></div><p>'+equipmentEsc(SETS[cur].title)+'</p><p>総合 Lv.'+levelOf(xp)+' ／ '+xp+' けいけんち</p><div class="study-menu-actions"><button class="btn" data-study-home>学習をやめて戻る</button><button class="btn ghost" data-study-save>QRでほぞん</button><button class="btn ghost" data-study-sound>音の設定</button><button class="btn gold" data-study-close>もんだいにもどる</button></div><p class="study-menu-notice" role="status"></p>';
 document.body.append(dialog);dialog.querySelectorAll('[data-study-close]').forEach(b=>b.onclick=()=>dialog.close());
 dialog.querySelector('[data-study-home]').onclick=()=>{const home=document.getElementById('homeBtn');home.click();if(home.classList.contains('warn'))dialog.querySelector('.study-menu-notice').textContent=home.textContent;else dialog.close();};
 dialog.querySelector('[data-study-save]').onclick=()=>{dialog.close();showSpellModal();};
 dialog.querySelector('[data-study-sound]').onclick=()=>{dialog.close();showSoundSettings();};
 dialog.onclose=()=>dialog.remove();dialog.showModal();
}
function studyEnlargeFigure(figure){
 const dialog=document.createElement('dialog');dialog.className='qr-dialog study-figure-dialog';
 dialog.innerHTML='<div class="qr-dialog-head"><h2>もんだいの図</h2><button class="btn ghost" aria-label="とじる">×</button></div>';
 dialog.append(figure.cloneNode(true));document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();dialog.showModal();
}
const studyOriginalShowQ=showQ;
showQ=function(){
 studyOriginalShowQ();const number=stage.querySelector('.qno');if(!number)return;
 const bar=document.createElement('div');bar.className='study-question-bar';number.before(bar);bar.append(number);
 const figure=stage.querySelector('svg.fig');if(figure){const zoom=document.createElement('button');zoom.type='button';zoom.className='study-small-button';zoom.textContent='図を拡大';zoom.onclick=()=>studyEnlargeFigure(figure);bar.append(zoom);}
 const menu=document.createElement('button');menu.type='button';menu.className='study-small-button';menu.textContent='メニュー';menu.onclick=studyFocusMenu;bar.append(menu);
 const choices=stage.querySelector('.choices');if(choices){const labels=[...choices.querySelectorAll('.choice>span:last-child')].map(el=>el.textContent.trim());choices.classList.toggle('study-short-choices',labels.length===4&&labels.every(s=>s.length<=12));}
 const memo=stage.querySelector('.memo:not(.write)');if(memo){const details=document.createElement('details');details.className='study-memo';const summary=document.createElement('summary');summary.textContent='✏ 計算メモを使う';details.append(summary,memo);stage.append(details);}
 requestAnimationFrame(()=>{if(stage.contains(number)&&document.body.classList.contains('learning-question'))number.scrollIntoView({block:'start',behavior:'instant'});});
};
const studyOriginalToTop=toTop;
toTop=function(){const number=stage.querySelector('.qno');if(document.body.classList.contains('learning-question')&&number&&number.textContent!=='けっか'){number.scrollIntoView({block:'start',behavior:'instant'});return;}studyOriginalToTop();};
