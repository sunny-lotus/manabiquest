/* Element rules use the existing sticker and companion subject catalog. */
(function(root){
 const cycle={算数:'理科',理科:'社会',社会:'国語',国語:'算数'};let stickers=[],companions=[];
 const label=s=>s||'無属性',subject=id=>stickers[id]?.subject||null;
 function configure(s,c){stickers=s;companions=c;}
 function main(team){return Number.isInteger(team.main)&&team.data.loadout.includes(team.main)?team.main:team.data.loadout.includes(team.data.equipped)?team.data.equipped:team.data.loadout[0]??-1;}
 const teamSubject=t=>subject(main(t));
 const weakness=t=>Object.keys(cycle).find(s=>cycle[s]===teamSubject(t))||null;
 const xpBonus=(t,s)=>Math.min(2,Math.floor(Math.sqrt(Math.max(0,t.data.subjects?.[s]||0)/200)));
 function hit(t,target,s,raw,extra=0,actor='hero'){const weak=!!s&&cycle[s]===teamSubject(target),bonus=weak&&actor==='hero'?Math.max(0,Math.min(12,xpBonus(t,s)+Math.trunc((t.effect.weakness||0)/4)+Math.floor(extra/2))):0;return {damage:raw+bonus,weak,bonus,subject:s};}
 const allySubject=(t,actor='ally')=>companions[actor==='ally2'?t.followers?.[1]:t.followers?.[0]??t.data.follower]?.subject||null;
 const api={configure,cycle,label,subject,main,teamSubject,weakness,xpBonus,hit,allySubject};root.ChampionsElements=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
