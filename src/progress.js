/* Portable, versioned save format. No names, passwords or server calls. */
(function(root){
  'use strict';
  const MAX=32767;
  function checksum(s){let c=0xffffffff;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i);for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return ((c^0xffffffff)>>>0).toString(16).padStart(8,'0');}
  function validate(d,count){
    const num=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;
    if(!d||d.v!==2||!num(d.xp,MAX)||!Array.isArray(d.got)||d.got.length>count||!d.got.every(x=>num(x,count-1))||new Set(d.got).size!==d.got.length||!d.subjects||!['算数','国語','社会','理科'].every(k=>num(d.subjects[k],MAX))||Object.values(d.subjects).reduce((a,b)=>a+b,0)>d.xp||!num(d.wins,9999))throw Error('セーブの内容が正しくないよ。');
    return {v:2,xp:d.xp,got:[...d.got],subjects:Object.fromEntries(['算数','国語','社会','理科'].map(k=>[k,d.subjects[k]])),wins:d.wins};
  }
  function encode(d,count){d=validate(d,count);const a=JSON.stringify([2,d.xp,d.got,['算数','国語','社会','理科'].map(k=>d.subjects[k]),d.wins]);return 'MQ2:'+btoa(a)+':'+checksum(a);}
  function decode(s,count){
    if(typeof s!=='string'||s.length>3000||!/^MQ2:[A-Za-z0-9+/=]+:[a-f0-9]{8}$/.test(s))throw Error('学びクエストのQRコードをえらんでね。');
    const [,b,c]=s.split(':');let a;try{a=atob(b);}catch{throw Error('QRコードがこわれているよ。');}if(checksum(a)!==c)throw Error('QRコードがこわれているよ。');
    let t;try{t=JSON.parse(a);}catch{throw Error('セーブを読み取れなかったよ。');}if(!Array.isArray(t)||t.length!==5||!Array.isArray(t[3])||t[3].length!==4)throw Error('対応していないセーブだよ。');
    return validate({v:t[0],xp:t[1],got:t[2],subjects:Object.fromEntries(['算数','国語','社会','理科'].map((k,i)=>[k,t[3][i]])),wins:t[4]},count);
  }
  function stats(s){return {attack:12+Math.floor(Math.sqrt(s['算数']/10))*2,defense:4+Math.floor(Math.sqrt(s['国語']/10)),hp:80};}
  const api={encode,decode,validate,stats};root.ManabiProgress=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
