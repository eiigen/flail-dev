const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("http://127.0.0.1:3000/", { waitUntil: "load" });
  await p.waitForTimeout(8000);
  const r = await p.evaluate(() => {
    const g = window.game;
    return {
      t: typeof g,
      keys: g ? Object.keys(g).slice(0, 15) : null,
      hasScene: g ? ("scene" in g) : null,
      gameCtor: g && g.constructor ? g.constructor.name : null,
      running: g && g.isRunning ? g.isRunning : null,
      canvas: !!document.querySelector("canvas"),
    };
  });
  console.log("PROBE::" + JSON.stringify(r));
  await b.close();
})();
