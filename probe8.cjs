const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const rect = await page.evaluate(() => {
    const r = document.querySelector('canvas').getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });
  await page.mouse.click(rect.left + 640*(rect.w/1280), rect.top + 331*(rect.h/720));
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const w = gs.world;
    const sp = w.systems.find(s => s.name === 'EnemySpawner');
    const rawCache = gs.cache.json.get('enemies');
    const tex = gs.textures.get('main');
    let defCount = -1, sampleKey = '';
    try { const d = sp.loadDefs(); defCount = d.length; sampleKey = d[0]?.spriteKey ?? 'none'; } catch (e) { sampleKey = 'ERR:' + e.message; }
    return {
      ents: w.entities.length,
      paused: w.paused,
      cacheEnemies: rawCache ? rawCache.enemies.length : 'no-cache',
      texHasMain: !!tex,
      defCount, sampleKey,
      spawnInterval: sp.spawnInterval,
      firstRawKey: rawCache?.enemies?.[0]?.spriteKey,
      texHasFirst: rawCache ? tex.has(rawCache.enemies[0].spriteKey) : null,
    };
  });
  console.log('PROBE8::' + JSON.stringify(info));
  await browser.close();
})();
