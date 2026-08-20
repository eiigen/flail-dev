import { z } from 'zod';

export const StatsSchema = z.object({
  hp: z.number(),
  atk: z.number(),
  spd: z.number(),
  area: z.number(),
  cd: z.number(),
  luck: z.number(),
  armor: z.number(),
  regen: z.number(),
});
export type Stats = z.infer<typeof StatsSchema>;

export const ItemReqSchema = z.object({
  itemId: z.string(),
  count: z.number().int().positive(),
});
export type ItemReq = z.infer<typeof ItemReqSchema>;
