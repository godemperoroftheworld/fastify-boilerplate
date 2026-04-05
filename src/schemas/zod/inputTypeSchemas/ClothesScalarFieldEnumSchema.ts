import { z } from 'zod';

export const ClothesScalarFieldEnumSchema = z.enum([
  'id',
  'userId',
  'name',
  'type',
  'colour',
  'image',
  'outfitIDs',
  'createdAt',
  'updatedAt',
]);

export default ClothesScalarFieldEnumSchema;
