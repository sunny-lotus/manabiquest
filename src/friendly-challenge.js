/* Exact user-selected recording. Playback stays in the existing sound controls. */
const challengeRecording={banks:new WeakMap(),source:null,epoch:0,
 load(ctx){let bank=this.banks.get(ctx);if(bank)return bank;bank=fetch('https://sunny-lotus.github.io/manabiquest/common/audio/seika-two-loops.mp3').then(r=>{if(!r.ok)throw Error('音源を読み込めませんでした');return r.arrayBuffer()}).then(bytes=>ctx.decodeAudioData(bytes));this.banks.set(ctx,bank);bank.catch(()=>this.banks.delete(ctx));return bank;},
 start(){const ctx=gameAudio.ctx;if(!ctx||ctx.state!=='running'||!soundPrefs.bgm||document.hidden||gameAudio.scene!=='battle'||this.source)return;const epoch=this.epoch;
  this.load(ctx).then(buffer=>{if(epoch!==this.epoch||this.source||ctx!==gameAudio.ctx||ctx.state!=='running'||!soundPrefs.bgm||document.hidden||gameAudio.scene!=='battle')return;
   const source=ctx.createBufferSource(),env=ctx.createGain();source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=Math.min(320/3,buffer.duration);env.gain.setValueAtTime(0,ctx.currentTime);env.gain.linearRampToValueAtTime(.7,ctx.currentTime+.08);audioVoice(source,env,gameAudio.music,true);const ended=source.onended;source.onended=()=>{if(ended)ended();if(this.source===source)this.source=null;};this.source=source;source.start(ctx.currentTime+.02);
  }).catch(()=>{const el=document.querySelector('#soundSettings,#pveSound');if(el)el.title='音源を読み込めませんでした。もう一度BGMをONにしてください。';});
 },
 stop(){this.epoch++;const source=this.source;this.source=null;if(source)try{source.stop()}catch{}}
};
const challengePreviousStart=startGameMusic,challengePreviousStop=stopGameMusic;
startGameMusic=function(){if(gameAudio.scene==='battle'){challengeRecording.start();return;}challengePreviousStart();};
stopGameMusic=function(){challengeRecording.stop();challengePreviousStop();};

/* Presentation changes only: progress, QR format, costs and numeric rules stay intact. */
GAME_ICON_SVGS.sword=GAME_ICON_SVGS.friends;
const encouragementSound=playGameSound;playGameSound=function(kind){return encouragementSound(kind==='attack'||kind==='hit'?'charge':kind);};
monsterHTML=function(i){return friendlyPortrait(ManabiRoster.companionId(i),true);};
battleEnemyName=function(i){return FRIENDS[i].name;};
questPvePortrait=function(b,side,actor){if(!side)return actor==='hero'?heroHTML():friendlyPortrait(ChampionsParty.companionId(b.teams[0],actor),true);return friendlyPortrait(actor==='hero'?ManabiRoster.companionId(b.id):ChampionsParty.companionId(b.teams[1],actor),true);};
questPveMeters=function(b){return '<div class="pve-meters">'+b.teams.map((t,i)=>{const energy=b.displayHP?.[i]??b.combat.hp[i],value=i?t.maxHP-energy:energy,from=b.animateBarsFrom?.[i]??energy,shown=i?t.maxHP-from:from,label=i?'やる気':'げんき';return '<section class="pve-hp '+(i?'enemy':'')+'"><b>'+(i?'応援する友だち':'きみのチーム')+'</b>'+questSubjectChip(i?FRIENDS[b.id].subject:ChampionsElements.teamSubject(t))+'<label>'+label+' <strong>'+value+' / '+t.maxHP+'</strong></label><div class="pve-meter" role="meter" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="'+t.maxHP+'" aria-valuenow="'+value+'"><i style="width:'+(shown/t.maxHP*100)+'%"></i></div><label>MP <strong>'+b.combat.mp[i]+' / '+t.maxMP+'</strong></label><div class="pve-meter mp"><i style="width:'+(b.combat.mp[i]/t.maxMP*100)+'%"></i></div></section>';}).join('')+'</div>';};
const encouragementRender=renderBattle;
renderBattle=function(){encouragementRender();const b=battle;if(!b?.combat)return;const screen=stage.querySelector('.quest-pve');if(!screen)return;
 const intro=screen.querySelector('.pve-intro');if(intro){intro.querySelector('b').textContent='少し自信のない友だち';intro.querySelector('strong').textContent='みんなのエールで、やる気をひき出そう！';intro.querySelector('span').textContent='やる気がいっぱいになると仲間に';}
 const together=screen.querySelector('.pve-versus');if(together)together.textContent='🤝';
 const log=screen.querySelector('.pve-log');if(log&&b.phase==='intro')log.textContent='友だちが「やってみよう」と思えるように、応援しよう！';
 if(log&&b.phase==='select'&&b.turn===0&&!b.lastResult)log.textContent='友だちにエールをおくって、やる気を引き出そう！';
 if(log&&(b.phase==='settling'||b.phase==='result')&&b.lastResult){const r=b.lastResult;log.textContent='友だちのやる気 ＋'+r.taken[1]+' ／ きみのつかれ '+r.taken[0]+(r.recovered.some(x=>x)?' ／ ひと休み ＋'+r.recovered[0]:'');}
 screen.querySelectorAll('.shadow-clone,.vanished').forEach(el=>{el.classList.remove('shadow-clone','vanished');});
 if(b.ended){screen.classList.add('challenge-finished');const outcome=screen.querySelector('.pve-outcome');if(outcome)outcome.textContent=b.won?'やる気がわいてきた！':b.combat.winner==='draw'?'おたがいに、よくがんばったね！':'ひと休みして、また応援しよう';
  if(log)log.textContent=b.won?FRIENDS[b.id].name+'「ありがとう！ やってみるよ。いっしょに学ぼう！」':'友だちも、きみも、がんばったね。ひと休みしてまた会おう。';
  if(!screen.querySelector('.challenge-applause')){const applause=document.createElement('p');applause.className='challenge-applause';applause.setAttribute('role','status');applause.textContent='👏 みんなに拍手！ またいっしょに学ぼう';screen.querySelector('.pve-arena').after(applause);}
 }
};
