export class CSprite {
  atlasKey = '';
  frame = '';
  animState = 'idle';
  tint = 0xffffff;
  shader: string | null = null;
  scale = 1;

  constructor(data?: Partial<CSprite>) {
    if (data) Object.assign(this, data);
  }
}
