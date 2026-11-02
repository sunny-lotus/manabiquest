/* Champions-only rules. Original Quest data stays unchanged. */
(function(root){
'use strict';
function add(list,kind,value,round,from=round){
 if(!value)return;const same=list.filter(e=>e.kind===kind);
 const entry={kind,value,from,until:from+2};
 if(same.length<2)list.push(entry);else{const weakest=same.reduce((a,b)=>a.value<=b.value?a:b);if(value>=weakest.value)Object.assign(weakest,entry);else weakest.until=Math.max(weakest.until,entry.until);}
}
const active=(list,kind,round)=>list.filter(e=>e.kind===kind&&e.from<=round&&e.until>=round);
const sum=(list,kind,round)=>active(list,kind,round).reduce((n,e)=>n+e.value,0);
function create(teams,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){const first=random()<0.5?0:1;return {round:1,first,selector:first,actor:'hero',phase:'select',choices:[{},{}],hp:teams.map(t=>t.maxHP),mp:teams.map(t=>t.maxMP),used:[[],[]],effects:[[],[]],debts:[{},{}],events:[],winner:null};}
function recoveryPercent(round){return Math.max(0,100-Math.max(0,round-5)*20);}
function pace(round){return {openingCap:round<=2?35:null,damagePercent:100+Math.max(0,round-2)*12,pressurePercent:Math.max(0,round-6)*8};}
function takenDamage(raw,maxHP,round){const p=pace(round);return p.openingCap!==null?Math.min(raw,Math.floor(maxHP*p.openingCap/100)):Math.ceil(raw*p.damagePercent/100)+Math.floor(maxHP*p.pressurePercent/100);}
function mpRecovery(choices){return 3+Object.values(choices).filter(x=>x==='attack').length;}
function resolve(b,teams,skills,companions,allyStats){
 const round=b.round,effects=JSON.parse(JSON.stringify(b.effects)),debts=[{},{}],plans=[],elements=root.ChampionsElements,party=root.ChampionsParty,hits=[];
 const actorKeys=t=>party?party.actors(t):['hero',...(t.followers||[t.data.follower]).map((_,j)=>j?'ally2':'ally')];
 for(let i=0;i<2;i++){
  const t=teams[i],ch=b.choices[i],old=b.debts[i],keys=actorKeys(t),followers=t.followers||[t.data.follower];
  if(party&&t.followers&&!party.valid(t.data,t.followers))throw Error('仲間は異なる2人まで、合計50以下です。');
  if(keys.some(key=>ch[key]===undefined))throw Error('全員の行動を選んでね。');
  const skill=Number.isInteger(ch.hero)?skills[ch.hero]:null,m=skill?.move||{},pen=skill?.penalty||{};
  if(!skill&&!['attack','guard'].includes(ch.hero))throw Error('行動が正しくありません。');
  if(old.guard&&ch.hero!=='guard')throw Error('大技の反動で まもるのみです。');
  if(skill&&(!t.data.loadout.includes(ch.hero)||m.once&&b.used[i].includes(ch.hero)))throw Error('その技は使えません。');
  if((skill?.cost||0)>b.mp[i])throw Error('MPが足りません。');
  let mp=Math.min(t.maxMP,b.mp[i]-(skill?.cost||0)+(ch.hero==='guard'?4:m.mp||0));
  const actors=[{key:'hero',m,attack:ch.hero==='attack'||!!m.attack,base:t.attack,subject:elements?(skill?elements.subject(ch.hero):elements.teamSubject(t)):null}];
  let heal=Math.max(0,(ch.hero==='guard'?0:m.heal||0)-(old.heal||0)),shield=ch.hero==='guard'?10:m.shield||0,risk=pen.riskNow||0,counter=m.counter||0;
  for(let j=0;j<followers.length;j++){
   const key=j?'ally2':'ally',id=followers[j],choice=ch[key],s=companions[id],a=allyStats(t.data.xp,id);
   if(!['attack','support','skill'].includes(choice))throw Error('仲間の行動が正しくありません。');
   const move=choice==='skill'?s.move:{};if(choice==='skill'){if(mp<s.cost)throw Error('MPが足りません。');mp-=s.cost;}
   heal+=move.heal||0;shield+=choice==='support'?a.guard:move.shield||0;risk+=move.risk||0;counter+=move.counter||0;
   actors.push({key,m:move,attack:choice==='attack'||!!move.damage,base:a.attack,subject:elements?elements.allySubject(t,key):null});
  }
  plans.push({actors,mp,heal,shield,risk,counter,damage:0,m,pen,skill});if(m.cleanse)effects[i]=effects[i].filter(e=>e.kind!=='down');
 }
 for(let i=0;i<2;i++)for(const a of plans[i].actors)if(a.m.down)add(effects[1-i],'down',a.m.down,round);
 for(const i of [b.first,1-b.first])for(const a of plans[i].actors){if(!a.attack)continue;const hero=a.key==='hero',t=teams[i],m=a.m;
  let value=a.base+(m.damage||0)+sum(effects[i],'party',round)-sum(effects[i],'down',round);
  if(hero){value+=sum(effects[i],'boost',round)-(b.debts[i].attack||0);effects[i]=effects[i].filter(e=>!(e.kind==='boost'&&e.from<=round));if(m.finish&&b.hp[1-i]<=teams[1-i].maxHP/2)value+=m.finish;}
  const extra=hero?sum(effects[i],'weak',round)+(m.weakCopy&&elements?elements.xpBonus(t,a.subject):0):0;
  const hit=elements?elements.hit(t,teams[1-i],a.subject,Math.max(1,value),extra,a.key):{damage:Math.max(1,value),weak:false};plans[i].damage+=hit.damage;
  if(hit.weak)hits.push({team:i,actor:a.key,subject:a.subject,bonus:hit.bonus});
  if(hero)for(const e of active(effects[i],'weak',round))e.charges=(e.charges??2)-1;effects[i]=effects[i].filter(e=>e.kind!=='weak'||e.charges!==0);
 }
 for(let i=0;i<2;i++){
  const p=plans[i];for(const a of p.actors){const m=a.m;for(const kind of ['weak','boost','party'])if(m[kind])add(effects[i],kind,m[kind],round,round+1);if(m.regen)add(effects[i],'regen',m.regen,round);}
  if(p.pen.riskParty&&p.m.party)add(effects[i],'risk',p.pen.riskParty,round,round+1);
  debts[i]={attack:p.pen.attack||0,heal:p.pen.heal||0,guard:!!p.pen.guard};if(p.m.once)b.used[i].push(b.choices[i].hero);
 }
 const incoming=plans.map((p,i)=>plans[1-i].damage>0?Math.max(0,plans[1-i].damage-teams[i].defense-Math.min(30,p.shield))+p.risk+sum(effects[i],'risk',round):0);
 const recovered=plans.map((p,i)=>Math.floor((p.heal+sum(effects[i],'regen',round))*recoveryPercent(round)/100));
 const taken=plans.map((p,i)=>takenDamage(incoming[i]+(plans[i].damage>0?Math.min(30,plans[1-i].counter):0),teams[i].maxHP,round));
 const remaining=plans.map((p,i)=>Math.min(teams[i].maxHP,b.hp[i]+recovered[i])-taken[i]),hp=remaining.map(value=>Math.max(0,value));
 b.mpRecovery=plans.map((p,i)=>{const natural=3,attacks=Object.values(b.choices[i]).filter(x=>x==='attack').length,total=natural+attacks,actual=Math.max(0,Math.min(total,teams[i].maxMP-p.mp));return {natural,attacks,total,actual};});
 for(let i=0;i<2;i++){b.hp[i]=hp[i];b.mp[i]=Math.min(teams[i].maxMP,Math.max(0,plans[i].mp)+b.mpRecovery[i].actual);effects[i]=effects[i].filter(e=>e.until>round);}
 b.effects=effects;b.debts=debts;b.elementHits=hits;b.overkill=remaining.map(value=>Math.max(0,-value));b.tieBreak=hp.every(value=>value===0);b.winner=b.tieBreak?(remaining[0]===remaining[1]?'draw':remaining[0]>remaining[1]?0:1):hp[0]===0?1:hp[1]===0?0:null;return {incoming,hp,recovered,remaining,taken};
}
function summary(b,i){const names={party:'こうげき強化',down:'こうげき低下',boost:'次の一撃',regen:'継続回復',risk:'被ダメージ増加',weak:'弱点強化'},list=b.effects[i];return Object.keys(names).flatMap(k=>{const es=list.filter(e=>e.kind===k);return es.length?[names[k]+' '+es.length+'/2段階（'+Math.max(...es.map(e=>e.until-b.round+1))+'R）']:[]}).concat(b.debts[i].guard?['反動：次は まもるのみ']:[],b.debts[i].attack?['反動：次の攻撃 −'+b.debts[i].attack]:[],b.debts[i].heal?['反動：次の回復 −'+b.debts[i].heal]:[]).join(' ／ ');}
const api={create,resolve,add,summary,recoveryPercent,mpRecovery,pace,takenDamage};root.ChampionsRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
