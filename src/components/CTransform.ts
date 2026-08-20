export class CTransform {
  x = 0;
  y = 0;
  rotation = 0;
  scale = 1;

  constructor(data?: Partial<CTransform>) {
    if (data) Object.assign(this, data);
  }
}
