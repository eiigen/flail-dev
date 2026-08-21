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
  await page.mouse.click(rect.left + 640*(rect.w/1280), rect.top + 331*(rect.h/720));
  await page.waitForTimeout(1500);

  // mutate a setting + save
  const before = await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    gs.settings.set('sfxVolume', 0.25);
    gs.saveManager.current.settings = gs.settings.getAll();
    gs.saveManager.save();
    return localStorage.getItem('flail_save') ? 'saved' : 'no-ls';
  });

  // reload → settings should come back from the save
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const rect2 = await page.evaluate(() => {
    const r = document.querySelector('canvas').getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });
  await page.mouse.click(rect2.left + 640*(rect2.w/1280), rect2.top + 331*(rect2.h/720));
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => {
    const g = window.game;
    if (!g) return { err: 'no game after reload' };
    const gs = g.scene.getScene('Game');
    if (!gs || !gs.settings) return { err: 'no game scene' };
    return { sfxVolume: gs.settings.get('sfxVolume'), hasRun: !!gs.saveManager.current.currentRun };
  });
  console.log('PROBE6::' + JSON.stringify({ before, after, errors }));
  await browser.close();
})();
