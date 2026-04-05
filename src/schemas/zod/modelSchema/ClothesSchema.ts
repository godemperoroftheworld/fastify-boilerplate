import { z } from 'zod';

import { ClothingTypeSchema } from '../inputTypeSchemas/ClothingTypeSchema';
import { OutfitWithRelationsSchema, OutfitPartialWithRelationsSchema } from './OutfitSchema';
import type { OutfitWithRelations, OutfitPartialWithRelations } from './OutfitSchema';

/////////////////////////////////////////
// CLOTHES SCHEMA
/////////////////////////////////////////

export const ClothesSchema = z.object({
  type: ClothingTypeSchema,
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  colour: z.string(),
  image: z.string(),
  outfitIDs: z.string().array(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Clothes = z.infer<typeof ClothesSchema>;

/////////////////////////////////////////
// CLOTHES PARTIAL SCHEMA
/////////////////////////////////////////

export const ClothesPartialSchema = ClothesSchema.partial();

export type ClothesPartial = z.infer<typeof ClothesPartialSchema>;

/////////////////////////////////////////
// CLOTHES RELATION SCHEMA
/////////////////////////////////////////

export type ClothesRelations = {
  outfits: OutfitWithRelations[];
};

export type ClothesWithRelations = z.infer<typeof ClothesSchema> & ClothesRelations;

export const ClothesWithRelationsSchema: z.ZodType<ClothesWithRelations> = ClothesSchema.merge(
  z.object({
    outfits: z.lazy(() => OutfitWithRelationsSchema).array(),
  }),
);

/////////////////////////////////////////
// CLOTHES PARTIAL RELATION SCHEMA
/////////////////////////////////////////

export type ClothesPartialRelations = {
  outfits?: OutfitPartialWithRelations[];
};

export type ClothesPartialWithRelations = z.infer<typeof ClothesPartialSchema> &
  ClothesPartialRelations;

export const ClothesPartialWithRelationsSchema: z.ZodType<ClothesPartialWithRelations> =
  ClothesPartialSchema.merge(
    z.object({
      outfits: z.lazy(() => OutfitPartialWithRelationsSchema).array(),
    }),
  ).partial();

export type ClothesWithPartialRelations = z.infer<typeof ClothesSchema> & ClothesPartialRelations;

export const ClothesWithPartialRelationsSchema: z.ZodType<ClothesWithPartialRelations> =
  ClothesSchema.merge(
    z
      .object({
        outfits: z.lazy(() => OutfitPartialWithRelationsSchema).array(),
      })
      .partial(),
  );

export default ClothesSchema;
