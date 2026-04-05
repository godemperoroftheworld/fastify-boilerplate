import { z } from 'zod';

import { OutfitTypeSchema } from '../inputTypeSchemas/OutfitTypeSchema';
import { ClothesWithRelationsSchema, ClothesPartialWithRelationsSchema } from './ClothesSchema';
import type { ClothesWithRelations, ClothesPartialWithRelations } from './ClothesSchema';

/////////////////////////////////////////
// OUTFIT SCHEMA
/////////////////////////////////////////

export const OutfitSchema = z.object({
  type: OutfitTypeSchema,
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  clothesIDs: z.string().array(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Outfit = z.infer<typeof OutfitSchema>;

/////////////////////////////////////////
// OUTFIT PARTIAL SCHEMA
/////////////////////////////////////////

export const OutfitPartialSchema = OutfitSchema.partial();

export type OutfitPartial = z.infer<typeof OutfitPartialSchema>;

/////////////////////////////////////////
// OUTFIT RELATION SCHEMA
/////////////////////////////////////////

export type OutfitRelations = {
  clothes: ClothesWithRelations[];
};

export type OutfitWithRelations = z.infer<typeof OutfitSchema> & OutfitRelations;

export const OutfitWithRelationsSchema: z.ZodType<OutfitWithRelations> = OutfitSchema.merge(
  z.object({
    clothes: z.lazy(() => ClothesWithRelationsSchema).array(),
  }),
);

/////////////////////////////////////////
// OUTFIT PARTIAL RELATION SCHEMA
/////////////////////////////////////////

export type OutfitPartialRelations = {
  clothes?: ClothesPartialWithRelations[];
};

export type OutfitPartialWithRelations = z.infer<typeof OutfitPartialSchema> &
  OutfitPartialRelations;

export const OutfitPartialWithRelationsSchema: z.ZodType<OutfitPartialWithRelations> =
  OutfitPartialSchema.merge(
    z.object({
      clothes: z.lazy(() => ClothesPartialWithRelationsSchema).array(),
    }),
  ).partial();

export type OutfitWithPartialRelations = z.infer<typeof OutfitSchema> & OutfitPartialRelations;

export const OutfitWithPartialRelationsSchema: z.ZodType<OutfitWithPartialRelations> =
  OutfitSchema.merge(
    z
      .object({
        clothes: z.lazy(() => ClothesPartialWithRelationsSchema).array(),
      })
      .partial(),
  );

export default OutfitSchema;
