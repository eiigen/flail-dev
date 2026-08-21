const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0,200)));
  await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.mouse.click(640, 331); // Start Run
  await page.waitForTimeout(3000);

  const probe = await page.evaluate(() => {
    const g = window.game;
    const gs = g.scene.getScene('Game');
    const w = gs.world;
    // count steps by patching
    const player = [...w.query('CTransform','CAI')].find(e => e.getComponent('CAI').type === 'player');
    const t = player.getComponent('CTransform');
    // system presence
    const sys = w.systems.map(s => s.name);
    // input system internal dx
    const input = w.systems.find(s => s.name === 'InputSystem');
    const move = w.systems.find(s => s.name === 'MovementSystem');
    return {
      sys,
      playerPos: [t.x, t.y],
      inputDx: input?.dx, inputDy: input?.dy,
      moveDx: move?.inputDx, moveDy: move?.inputDy,
      ents: w.entities.length,
      paused: w.paused,
      activeScenes: g.scene.getScenes(true).map(s => s.scene.key),
    };
  }).catch(e => ({ err: String(e) }));

  // now press key and measure
  await page.keyboard.down('d');
  await page.waitForTimeout(1000);
  await page.keyboard.up('d');
  const after = await page.evaluate(() => {
    const g = window.game;
    const gs = g.scene.getScene('Game');
    const w = gs.world;
    const player = [...w.query('CTransform','CAI')].find(e => e.getComponent('CAI').type === 'player');
    const t = player.getComponent('CTransform');
    const input = w.systems.find(s => s.name === 'InputSystem');
    const move = w.systems.find(s => s.name === 'MovementSystem');
    return {
      playerPos: [Math.round(t.x), Math.round(t.y)],
      inputDx: input?.dx, moveDx: move?.inputDx,
      ents: w.entities.length,
    };
  }).catch(e => ({ err: String(e) }));
  console.log('PROBE::' + JSON.stringify({ probe, after, errors }, null, 2));
  await browser.close();
})();
