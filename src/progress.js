/* Portable, versioned save format. No names, passwords or server calls. */
(function(root){
  'use strict';
  const MAX=32767;
  const R=root.ManabiRoster||(typeof require==='function'?require('./roster.js'):null);
  function checksum(s){let c=0xffffffff;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i);for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return ((c^0xffffffff)>>>0).toString(16).padStart(8,'0');}
  function validate(d,count){
    const num=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;
    if(!d||d.v!==2||!num(d.xp,MAX)||!Array.isArray(d.got)||d.got.length>count||!d.got.every(x=>num(x,count-1))||new Set(d.got).size!==d.got.length||!d.subjects||!['算数','国語','社会','理科'].every(k=>num(d.subjects[k],MAX))||Object.values(d.subjects).reduce((a,b)=>a+b,0)>d.xp||!num(d.wins,9999))throw Error('セーブの内容が正しくないよ。');
    if(d.equipped!==undefined&&(!Number.isInteger(d.equipped)||d.equipped < -1||d.equipped>=count||(d.equipped!==-1&&!d.got.includes(d.equipped))))throw Error('持っていないステッカーは装備できないよ。');
    if(d.loadout!==undefined&&(!Array.isArray(d.loadout)||d.loadout.length>4||new Set(d.loadout).size!==d.loadout.length||!d.loadout.every(i=>num(i,count-1)&&d.got.includes(i))||d.equipped!==-1&&d.equipped!==undefined&&!d.loadout.includes(d.equipped)))throw Error('装備は持っているステッカーを4枚まで選んでね。');
    if(d.companions!==undefined&&!num(d.companions,R.mask))throw Error('仲間の記録が正しくないよ。');
    if(d.follower!==undefined&&(!Number.isInteger(d.follower)||d.follower < -1||d.follower>=R.companions.length||(d.follower>=0&&d.follower!==2&&!((d.companions||0)&(1<<R.enemyId(d.follower))))))throw Error('まだ仲間になっていない子は連れていけないよ。');
    if(d.followers!==undefined&&(!Array.isArray(d.followers)||d.followers.length<1||d.followers.length>2||new Set(d.followers).size!==d.followers.length||d.followers[0]!==d.follower||!d.followers.every(id=>Number.isInteger(id)&&id>=0&&id<R.companions.length&&(id===2||!!((d.companions||0)&(1<<R.enemyId(id)))))||d.followers.reduce((n,id)=>n+(id===2?10:R.companions[id].level||5),0)>50))throw Error('仲間は持っている子を2人まで、合計50以下で選んでね。');
    return {...(d.followers===undefined?{}:{followers:[...d.followers]}),...(d.loadout===undefined?{}:{loadout:[...d.loadout]}),...(d.follower===undefined?{}:{follower:d.follower}),...(d.equipped===undefined?{}:{equipped:d.equipped}),...(d.companions===undefined?{}:{companions:d.companions}),v:2,xp:d.xp,got:[...d.got],subjects:Object.fromEntries(['算数','国語','社会','理科'].map(k=>[k,d.subjects[k]])),wins:d.wins};
  }
  function encode(d,count){d=validate(d,count);const values=[2,d.xp,d.got,['算数','国語','社会','理科'].map(k=>d.subjects[k]),d.wins,...(d.loadout!==undefined?[d.companions||0,d.equipped??-1,d.follower??-1,d.loadout]:d.follower!==undefined?[d.companions||0,d.equipped??-1,d.follower]:d.equipped!==undefined?[d.companions||0,d.equipped]:d.companions===undefined?[]:[d.companions])];if(d.followers!==undefined){if(d.loadout===undefined)throw Error('新しい装備の記録が必要だよ。');values.push(d.followers);}const a=JSON.stringify(values);return 'MQ2:'+btoa(a)+':'+checksum(a);}
  function decode(s,count){
    if(typeof s!=='string'||s.length>3000||!/^MQ2:[A-Za-z0-9+/=]+:[a-f0-9]{8}$/.test(s))throw Error('学びクエストのQRコードをえらんでね。');
    const [,b,c]=s.split(':');let a;try{a=atob(b);}catch{throw Error('QRコードがこわれているよ。');}if(checksum(a)!==c)throw Error('QRコードがこわれているよ。');
    let t;try{t=JSON.parse(a);}catch{throw Error('セーブを読み取れなかったよ。');}if(!Array.isArray(t)||![5,6,7,8,9,10].includes(t.length)||!Array.isArray(t[3])||t[3].length!==4)throw Error('対応していないセーブだよ。');
    return validate({v:t[0],xp:t[1],got:t[2],subjects:Object.fromEntries(['算数','国語','社会','理科'].map((k,i)=>[k,t[3][i]])),wins:t[4],...(t.length>=6?{companions:t[5]}:{}),...(t.length>=7?{equipped:t[6]}:{}),...(t.length>=8?{follower:t[7]}:{}),...(t.length>=9?{loadout:t[8]}:{}),...(t.length===10?{followers:t[9]}:{})},count);
  }
  function stats(totalXP){let level=1;while(level<40&&20*(level+1)*level<=totalXP)level++;return {level,attack:12+(level-1)*2,defense:4+(level-1),hp:80};}
  function weaknessBonus(subjects,weakness){return Math.floor(Math.sqrt(Math.max(0,subjects[weakness]||0)/10))*2;}
  function attackDamage(totalXP,subjects,weakness,charge){const base=stats(totalXP);return base.attack+Math.min(2,Math.max(0,charge))*6+weaknessBonus(subjects,weakness);}
  function enemyStats(withCompanion,recommended=5){const extra=Math.max(0,recommended-5);return {hp:(withCompanion?170:140)+extra*12,attack:(withCompanion?34:30)+extra};}
  function companionStats(totalXP,id,subjects={},weakness=''){
    if(!Number.isInteger(id)||id<0||id>=R.companions.length)throw Error('仲間が正しくないよ。');
    const level=stats(totalXP).level,subject=['算数','国語',null][id];
    if(id<3)return {attack:(id===0?4:3)+Math.floor((level-1)/3)+(subject&&subject===weakness?Math.floor(weaknessBonus(subjects,subject)/2):0),heal:[2,4,3][id],guard:[3,1,2][id]};
    const f=R.companions[id],role={attack:[5,1,1],guard:[2,1,4],heal:[2,5,0],magic:[3,4,1],support:[3,3,2]}[f.role];
    return {attack:role[0]+Math.floor((level-1)/3)+(f.subject===weakness?Math.floor(weaknessBonus(subjects,f.subject)/2):0),heal:role[1],guard:role[2]};
  }
  const api={encode,decode,validate,stats,weaknessBonus,attackDamage,enemyStats,companionStats};root.ManabiProgress=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
