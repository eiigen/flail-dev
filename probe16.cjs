const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0,100)));
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const clickText = async (needle) => {
    const pos = await page.evaluate((n) => {
      const g = window.game;
      const active = g.scene.getScenes(true)[0];
      const t = (active.children.list||[]).find(o => o.text && String(o.text).includes(n));
      if (!t) return null;
      return { gx:t.x, gy:t.y, gw:g.config.width, gh:g.config.height,
        rect:(()=>{const r=document.querySelector('canvas').getBoundingClientRect();
          return {left:r.left,top:r.top,w:r.width,h:r.height};})() };
    }, needle);
    if (!pos) return false;
    await page.mouse.click(pos.rect.left+pos.gx*(pos.rect.w/pos.gw), pos.rect.top+pos.gy*(pos.rect.h/pos.gh));
    await page.waitForTimeout(900);
    return true;
  };

  // ── PART A: continue-run restores context ──
  // play a fresh run briefly so save.currentRun exists
  await clickText('New Run');
  await clickText('Cursed Forest');
  await clickText('Elias');   // apprentice_mage / fire_staff — distinct from Seraphine
  await page.waitForTimeout(1500);
  const inRun = await page.evaluate(() => ({
    mapId: window.game.registry.get('mapId'),
    charId: window.game.registry.get('charId'),
  }));
  // back to menu (reload = clean state), Continue should restore Elias+cursed_forest
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const hasContinue = await page.evaluate(() => {
    const mm = window.game.scene.getScene('MainMenu');
    return (mm.children.list||[]).some(o => o.text && String(o.text).includes('Continue'));
  });
  await clickText('Continue Run');
  await page.waitForTimeout(1200);
  const continued = await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    return {
      scene: window.game.scene.getScenes(true).map(s=>s.scene.key),
      mapId: window.game.registry.get('mapId'),
      charId: window.game.registry.get('charId'),
      hasPlayer: !!p,
    };
  });

  // ── PART B: fast-move gap stress (sustained diagonal sprint, 8s) ──
  const cdp = await ctx.newCDPSession(page);
  const jx = 100, jy = 780;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jx, y: jy }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jx + 55, y: jy - 55 }] });
  const gapChecks = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(1000);
    const chk = await page.evaluate(() => {
      const gs = window.game.scene.getScene('Game');
      const mg = gs.world.systems.find(s => s.name === 'MapGenSystem');
      const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
      const t = p.getComponent('CTransform');
      const CS = 8 * 32;
      const pcx = Math.floor(t.x / CS), pcy = Math.floor(t.y / CS);
      let missing = [];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (!mg.generated.has(`${pcx+dx},${pcy+dy}`)) missing.push(`${pcx+dx},${pcy+dy}`);
      }
      return { px: Math.round(t.x), py: Math.round(t.y), missing };
    });
    gapChecks.push(chk);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const anyGap = gapChecks.some(c => c.missing.length > 0);

  console.log('PROBE16::' + JSON.stringify({ inRun, hasContinue, continued, anyGap, lastPos: gapChecks[gapChecks.length-1], errs }));
  await browser.close();
})();
