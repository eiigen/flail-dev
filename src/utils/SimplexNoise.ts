/** Classic 2D simplex noise, seeded. Compact public-domain style implementation. */
export class SimplexNoise {
  private perm = new Uint8Array(512);
  private static GRAD = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];

  constructor(seed = 1) {
    // xorshift-ish PRNG → shuffle permutation table
    let s = seed | 0 || 1;
    const rand = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = p[i]!; p[i] = p[j]!; p[j] = t;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]!;
  }

  noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0;
    const corner = (x: number, y: number, gi: number) => {
      const tt = 0.5 - x * x - y * y;
      if (tt < 0) return 0;
      const g = SimplexNoise.GRAD[gi % 8]!;
      return (tt * tt) ** 4 * (g[0]! * x + g[1]! * y);
    };
    n += corner(x0, y0, this.perm[ii + this.perm[jj]]!);
    n += corner(x1, y1, this.perm[ii + i1 + this.perm[jj + j1]]!);
    n += corner(x2, y2, this.perm[ii + 1 + this.perm[jj + 1]]!);
    return 70 * n;
  }
}
