export class ObjectPool<T> {
  private pool: T[] = [];

  constructor(
    private createFn: () => T,
    private resetFn: (obj: T) => void,
    initialSize: number
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    return this.pool.pop() ?? this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }

  get available(): number {
    return this.pool.length;
  }
}
