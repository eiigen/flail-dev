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
  // Settings button: startY=46% + gap*3; btnH≈52,gap≈62 → y ≈ 331+186 = 517
  await clickGame(640, 517);
  await page.waitForTimeout(800);
  const inSettings = await page.evaluate(() => {
    const g = window.game;
    return g.scene.getScenes(true).map(s => s.scene.key);
  });
  await page.screenshot({ path: 'screens/settings.png' });
  // toggle reduced motion (row idx 4): rows start h*0.24=172.8, gap≈54 → row4 y ≈ 172.8+4*54 ≈ 389
  await clickGame(640, 389);
  await page.waitForTimeout(400);
  const saved = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('flail_save') || '{}');
    return { rm: d.settings?.accessibility?.reducedMotion, scene: window.game.scene.getScenes(true).map(s=>s.scene.key) };
  });
  // back
  await clickGame(640, 648);
  await page.waitForTimeout(600);
  const backHome = await page.evaluate(() => window.game.scene.getScenes(true).map(s => s.scene.key));
  console.log('PROBE7::' + JSON.stringify({ inSettings, saved, backHome, errors }));
  await browser.close();
})();
