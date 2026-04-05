import z, { ZodTypeAny } from 'zod';

export function coerceArray(type: ZodTypeAny) {
  return z.union([
    z.array(type),
    z
      .string()
      .transform((v) => v.split(','))
      .pipe(z.array(type)),
  ]);
}
