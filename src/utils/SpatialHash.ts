export class SpatialHash {
  private cells = new Map<string, number[]>();
  constructor(public cellSize: number) {}

  clear(): void {
    this.cells.clear();
  }

  insert(entityId: number, x: number, y: number): void {
    const key = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    if (!this.cells.has(key)) this.cells.set(key, []);
    this.cells.get(key)!.push(entityId);
  }

  query(x: number, y: number, radius: number): number[] {
    const result: number[] = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get(`${cx},${cy}`);
        if (cell) {
          for (const id of cell) result.push(id);
        }
      }
    }
    return result;
  }
}
