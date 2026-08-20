export class CExp {
  current = 0;
  level = 1;
  nextThreshold = 100;

  constructor(data?: Partial<CExp>) {
    if (data) Object.assign(this, data);
  }
}
