import { z } from 'zod';

export const ClothingTypeSchema = z.enum(['top', 'bottom', 'head', 'shoe', 'accessory']);

export type ClothingTypeType = `${z.infer<typeof ClothingTypeSchema>}`;

export default ClothingTypeSchema;
