export class CPolliItem {
  polliRequestId = '';
  generatedAt = 0;
  runSeed = '';

  constructor(data?: Partial<CPolliItem>) {
    if (data) Object.assign(this, data);
  }
}
