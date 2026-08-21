const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0,150)));
  await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const rect = await page.evaluate(() => {
    const r = document.querySelector('canvas').getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });
  const clickGame = (gx, gy) => page.mouse.click(rect.left + gx*(rect.w/1280), rect.top + gy*(rect.h/720));
  await clickGame(640, 331);
  await page.waitForTimeout(1500);

  // ── LEVEL-UP MODAL TEST ──
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    gs.world.emit('xp-granted', { entityId: p.id, amount: 250 }); // force 2 levels
  });
  await page.waitForTimeout(800);
  const modalUp = await page.evaluate(() => {
    const g = window.game;
    return { paused: g.scene.getScene('Game').world.paused,
             level: (() => { try { const p=[...g.scene.getScene('Game').world.query('CExp')].find(e=>e.getComponent('CAI').type==='player'); return p.getComponent('CExp').level; } catch { return -1; } })() };
  });
  await page.screenshot({ path: 'screens/levelup-modal.png' });
  await page.keyboard.press('2'); // pick middle choice via keyboard
  await page.waitForTimeout(600);
  const afterPick = await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    const w = p.getComponent('CWeapon');
    return { paused: gs.world.paused, dmgMult: w.dmgMult ?? 1, speedMult: w.speedMult ?? 1, cdMult: w.cdMult ?? 1, pierceBonus: w.pierceBonus ?? 0 };
  });

  // ── CHEST REWARD TEST ──
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    p.getComponent('CHealth').current = 30; // wound player so heal is observable
    gs.world.emit('boss-wave', { bossId: 'forest_warden' });
  });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const boss = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'boss');
    if (boss) boss.getComponent('CHealth').current = 0;
  });
  await page.waitForTimeout(800);
  const chestState = await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const c = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').state === 'chest');
    return { chestSpawned: !!c };
  });
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    const c = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').state === 'chest');
    if (p && c) { const pt=p.getComponent('CTransform'), ct=c.getComponent('CTransform'); pt.x=ct.x; pt.y=ct.y; }
  });
  await page.waitForTimeout(700);
  const afterChest = await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    const c = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').state === 'chest');
    const h = p.getComponent('CHealth');
    return { chestGone: !c, hp: Math.round(h.current), hpMax: h.max };
  });
  await page.screenshot({ path: 'screens/chest-after.png' });
  console.log('PROBE4::' + JSON.stringify({ modalUp, afterPick, chestState, afterChest, errors }));
  await browser.close();
})();
