const { chromium } = require('playwright');
const fs = require('fs');

const URL = process.env.GAME_URL || 'http://127.0.0.1:4173/flail-dev/';
const results = [];

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  fs.mkdirSync('screens', { recursive: true });

  async function runTest(label, viewport, isTouch) {
    const ctx = await browser.newContext({ viewport, hasTouch: isTouch });
    const page = await ctx.newPage();
    const logs = [];
    const errors = [];
    page.on('console', m => logs.push(`[${m.type()}] ${m.text().slice(0,150)}`));
    page.on('pageerror', e => errors.push(String(e).slice(0,250)));

    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => errors.push('goto: '+e.message));
    await page.waitForTimeout(3000);

    const menu = await page.evaluate(() => {
      const g = window.game;
      if (!g) return { err: 'no game' };
      return { active: g.scene.getScenes(true).map(s => s.scene.key), canv: !!g.canvas };
    }).catch(e => ({ err: String(e) }));

    // Walk the flow: New Run -> first map -> first default character
    const clickIn = async (sceneKey, needle) => {
      const pos = await page.evaluate(([sk, n]) => {
        const g = window.game;
        const sc = g.scene.getScene(sk);
        const t = (sc?.children.list || []).find(o => o.text && String(o.text).includes(n));
        if (!t) return null;
        return { gx: t.x, gy: t.y, gw: g.config.width, gh: g.config.height,
                 rect: (() => { const r = document.querySelector('canvas').getBoundingClientRect();
                   return { left: r.left, top: r.top, w: r.width, h: r.height }; })() };
      }, [sceneKey, needle]);
      if (!pos) return false;
      await page.mouse.click(pos.rect.left + pos.gx * (pos.rect.w / pos.gw),
                             pos.rect.top + pos.gy * (pos.rect.h / pos.gh));
      await page.waitForTimeout(900);
      return true;
    };
    await clickIn('MainMenu', 'New Run');
    await clickIn('MapSelectScene', 'Cursed Forest');
    await clickIn('CharSelectScene', 'Seraphine');
    const rect = await page.evaluate(() => {
      const r = document.querySelector('canvas').getBoundingClientRect();
      return { left: r.left, top: r.top, w: r.width, h: r.height };
    });
    await page.waitForTimeout(1100);

    const readState = () => page.evaluate(() => {
      const g = window.game;
      if (!g) return { err: 'no game' };
      const gs = g.scene.getScene('Game');
      if (!gs || !gs.world) return { err: 'no game scene' };
      const player = [...gs.world.query('CTransform','CAI')].find(e => e.getComponent('CAI').type === 'player');
      if (!player) return { err: 'no player entity' };
      const t = player.getComponent('CTransform');
      const ents = gs.world.entities.length;
      const enemies = [...gs.world.query('CTransform','CAI')].filter(e => e.getComponent('CAI').type !== 'player').length;
      const projs = [...gs.world.query('CTransform','CProjectile')].length;
      return { px: Math.round(t.x), py: Math.round(t.y), ents, enemies, projs, paused: gs.world.paused };
    }).catch(e => ({ err: String(e), px: -1, py: -1 }));

    const state1 = await readState();

    // Move: desktop keys / mobile touch drag on joystick zone
    if (!isTouch) {
      await page.keyboard.down('d');
      await page.waitForTimeout(1500);
      await page.keyboard.up('d');
    } else {
      const jx = 110, jy = viewport.height - 110;
      // CDP touch drag
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jx, y: jy }] });
      for (let i = 1; i <= 8; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jx + i * 8, y: jy }] });
        await page.waitForTimeout(80);
      }
      await page.waitForTimeout(600);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await page.waitForTimeout(800);

    const state2 = await readState();

    // If a level-up modal paused the world, pick the middle choice via keyboard
    const st = await readState();
    if (st.paused === true) {
      await page.keyboard.press('2');
      await page.waitForTimeout(600);
    }

    await page.screenshot({ path: `screens/${label}-menu.png` });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `screens/${label}-game.png` });

    results.push({ label, menu, state1, state2, errors, logs: logs.slice(0,10) });
    await ctx.close();
  }

  await runTest('desktop', { width: 1280, height: 720 }, false);
  await runTest('mobile', { width: 480, height: 900 }, true);

  const out = { results };
  console.log('RESULTS::' + JSON.stringify(out));
  fs.writeFileSync('/home/user/playtest-out.json', JSON.stringify(out, null, 2));
  await browser.close();
})();
