import path from 'path';
import z from 'zod';
import dotenv from 'dotenv';

export default function loadConfig(): void {
  const envPath = path.join(__dirname, '..', '..', '.env');

  dotenv.config({ path: envPath });

  const schema = z
    .object({
      NODE_ENV: z.enum(['development', 'testing', 'production']),
      LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']),
      API_HOST: z.string(),
      API_PORT: z.string(),
    })
    .passthrough();

  const { error } = schema.safeParse(process.env);

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
}
