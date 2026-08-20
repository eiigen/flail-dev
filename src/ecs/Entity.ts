export class Entity {
  readonly id: number;
  private components = new Map<string, unknown>();

  constructor(id: number) {
    this.id = id;
  }

  addComponent<T = unknown>(name: string, data: T): this {
    this.components.set(name, data);
    return this;
  }

  getComponent<T = unknown>(name: string): T | undefined {
    return this.components.get(name) as T | undefined;
  }

  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  removeComponent(name: string): void {
    this.components.delete(name);
  }
}
