const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,100)));
  await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const clickText = async (needle) => {
    const pos = await page.evaluate((n) => {
      const g = window.game;
      const active = g.scene.getScenes(true)[0];
      const t = (active.children.list||[]).find(o => o.text && String(o.text).includes(n));
      if (!t) return null;
      return { gx: t.x, gy: t.y, gw: g.config.width, gh: g.config.height,
               rect: (()=>{const r=document.querySelector('canvas').getBoundingClientRect();
                 return {left:r.left,top:r.top,w:r.width,h:r.height};})() };
    }, needle);
    if (!pos) return false;
    await page.mouse.click(pos.rect.left + pos.gx*(pos.rect.w/pos.gw),
                           pos.rect.top + pos.gy*(pos.rect.h/pos.gh));
    await page.waitForTimeout(800);
    return true;
  };
  const active = () => page.evaluate(() => window.game.scene.getScenes(true).map(s=>s.scene.key));
  const allOnScreen = (sceneKey) => page.evaluate(([sk]) => {
    const g = window.game;
    const sc = g.scene.getScene(sk);
    if (!sc || !sc.children) return { onScreen: -1, total: -1 };
    const gw = g.config.width, gh = g.config.height;
    let out = 0, total = 0;
    for (const o of (sc.children.list||[])) {
      if (!o.visible) continue;
      total++;
      if (o.x >= -50 && o.x <= gw+50 && o.y >= -50 && o.y <= gh+50) out++;
    }
    return { onScreen: out, total };
  }, sceneKey);

  const result = {};
  result.clickedAch = await clickText('Achievements');
  result.achScene = await active();
  result.achOnScreen = await allOnScreen('AchievementsScene');
  result.clickedBack = await clickText('BACK');
  result.clickedSettings = await clickText('Settings');
  result.setScene = await active();
  result.setOnScreen = await allOnScreen('SettingsMenu');
  // BACK y-position must be inside the canvas
  result.backPos = await page.evaluate(() => {
    const sc = window.game.scene.getScene('SettingsMenu');
    const b = (sc.children.list||[]).find(o => o.text && String(o.text).includes('BACK'));
    return b ? { y: Math.round(b.y), gh: window.game.config.height } : null;
  });
  console.log('PROBE14::' + JSON.stringify(result));
  await browser.close();
})();
