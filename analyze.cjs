const sharp = require('sharp');
const fs = require('fs');

async function analyze(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const total = info.width * info.height;
  let nonBlack = 0;
  const colors = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i+1], b = data[i+2];
    if (r + g + b > 30) nonBlack++;
    const q = `${r>>4<<4},${g>>4<<4},${b>>4<<4}`;
    colors.set(q, (colors.get(q) || 0) + 1);
  }
  const top = [...colors.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6)
    .map(([c,n]) => `${c}:${(n/total*100).toFixed(1)}%`);
  return {
    file: file.split('/').pop(),
    dims: `${info.width}x${info.height}`,
    nonBlackPct: +(nonBlack/total*100).toFixed(1),
    topColors: top,
  };
}

(async () => {
  const dir = '/home/user/flail/screens';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  const out = [];
  for (const f of files) out.push(await analyze(`${dir}/${f}`));
  console.log('PIXELS::' + JSON.stringify(out));
})();
