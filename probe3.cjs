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
  await clickGame(640, 331); // Start Run
  await page.waitForTimeout(2000);

  const sample = () => page.evaluate(() => {
    const g = window.game;
    const gs = g.scene.getScene('Game');
    const w = gs.world;
    const p = [...w.query('CTransform','CExp')].find(e => e.getComponent('CAI')?.type === 'player');
    const exp = p?.getComponent('CExp');
    const ui = g.scene.getScene('UIOverlay');
    const boss = [...w.query('CAI')].find(e => e.getComponent('CAI').type === 'boss');
    const chest = [...w.query('CAI')].find(e => e.getComponent('CAI').state === 'chest');
    return {
      ents: w.entities.length,
      enemies: [...w.query('CAI')].filter(e => e.getComponent('CAI').type !== 'player' && e.getComponent('CAI').state !== 'chest').length,
      projs: [...w.query('CProjectile')].length,
      kills: ui ? ui.kills : -1,
      level: exp ? exp.level : -1,
      xp: exp ? exp.current : -1,
      paused: w.paused,
      boss: !!boss, chest: !!chest,
      cutsceneAlpha: (() => { try { return g.scene.getScene('CutsceneLayer').dialogueBox.alpha; } catch { return -1; } })(),
    };
  }).catch(e => ({ err: String(e).slice(0,120) }));

  const timeline = [];
  // 15s combat sim with movement so enemies get killed near player
  for (let t = 0; t < 3; t++) {
    await page.keyboard.down('d'); await page.waitForTimeout(400); await page.keyboard.up('d');
    await page.keyboard.down('a'); await page.waitForTimeout(400); await page.keyboard.up('a');
    await page.waitForTimeout(4200);
    let s = await sample();
    if (s.paused) { await clickGame(640, 363); await page.waitForTimeout(500); s = await sample(); s.pickedChoice = true; }
    timeline.push({ t: (t+1)*5, ...s });
  }

  // ── BOSS PIPELINE ──
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    gs.world.emit('boss-wave', { bossId: 'forest_warden' });
  });
  await page.waitForTimeout(1200);
  const bossIntro = await sample();
  await page.screenshot({ path: 'screens/boss-intro.png' });

  // kill the boss
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const boss = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'boss');
    if (boss) boss.getComponent('CHealth').current = 0;
  });
  await page.waitForTimeout(800);
  const afterBossDeath = await sample();

  // walk onto chest
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    const c = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').state === 'chest');
    if (p && c) {
      const pt = p.getComponent('CTransform'); const ct = c.getComponent('CTransform');
      pt.x = ct.x; pt.y = ct.y;
    }
  });
  await page.waitForTimeout(700);
  const afterChest = await sample();
  await page.screenshot({ path: 'screens/boss-after.png' });

  console.log('PROBE3::' + JSON.stringify({ timeline, bossIntro, afterBossDeath, afterChest, errors }, null, 1));
  await browser.close();
})();
