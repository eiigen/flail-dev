export class CHealth {
  current: number;
  max: number;
  regen: number;
  armor: number;
  invulnTimer: number;

  constructor(data?: Partial<CHealth>) {
    this.max = data?.max ?? 100;
    this.current = Math.min(data?.current ?? 100, this.max);
    this.regen = data?.regen ?? 0;
    this.armor = data?.armor ?? 0;
    this.invulnTimer = data?.invulnTimer ?? 0;
  }

  applyDamage(raw: number): void {
    if (this.invulnTimer > 0) return;
    const effective = Math.max(0, raw - this.armor);
    this.current = Math.max(0, this.current - effective);
  }

  heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }

  get alive(): boolean {
    return this.current > 0;
  }
}
