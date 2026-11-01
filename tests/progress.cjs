const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/progress.js');
const sample={v:2,xp:1025,got:[0,2,31],subjects:{'算数':500,'国語':300,'社会':100,'理科':125},wins:9};
test('QR save round-trips every progress field',()=>assert.deepEqual(P.decode(P.encode(sample,60),60),sample));
test('zero and capped saves round-trip',()=>{for(const x of [0,32767]){const d={...sample,xp:x,got:[],subjects:{'算数':x,'国語':0,'社会':0,'理科':0},wins:9999};assert.deepEqual(P.decode(P.encode(d,60),60),d);}});
test('damaged, foreign and future saves are rejected',()=>{const code=P.encode(sample,60);for(const s of ['', 'https://example.com',code.slice(0,-1)+'z',code.replace('MQ2','MQ3'),'MQ2:!!!!:12345678'])assert.throws(()=>P.decode(s,60));});
test('invalid state cannot overwrite local progress',()=>{for(const patch of [{xp:-1},{xp:1.2},{xp:32768},{got:[60]},{got:[0,0]},{got:'0'},{wins:-1},{subjects:{'算数':32767,'国語':32767,'社会':0,'理科':0}}])assert.throws(()=>P.validate({...sample,...patch},60));});
test('math grows attack; language grows defense',()=>{const empty={'算数':0,'国語':0,'社会':0,'理科':0},s=P.stats(empty),math=P.stats({...empty,'算数':100}),language=P.stats({...empty,'国語':100});assert.ok(math.attack>s.attack);assert.equal(math.defense,s.defense);assert.ok(language.defense>s.defense);assert.equal(language.attack,s.attack);});
