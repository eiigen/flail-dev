const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0,100)));

  const boot = async () => {
    await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
  };
  const clickText = async (sceneKey, needle) => {
    const pos = await page.evaluate(([sk, n]) => {
      const g = window.game;
      const sc = g.scene.getScene(sk);
      const t = (sc?.children.list||[]).find(o => o.text && String(o.text).includes(n));
      if (!t) return null;
      return { gx: t.x, gy: t.y, gw: g.config.width, gh: g.config.height,
               rect: (()=>{const r=document.querySelector('canvas').getBoundingClientRect();
                 return {left:r.left,top:r.top,w:r.width,h:r.height};})() };
    }, [sceneKey, needle]);
    if (!pos) return false;
    await page.mouse.click(pos.rect.left + pos.gx*(pos.rect.w/pos.gw),
                           pos.rect.top + pos.gy*(pos.rect.h/pos.gh));
    await page.waitForTimeout(900);
    return true;
  };

  // portrait run
  await boot();
  await clickText('MainMenu', 'New Run');
  await clickText('MapSelectScene', 'Cursed Forest');
  await clickText('CharSelectScene', 'Seraphine');
  await page.waitForTimeout(1200);

  const cdp = await ctx.newCDPSession(page);
  const jx = 100, jy = 780;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jx, y: jy }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jx, y: jy - 55 }] });
  const samples = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(500);
    samples.push(await page.evaluate(() => {
      const gs = window.game.scene.getScene('Game');
      const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
      if (!p) return null;
      const t = p.getComponent('CTransform');
      const cam = gs.cameras.main;
      return { px: Math.round(t.x), py: Math.round(t.y),
               sx: Math.round(cam.scrollX), sy: Math.round(cam.scrollY) };
    }));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const last = samples[samples.length-1] ?? {};
  const followOK = last.px !== undefined &&
    Math.abs((last.px - 360) - last.sx) < 90 && Math.abs((last.py - 640) - last.sy) < 90;

  // desktop landscape regression
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pd = await ctx2.newPage();
  await pd.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle' });
  await pd.waitForTimeout(2500);
  const dclick = async (sk, n) => {
    const pos = await pd.evaluate(([sceneKey, n2]) => {
      const g = window.game;
      const sc = g.scene.getScene(sceneKey);
      const t = (sc?.children.list||[]).find(o => o.text && String(o.text).includes(n2));
      if (!t) return null;
      return { gx: t.x, gy: t.y, gw: g.config.width, gh: g.config.height,
               rect: (()=>{const r=document.querySelector('canvas').getBoundingClientRect();
                 return {left:r.left,top:r.top,w:r.width,h:r.height};})() };
    }, [sk, n]);
    if (!pos) return false;
    await pd.mouse.click(pos.rect.left + pos.gx*(pos.rect.w/pos.gw),
                         pos.rect.top + pos.gy*(pos.rect.h/pos.gh));
    await pd.waitForTimeout(900);
    return true;
  };
  await dclick('MainMenu', 'New Run');
  await dclick('MapSelectScene', 'Cursed Forest');
  await dclick('CharSelectScene', 'Elias');   // 2nd default char
  await pd.waitForTimeout(1200);
  await pd.keyboard.down('s'); await pd.waitForTimeout(1200); await pd.keyboard.up('s');
  const desk = await pd.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    const t = p.getComponent('CTransform');
    const cam = gs.cameras.main;
    return { px: Math.round(t.x), py: Math.round(t.y), sy: Math.round(cam.scrollY),
             gh: gs.scale.height };
  });
  const deskFollowOK = Math.abs((desk.py - desk.gh/2) - desk.sy) < 90;

  console.log('PROBE13::' + JSON.stringify({ portraitSamples: samples, followOK, desk, deskFollowOK, errs }));
  await browser.close();
})();
