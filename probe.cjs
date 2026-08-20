const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("http://127.0.0.1:3000/", { waitUntil: "load" });
  await p.waitForTimeout(9000);
  const r = await p.evaluate(() => {
    const o = {};
    const g = window.game;
    o.gType = typeof g;
    if (g) {
      o.gKeys = Object.keys(g).slice(0, 12);
      o.gCtor = g.constructor ? g.constructor.name : "?";
      o.hasSceneProp = "scene" in g;
      o.hasScenesProp = "scenes" in g;
      // try multiple access paths
      try { o.activeViaScene = g.scene && g.scene.getScenes ? g.scene.getScenes(true).map(s => s.scene && s.scene.key) : "no getScenes"; } catch (e) { o.eScene = String(e).slice(0, 60); }
      try { o.allViaScenes = g.scenes && g.scenes.getAll ? g.scenes.getAll().map(s => s.scene && s.scene.key) : "no getAll"; } catch (e) { o.eScenes = String(e).slice(0, 60); }
    }
    o.canvas = !!document.querySelector("canvas");
    // sample a few canvas regions via 2d readback is hard on webgl; just report
    return o;
  });
  console.log("PROBE::" + JSON.stringify(r));
  await b.close();
})();
