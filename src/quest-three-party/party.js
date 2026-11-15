(function(root){
 let roster=[],base=[];
 const cost=id=>id===2?10:roster[id]?.level||5;
 const ids=t=>Array.isArray(t.followers)?t.followers:[t.data.follower];
 const actors=t=>['hero',...ids(t).map((_,i)=>i===0?'ally':'ally2')];
 const companionId=(t,actor)=>ids(t)[actor==='ally2'?1:0];
 const owned=(data,id)=>Number.isInteger(id)&&id>=0&&id<roster.length&&(id===2||!!((data.companions||0)&(1<<(id<2?id:id-1))));
 function valid(data,list){return Array.isArray(list)&&list.length>=1&&list.length<=2&&new Set(list).size===list.length&&list.every(id=>owned(data,id))&&list.reduce((n,id)=>n+cost(id),0)<=50;}
 function defaults(data){const first=data.follower>=0?data.follower:2,list=[first];const candidates=[2,...roster.map((_,i)=>i).sort((a,b)=>cost(a)-cost(b))];const second=candidates.find(id=>id!==first&&owned(data,id)&&cost(id)+cost(first)<=50);if(second!==undefined)list.push(second);return list;}
 function configure(r,s){roster=r;base=s;}
 function skills(){const s=base.map(x=>({...x,move:{...x.move}}));const set=(id,cost,description,move,warning='')=>Object.assign(s[id],{cost,description,move,warning});
  set(0,6,'仲間の攻撃＋10。',{damage:10});set(1,6,'HP10回復。ダメージを8減らす。',{heal:10,shield:8});set(2,8,'HP10回復。主人公の次の攻撃＋4。',{heal:10,boost:4});
  set(3,5,'仲間の攻撃＋10。少ないMPで使える火の技。',{damage:10});set(7,5,'仲間の攻撃＋10。少ないMPで使える剣の技。',{damage:10});set(11,5,'HP16回復。少ないMPでこまめに回復。',{heal:16});set(15,5,'HP8回復。ダメージを6減らす。',{heal:8,shield:6});
  set(4,8,'次の3ラウンド、3人の攻撃をそれぞれ＋3。',{party:3});set(8,9,'仲間の攻撃＋18。',{damage:18});set(12,8,'主人公の次の攻撃＋12。ダメージを4減らす。',{boost:12,shield:4});set(16,7,'次の主人公の攻撃2回まで弱点追加＋4。3ラウンド以内。',{weak:8});
  set(5,10,'このラウンドから3ラウンド、相手全員の攻撃−5。',{down:5});set(9,10,'ダメージを16減らす。攻撃を受けたら10反撃。',{shield:16,counter:10});set(13,10,'HP14回復。主人公の次の攻撃＋8。',{heal:14,boost:8});set(17,11,'次の3ラウンド、3人の攻撃をそれぞれ＋5。',{party:5});
  for(const id of [6,10])set(id,16,'仲間の攻撃＋30。',{damage:30,risk:8},'受けるダメージ＋8');
  set(14,16,'HP18回復。相手全員の攻撃を3ラウンド5下げる。',{heal:18,down:5,risk:5},'このラウンドは受けるダメージ＋5');set(18,16,'ダメージを26減らす。攻撃を受けたら10反撃。',{shield:26,counter:10,risk:6},'このラウンドは受けるダメージ＋6');return s;}
 const api={configure,cost,ids,actors,companionId,owned,valid,defaults,skills};root.ChampionsParty=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
