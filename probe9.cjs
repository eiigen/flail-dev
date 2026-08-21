const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0,120)));
  await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const rect = await page.evaluate(() => {
    const r = document.querySelector('canvas').getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });
  await page.mouse.click(rect.left + 640*(rect.w/1280), rect.top + 331*(rect.h/720));
  await page.waitForTimeout(2000);

  // wiggle to keep combat live while sampling
  const samples = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.down(i % 2 ? 'a' : 'd');
    await page.waitForTimeout(1800);
    await page.keyboard.up(i % 2 ? 'a' : 'd');
    const s = await page.evaluate(() => {
      const g = window.game;
      const gs = g.scene.getScene('Game');
      return {
        fps: Math.round(g.loop.actualFps),
        ents: gs.world.entities.length,
        projs: [...gs.world.query('CProjectile')].length,
        displayObjects: gs.children.list.length,
      };
    }).catch(e => ({ err: String(e).slice(0,80) }));
    samples.push(s);
  }
  const fpsVals = samples.filter(s => s.fps).map(s => s.fps);
  const result = {
    samples,
    avgFps: fpsVals.length ? Math.round(fpsVals.reduce((a,b)=>a+b,0)/fpsVals.length) : -1,
    minFps: fpsVals.length ? Math.min(...fpsVals) : -1,
    maxDisplayObjects: Math.max(...samples.map(s => s.displayObjects || 0)),
    errors,
  };
  console.log('PROBE9::' + JSON.stringify(result));
  await browser.close();
})();
