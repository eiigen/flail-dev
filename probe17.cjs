const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0,110)));
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

  const R = {};
  // ── map locks visible ──
  await clickText('New Run');
  R.mapLocks = await page.evaluate(() => {
    const sc = window.game.scene.getScene('MapSelectScene');
    const locked = (sc.children.list||[]).filter(o => o.text && String(o.text).includes('🔒')).length;
    return { lockedLabels: locked };
  });
  await clickText('Cursed Forest');
  // ── pick Seraphine (greatsword) for evolution test ──
  await clickText('Seraphine');
  await page.waitForTimeout(1200);

  // ── zoom assertion ──
  R.zoom = await page.evaluate(() => window.game.scene.getScene('Game').cameras.main.zoom);

  // ── evolution popup as greatsword wielder ──
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    p.getComponent('CInventory').add('blood_gem', 1);
    gs.world.emit('inventory-updated', {});
  });
  await page.waitForTimeout(700);
  R.evoPaused = await page.evaluate(() => window.game.scene.getScene('Game').world.paused);
  await page.keyboard.press('y');
  await page.waitForTimeout(500);
  R.evoResult = await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    return { paused: gs.world.paused, hasBloodsword: p.getComponent('CInventory').has('bloodsword') };
  });

  // ── lethality: teleport enemies onto player repeatedly until death ──
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => {
      const gs = window.game.scene.getScene('Game');
      if (gs.world.paused) return;
      const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
      const pt = p.getComponent('CTransform');
      const foe = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type !== 'player' && e.getComponent('CAI').state !== 'chest');
      if (!foe) {
        const e2 = gs.world.createEntity();
        e2.addComponent('CTransform', new (Object.getPrototypeOf(pt)).constructor({ x: pt.x + 5, y: pt.y }));
        e2.addComponent('CHealth', new (gs.world.entities[0].constructor)(0) ? null : null);
      }
      if (foe) { const ft = foe.getComponent('CTransform'); ft.x = pt.x + 4; ft.y = pt.y; }
    }).catch(()=>{});
    await page.waitForTimeout(250);
    const dead = await page.evaluate(() => {
      const gs = window.game.scene.getScene('Game');
      if (!gs.world.paused) return false;
      const ui = window.game.scene.getScene('UIOverlay');
      const found = (objs) => objs.some(o =>
        (o.text && String(o.text).includes('YOU DIED')) ||
        (o.list && found(o.list)));
      return found(ui.children.list||[]);
    });
    if (dead) { R.deathPanel = true; break; }
  }
  if (!R.deathPanel) R.deathPanel = false;

  // ── coins persisted from kills during that fight ──
  R.coins = await page.evaluate(() => {
    const sm = window.game.registry.get('saveManager');
    return sm ? sm.current.meta.coins : -1;
  });

  console.log('PROBE17::' + JSON.stringify(R));
  await browser.close();
})();
