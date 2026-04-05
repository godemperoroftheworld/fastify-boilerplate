import z from 'zod';

import { coerceArray } from '@/helpers/zod.helper';
import { SortOrderSchema } from '@/schemas/zod';

export const idParams = z.object({
  id: z.string().nonempty(),
});
export type IdParams = z.infer<typeof idParams>;

export const searchQuery = z.object({
  query: z.string().nonempty(),
});
export type SearchQuery = z.infer<typeof searchQuery>;

export const prismaBody = z
  .object({
    select: coerceArray(z.string().nonempty()),
    filter: z.string().nonempty(),
    include: coerceArray(z.string().nonempty()),
    omit: coerceArray(z.string().nonempty()),
    take: z.coerce.number(),
    skip: z.coerce.number(),
    orderBy: coerceArray(z.tuple([z.string(), SortOrderSchema])),
  })
  .partial();
