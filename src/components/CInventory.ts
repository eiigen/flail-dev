export class CInventory {
  items = new Map<string, number>();
  maxSlots = 8;

  constructor(data?: Partial<CInventory>) {
    if (data?.items) {
      this.items = new Map(data.items);
    }
    if (data?.maxSlots !== undefined) this.maxSlots = data.maxSlots;
  }

  add(itemId: string, count = 1): void {
    this.items.set(itemId, (this.items.get(itemId) ?? 0) + count);
  }

  remove(itemId: string, count = 1): boolean {
    const current = this.items.get(itemId) ?? 0;
    if (current < count) return false;
    if (current === count) this.items.delete(itemId);
    else this.items.set(itemId, current - count);
    return true;
  }

  has(itemId: string, count = 1): boolean {
    return (this.items.get(itemId) ?? 0) >= count;
  }

  get count(): number {
    return this.items.size;
  }
}
