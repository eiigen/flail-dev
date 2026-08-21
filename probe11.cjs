const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,120)));
  await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const loc = await page.evaluate(() => {
    const g = window.game;
    const mm = g.scene.getScene('MainMenu');
    const t = (mm.children.list||[]).find(o => o.text && o.text.includes('Start'));
    return { gx: t?t.x:g.config.width/2, gy: t?t.y:g.config.height*0.46,
             gw: g.config.width, gh: g.config.height,
             rect: (()=>{const r=document.querySelector('canvas').getBoundingClientRect();
               return {left:r.left,top:r.top,w:r.width,h:r.height};})() };
  });
  await page.mouse.click(loc.rect.left + loc.gx*(loc.rect.w/loc.gw),
                         loc.rect.top + loc.gy*(loc.rect.h/loc.gh));
  await page.waitForTimeout(1500);

  // sustained joystick drag UP (negative y) for ~3s
  const cdp = await ctx.newCDPSession(page);
  const jx = 100, jy = 780;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jx, y: jy }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jx, y: jy - 55 }] });
  const samples = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(500);
    samples.push(await page.evaluate(() => {
      const gs = window.game.scene.getScene('Game');
      const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
      const t = p.getComponent('CTransform');
      const cam = gs.cameras.main;
      return { px: Math.round(t.x), py: Math.round(t.y),
               sx: Math.round(cam.scrollX), sy: Math.round(cam.scrollY),
               tiles: gs.children.list.length };
    }));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  // follow check: scroll should equal player - center (within lerp tolerance)
  const last = samples[samples.length-1];
  const expSx = last.px - 360, expSy = last.py - 640;
  const followOK = Math.abs(last.sx-expSx) < 80 && Math.abs(last.sy-expSy) < 80;
  console.log('PROBE11::' + JSON.stringify({ samples, expSx, expSy, followOK }));
  await browser.close();
})();
