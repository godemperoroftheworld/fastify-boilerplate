import { z } from 'zod';

export const OutfitScalarFieldEnumSchema = z.enum([
  'id',
  'userId',
  'name',
  'type',
  'clothesIDs',
  'createdAt',
  'updatedAt',
]);

export default OutfitScalarFieldEnumSchema;
