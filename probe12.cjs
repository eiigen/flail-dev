const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,120)));
  await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const clickText = async (sceneKey, needle) => {
    const pos = await page.evaluate(([sk, n]) => {
      const g = window.game;
      const sc = g.scene.getScene(sk);
      if (!sc) return null;
      const t = (sc.children.list||[]).find(o => o.text && String(o.text).includes(n));
      if (!t) return null;
      return { gx: t.x, gy: t.y, gw: g.config.width, gh: g.config.height,
               rect: (()=>{const r=document.querySelector('canvas').getBoundingClientRect();
                 return {left:r.left,top:r.top,w:r.width,h:r.height};})() };
    }, [sceneKey, needle]);
    if (!pos) return false;
    await page.mouse.click(pos.rect.left + pos.gx*(pos.rect.w/pos.gw),
                           pos.rect.top + pos.gy*(pos.rect.h/pos.gh));
    await page.waitForTimeout(900);
    return true;
  };
  const active = () => page.evaluate(() => window.game.scene.getScenes(true).map(s => s.scene.key));

  const flow = {};
  flow.menu = await active();
  flow.hasNewRun = await page.evaluate(() => {
    const mm = window.game.scene.getScene('MainMenu');
    return (mm.children.list||[]).some(o => o.text && String(o.text).includes('New Run'));
  });
  await clickText('MainMenu', 'New Run');
  flow.afterNewRun = await active();
  await clickText('MapSelectScene', 'Cursed Forest');
  flow.afterMapPick = await active();
  // pick first UNLOCKED char: click the default 'Seraphine Vane'
  await clickText('CharSelectScene', 'Seraphine');
  flow.afterCharPick = await active();
  flow.registry = await page.evaluate(() => ({
    mapId: window.game.registry.get('mapId'),
    charId: window.game.registry.get('charId'),
    weapon: window.game.registry.get('startingWeaponId'),
  }));
  // achievements screen reachable from menu
  console.log('PROBE12::' + JSON.stringify(flow));
  await browser.close();
})();
