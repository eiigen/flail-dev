export class CProjectile {
  damage = 10;
  speed = 300;
  pierce = 1;
  maxRange = 500;
  traveled = 0;
  dirX = 0;
  dirY = 0;

  constructor(data?: Partial<CProjectile>) {
    if (data) Object.assign(this, data);
  }
}
