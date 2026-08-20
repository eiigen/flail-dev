const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = [];
  p.on("console", m => logs.push(m.type()+": "+m.text().slice(0,140)));
  p.on("pageerror", e => logs.push("PAGEERR: "+e.message.slice(0,160)));
  await p.goto("http://127.0.0.1:3000/", { waitUntil: "load" });
  await p.waitForTimeout(9000);
  const menu = await p.evaluate(() => {
    const g = window.game; const o = {};
    try { o.active = g.scene.getScenes(true).map(s=>s.scene&&s.scene.key); } catch(e){ o.e=String(e); }
    return o;
  });
  console.log("MENU::"+JSON.stringify(menu));
  await p.screenshot({ path: "screens/01-menu.png" }).catch(()=>{});
  await p.mouse.click(640, 360);
  await p.waitForTimeout(6000);
  const game = await p.evaluate(() => {
    const g = window.game; const o = {};
    try { o.active = g.scene.getScenes(true).map(s=>s.scene&&s.scene.key); } catch(e){ o.e=String(e); }
    return o;
  });
  console.log("GAME_SCENE::"+JSON.stringify(game));
  await p.screenshot({ path: "screens/02-game.png" }).catch(()=>{});
  const sharp = require("sharp");
  for (const f of ["screens/01-menu.png","screens/02-game.png"]) {
    try {
      const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
      let nonBlack=0, purple=0, colored=0;
      for (let i=0;i<data.length;i+=4){ const r=data[i],g=data[i+1],bl=data[i+2],a=data[i+3];
        if(a>0&&(r+g+bl)>30) nonBlack++;
        if(r>120&&bl>150&&g<200) purple++;
        if(Math.max(r,g,bl)-Math.min(r,g,bl)>40) colored++; }
      const tot=info.width*info.height;
      console.log(f+": nonBlack="+(nonBlack/tot*100).toFixed(1)+"% purple="+(purple/tot*100).toFixed(2)+"% colored="+(colored/tot*100).toFixed(1)+"%");
    } catch(e){ console.log(f+": ERR "+e.message); }
  }
  fs.writeFileSync("screens/log.txt", logs.join("\n"));
  const errs = logs.filter(l=>/error|PAGEERR|failed/i.test(l));
  console.log("ERRORS::"+(errs.length? JSON.stringify(errs.slice(0,8)):"none"));
  await b.close();
})();
