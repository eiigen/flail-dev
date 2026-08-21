const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0,150)));
  await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  // canvas-rect click like other probes
  const rect = await page.evaluate(() => {
    const r = document.querySelector('canvas').getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });
  await page.mouse.click(rect.left + 640*(rect.w/1280), rect.top + 331*(rect.h/720));
  await page.waitForTimeout(1500);

  // grant the missing ingredient
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    const inv = p.getComponent('CInventory');
    inv.add('fire_gem', 1);
    gs.world.emit('inventory-updated', {});
  });
  await page.waitForTimeout(700);
  const modalUp = await page.evaluate(() => ({
    paused: window.game.scene.getScene('Game').world.paused,
  }));
  await page.screenshot({ path: 'screens/evolution-modal.png' });
  await page.keyboard.press('y');
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    const inv = p.getComponent('CInventory');
    return {
      paused: gs.world.paused,
      hasFireGem: inv.has('fire_gem'),
      hasFireStaffItem: inv.has('fire_staff'),
      hasInfernoStaff: inv.has('inferno_staff'),
    };
  });
  console.log('PROBE5::' + JSON.stringify({ modalUp, after, errors }));
  await browser.close();
})();
