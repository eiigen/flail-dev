const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,120)));
  await page.goto('http://127.0.0.1:4173/flail-dev/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // dynamic Start locate (portrait)
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

  const cdp = await ctx.newCDPSession(page);
  const jx = 100, jy = 800;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jx, y: jy }] });
  await page.waitForTimeout(120);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jx+40, y: jy }] });
  await page.waitForTimeout(300);

  const mid = await page.evaluate(() => {
    const g = window.game;
    const ui = g.scene.getScene('UIOverlay');
    const gs = g.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    const ap = g.input.activePointer;
    return {
      joyActive: ui.joyActive,
      joyX: ui.joyX, joyY: ui.joyY,
      activePointer: { x: ap.x, y: ap.y, isDown: ap.isDown },
      px: Math.round(p.getComponent('CTransform').x),
      py: Math.round(p.getComponent('CTransform').y),
      scaleW: gs.scale.width, scaleH: gs.scale.height,
      displayH: document.querySelector('canvas').getBoundingClientRect().height,
      displayTop: document.querySelector('canvas').getBoundingClientRect().top,
    };
  });

  for (let i = 0; i < 6; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jx + 40 + i*10, y: jy }] });
    await page.waitForTimeout(120);
  }
  const after = await page.evaluate(() => {
    const gs = window.game.scene.getScene('Game');
    const p = [...gs.world.query('CAI')].find(e => e.getComponent('CAI').type === 'player');
    return { px: Math.round(p.getComponent('CTransform').x), py: Math.round(p.getComponent('CTransform').y) };
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  console.log('PROBE10::' + JSON.stringify({ mid, after }));
  await browser.close();
})();
