export class CWeapon {
  weaponId = '';
  level = 1;
  cooldown = 0;
  lastFired = 0;
  targetEntity = -1;

  constructor(data?: Partial<CWeapon>) {
    if (data) Object.assign(this, data);
  }
}
