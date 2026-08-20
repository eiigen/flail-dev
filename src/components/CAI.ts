export class CAI {
  type: 'melee' | 'ranged' | 'boss' | 'player' = 'melee';
  state = 'idle';
  target = -1;
  path: Array<{ x: number; y: number }> = [];

  constructor(data?: Partial<CAI>) {
    if (data) Object.assign(this, data);
  }
}
