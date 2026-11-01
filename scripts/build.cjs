// The password is supplied by the caller and is never stored in source control.
const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib'),vm=require('node:vm');
const password=process.env.MANABI_PASSWORD;if(!password)throw Error('Set MANABI_PASSWORD to rebuild the encrypted game.');
const original=fs.readFileSync('index.html','utf8'),d=vm.runInNewContext('('+original.match(/const D=(.*);/)[1]+')');
const key=crypto.pbkdf2Sync(password,Buffer.from(d.salt,'base64'),d.it,32,'sha256'),encrypted=Buffer.from(d.ct,'base64');
const dec=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(d.iv,'base64'));dec.setAuthTag(encrypted.subarray(-16));
let html=zlib.gunzipSync(Buffer.concat([dec.update(encrypted.subarray(0,-16)),dec.final()])).toString('utf8');
html=html.replace(/<!-- adventure-styles-start -->[\s\S]*?<!-- adventure-styles-end -->/,'').replace(/\/\* adventure-runtime-start \*\/[\s\S]*?\/\* adventure-runtime-end \*\//,'');
// Apply changes to the legacy game once. Subsequent builds replace only the extension.
if(!html.includes('/* adventure-save-v2 */')){
  const replacements=[
    ['const d = {xp, got:[...cleared], at:Date.now()};','const d = {...progressData(), at:Date.now()}; /* adventure-save-v2 */'],
    ['{xp, got:[...cleared], live:true}','{...progressData(), live:true}'],
    ['xp=saved.xp; cleared.clear(); saved.got.forEach(n=>cleared.add(n)); menu();','applyProgress(saved); menu();'],
    ['clearLocal(); xp=0; cleared.clear(); menu();','clearLocal(); xp=0; cleared.clear(); subjectXP=emptySubjects(); battleWins=0; saveLocal(); menu();'],
    ['xp=v.xp; cleared.clear(); v.got.forEach(n=>cleared.add(n));','applyProgress({xp:v.xp,got:[...v.got]});']
  ];
  for(const [a,b]of replacements){if(!html.includes(a))throw Error('Legacy integration point missing: '+a);html=html.replace(a,b);}
}
const assets={};for(const f of fs.readdirSync('assets/monsters'))if(f.endsWith('.png'))assets[f.slice(0,-4)]='data:image/png;base64,'+fs.readFileSync('assets/monsters/'+f).toString('base64');
const runtime=['vendor/qrcode.js','vendor/jsQR.js','src/progress.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n;\n')+'\nconst ADVENTURE_ASSETS='+JSON.stringify(assets)+';\n'+fs.readFileSync('src/adventure.js','utf8');
html=html.replace('</head>','<!-- adventure-styles-start --><style>'+fs.readFileSync('src/adventure.css','utf8')+'</style><!-- adventure-styles-end --></head>');
html=html.replace(/\nwelcome\(\);\s*<\/script>/,()=> '\n/* adventure-runtime-start */\n'+runtime+'\n/* adventure-runtime-end */\nwelcome();\n</script>');
if(!html.includes('const ADVENTURE_ASSETS='))throw Error('Runtime insertion failed');
// Parse the complete script before producing a new encrypted release.
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
const salt=crypto.randomBytes(16),iv=crypto.randomBytes(12),iterations=150000,k=crypto.pbkdf2Sync(password,salt,iterations,32,'sha256');
const cipher=crypto.createCipheriv('aes-256-gcm',k,iv),ct=Buffer.concat([cipher.update(zlib.gzipSync(Buffer.from(html))),cipher.final(),cipher.getAuthTag()]);
const data={salt:salt.toString('base64'),iv:iv.toString('base64'),it:iterations,ct:ct.toString('base64')};
fs.writeFileSync('index.html',original.replace(/const D=.*;/,'const D='+JSON.stringify(data)+';'));
if(process.argv.includes('--preview'))fs.writeFileSync('game.source.html',html);
console.log('Built encrypted index.html; original quizzes and password gate retained.');
