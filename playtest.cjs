const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.GAME_URL || 'http://127.0.0.1:3000/';
const OUT = process.env.SCREENSHOT_DIR || '/home/user/flail/screens';
function log(m){console.log('PLAYTEST::'+m);}
function w(p,d){try{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,d);}catch(e){}}
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = [];
  page.on('console', (m) => logs.push('['+m.type()+'] '+m.text()));
  page.on('pageerror', (e) => logs.push('[pageerror] '+e.message));
  page.on('requestfailed', (r) => { const u=r.url(); if(/\.(png|json|js|css)\b/.test(u)) logs.push('[reqfail] '+u+' '+(r.failure()?r.failure().errorText:'')); });
  const result = { ok:false, notes:[] };
  try {
    log('goto '+URL);
    await page.goto(URL, { waitUntil:'load', timeout:30000 });
    await page.waitForTimeout(6000);
    const canvas = await page.$('canvas');
    if (canvas){ const b=await canvas.boundingBox(); result.canvasBox=b; log('canvasBox '+JSON.stringify(b)); } else result.notes.push('NO canvas');
    result.state = await page.evaluate(()=>{const o={};try{if(window.game){o.scenes=(window.game.scenes?window.game.scenes.getAll():[]).map(s=>s&&s.scene&&(s.scene.key||s.scene.classType));o.running=!!window.game.isRunning;}}catch(e){o.err=String(e);}return o;}).catch(()=>({}));
    log('state '+JSON.stringify(result.state));
    await page.screenshot({ path: OUT+'/01-menu.png' }).catch(e=>log('shot1 '+e.message));
    await page.keyboard.press('Enter').catch(()=>{});
    await page.waitForTimeout(1500);
    if (canvas){ const b=await canvas.boundingBox(); if(b){ await page.mouse.click(b.x+b.width/2, b.y+b.height/2+60).catch(()=>{}); await page.keyboard.press('Enter').catch(()=>{}); } }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: OUT+'/02-after-start.png' }).catch(()=>{});
    result.state2 = await page.evaluate(()=>{const o={};try{if(window.game){o.scenes=(window.game.scenes?window.game.scenes.getAll():[]).map(s=>s&&s.scene&&(s.scene.key||s.scene.classType));const g=window.game.scenes&&window.game.scenes.getScene&&window.game.scenes.getScene('Game');o.gameScene=g?'active':'not-active';}}catch(e){o.err=String(e);}return o;}).catch(()=>({}));
    result.ok = true;
  } catch(e){ result.error=String(e); log('HARNESS ERROR '+e.message); }
  finally {
    result.consoleCount = logs.length;
    result.errors = logs.filter(l=>/\b(error|fail|exception)\b/i.test(l)).slice(0,40);
    w(OUT+'/console.log', logs.join('\n'));
    log('RESULT::'+JSON.stringify({ok:result.ok,state:result.state,state2:result.state2,canvasBox:result.canvasBox,consoleCount:logs.length,errorCount:result.errors.length,errors:result.errors,notes:result.notes}));
    await browser.close();
  }
})();
