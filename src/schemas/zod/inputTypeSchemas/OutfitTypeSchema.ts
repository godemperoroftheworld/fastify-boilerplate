import { z } from 'zod';

export const OutfitTypeSchema = z.enum([
  'monochromatic',
  'complementary',
  'split_complementary',
  'triadic',
]);

export type OutfitTypeType = `${z.infer<typeof OutfitTypeSchema>}`;

export default OutfitTypeSchema;
