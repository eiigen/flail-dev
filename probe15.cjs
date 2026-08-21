const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(process.env.GAME_URL || "http://127.0.0.1:4173/flail-dev/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const ct = async (sk, n) => {
    const pos = await p.evaluate(([sceneKey, n2]) => {
      const g = window.game; const sc = g.scene.getScene(sceneKey);
      const t = (sc?.children.list||[]).find(o => o.text && String(o.text).includes(n2));
      if (!t) return null;
      return { gx:t.x, gy:t.y, gw:g.config.width, gh:g.config.height,
        rect:(()=>{const r=document.querySelector("canvas").getBoundingClientRect();
          return {left:r.left,top:r.top,w:r.width,h:r.height};})() };
    }, [sk, n]);
    if (!pos) return false;
    await p.mouse.click(pos.rect.left+pos.gx*(pos.rect.w/pos.gw), pos.rect.top+pos.gy*(pos.rect.h/pos.gh));
    await p.waitForTimeout(900);
    return true;
  };
  await ct("MainMenu","New Run"); await ct("MapSelectScene","Cursed Forest"); await ct("CharSelectScene","Seraphine");
  for (let t of [3,6,9]) {
    await p.waitForTimeout(3000);
    const s = await p.evaluate(() => {
      const gs = window.game.scene.getScene("Game");
      const sp = gs.world.systems.find(x=>x.name==="EnemySpawner");
      let defCount=-1; try { defCount = sp.loadDefs().length; } catch(e) { defCount="ERR:"+e.message.slice(0,40); }
      return { ents: gs.world.entities.length, paused: gs.world.paused,
               defs: defCount, timer: Math.round(sp.spawnTimer), interval: sp.spawnInterval };
    });
    console.log("T"+t+"::"+JSON.stringify(s));
  }
  await b.close();
})();
