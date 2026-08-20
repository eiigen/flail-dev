export class Vec2 {
  constructor(public x = 0, public y = 0) {}

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v: Vec2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v: Vec2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vec2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s: number): this {
    this.x *= s;
    this.y *= s;
    return this;
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  normalize(): this {
    const l = this.length();
    if (l > 0) {
      this.x /= l;
      this.y /= l;
    }
    return this;
  }

  distanceTo(v: Vec2): number {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  static from(x: number, y: number): Vec2 {
    return new Vec2(x, y);
  }
}
