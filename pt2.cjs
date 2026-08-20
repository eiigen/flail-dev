const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = [];
  p.on("console", m => logs.push(m.type() + ": " + m.text().slice(0, 140)));
  p.on("pageerror", e => logs.push("PAGEERR: " + e.message.slice(0, 160)));
  await p.goto("http://127.0.0.1:3000/", { waitUntil: "load" });
  await p.waitForTimeout(9000);
  await p.screenshot({ path: "screens/01-menu.png" }).catch(() => {});
  await p.mouse.click(640, 360); // Start Run button
  await p.waitForTimeout(6000);
  await p.screenshot({ path: "screens/02-game.png" }).catch(() => {});

  const sharp = require("sharp");
  async function analyze(f) {
    const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
    const tot = info.width * info.height;
    let nonBlack = 0;
    const counts = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], bl = data[i + 2], a = data[i + 3];
      if (a > 0 && (r + g + bl) > 30) nonBlack++;
      const k = (r >> 4) + "," + (g >> 4) + "," + (bl >> 4);
      counts[k] = (counts[k] || 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([k, v]) => k + ":" + Math.round(v / tot * 100) + "%");
    return { nonBlackPct: (nonBlack / tot * 100).toFixed(1), top, raw: data, tot };
  }
  const m = await analyze("screens/01-menu.png");
  const g = await analyze("screens/02-game.png");
  // menu-vs-game diff: fraction of pixels whose color bucket differs
  let diff = 0;
  for (let i = 0; i < m.raw.length; i += 4) {
    const r1 = m.raw[i], g1 = m.raw[i + 1], b1 = m.raw[i + 2];
    const r2 = g.raw[i], gg2 = g.raw[i + 1], b2 = g.raw[i + 2];
    if (Math.abs(r1 - r2) + Math.abs(g1 - gg2) + Math.abs(b1 - b2) > 24) diff++;
  }
  console.log("MENU: nonBlack=" + m.nonBlackPct + "% top=[" + m.top.join(" ") + "]");
  console.log("GAME: nonBlack=" + g.nonBlackPct + "% top=[" + g.top.join(" ") + "]");
  console.log("MENU_VS_GAME_DIFF: " + (diff / m.tot * 100).toFixed(2) + "% of pixels differ");
  const errs = logs.filter(l => /error|PAGEERR|failed|404/i.test(l));
  console.log("ERRORS::" + (errs.length ? JSON.stringify(errs.slice(0, 8)) : "none"));
  await b.close();
})();
