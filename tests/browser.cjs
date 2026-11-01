const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('index.html'));}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>{errors.push(e.message);console.error('Browser:',e.message);});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('#pw').fill(process.env.MANABI_PASSWORD);await page.locator('button[type=submit]').click();await page.locator('#welcomeQR').waitFor();
  console.log('Unlocked');await page.locator('#fresh').click();await page.locator('.adventure-hub').waitFor();console.log('Hub ready');
  // Award through actual quiz answer handling, including generated math questions.
  for(const su of ['算数','国語']){
   await page.evaluate(su=>start(SETS.findIndex(s=>subjOf(s)===su)),su);
   await page.evaluate(()=>{const q=order[idx];if(q.type==='input'){q.ans.forEach((a,i)=>{const el=document.getElementById('in'+i);if(el)el.value=a;});answerInput();}else if(q.type==='write'){document.getElementById('show').click();document.getElementById('wok').click();}else{const b=[...document.querySelectorAll('.choice')].find(b=>b.dataset.v===q.a);b.click();}});
   assert.equal(await page.evaluate(s=>subjectXP[s],su),10);
  }
  const first=await page.evaluate(()=>progressData());assert.equal(first.xp,20);
  await page.evaluate(()=>{start(SETS.findIndex(s=>subjOf(s)==='国語'));while(results.length<order.length){idx=results.length;showQ();finish(order[idx],true,order[idx].a);}showResult();});
  await page.locator('#resultQR').waitFor();assert.ok(await page.evaluate(()=>subjectXP['国語']>10));assert.equal(await page.evaluate(()=>cleared.size),1);
  await page.evaluate(()=>menu());await page.locator('[data-adventure=battle]').click();await page.locator('[data-enemy="0"]').click();
  await page.locator('#guard').click();assert.equal(await page.evaluate(()=>battle.guard),1);
  for(let i=0;i<30&&await page.locator('#attack').count();i++)await page.locator('#attack').click();assert.equal(await page.evaluate(()=>battleWins),1);
  await page.locator('#battleSave').click();await page.locator('#saveQR').waitFor();
  const qrFile=path.resolve('test-results/save.png');fs.mkdirSync('test-results',{recursive:true});
  const data=await page.locator('#saveQR').evaluate(c=>c.toDataURL());fs.writeFileSync(qrFile,Buffer.from(data.split(',')[1],'base64'));
  const expected=await page.evaluate(()=>progressData());await page.locator('#mClose').click();
  await page.evaluate(()=>{applyProgress({xp:0,got:[]});saveLocal();menu();showSpellModal();});
  await page.locator('#qrFile').setInputFiles(qrFile);await page.locator('#confirmImport').waitFor();assert.equal(await page.evaluate(()=>xp),0,'preview must not mutate state');await page.locator('#confirmImport').click();assert.deepEqual(await page.evaluate(()=>progressData()),expected);
  await page.reload();await page.locator('#local').waitFor();await page.locator('#local').click();assert.deepEqual(await page.evaluate(()=>progressData()),expected);
  await page.locator('[data-adventure=save]').click();await page.locator('details').filter({has:page.locator('#importCode')}).locator('summary').click();await page.locator('#importCode').fill('MQ2:broken:12345678');await page.locator('#readSaveCode').click();assert.equal(await page.locator('#confirmImport').count(),0);assert.deepEqual(await page.evaluate(()=>progressData()),expected);await page.keyboard.press('Escape');
  // The old four-word spell and legacy local save preserve total XP and stickers.
  await page.evaluate(()=>{const d=clean({xp:500,got:[0,2]});applyProgress(d);saveLocal();welcome();});await page.locator('#local').click();assert.equal(await page.evaluate(()=>xp),500);assert.equal(await page.evaluate(()=>subjectXP['算数']),0);
  await page.evaluate(()=>{welcome();document.getElementById('spellIn').value=encodeAll(100,new Set([1])).join(' ');});await page.locator('#cont').click();assert.equal(await page.evaluate(()=>xp),100);assert.deepEqual(await page.evaluate(()=>[...cleared]),[1]);
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile must not overflow');
  await page.locator('[data-adventure=battle]').click();await page.locator('[data-enemy="2"]').click();await page.screenshot({path:'test-results/battle.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(let i=0;i<20&&await page.locator('#attack').count();i++)await page.locator('#attack').click();assert.equal(await page.evaluate(()=>battle.hp),0,'strong enemy can end the battle without removing XP');assert.equal(await page.evaluate(()=>xp),100);
  await page.locator('#retryBattle').click();await page.locator('[data-enemy="2"]').click();
  await page.evaluate(()=>showSpellModal());await page.screenshot({path:'test-results/qr.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS: encrypted unlock, quizzes, subject XP, battle, QR image restore, confirmation, local persistence, invalid QR, old saves, mobile layout; no browser errors.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
