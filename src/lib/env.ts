import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .min(1, 'VITE_SUPABASE_URL is missing. Add it to your .env file.')
    .url('VITE_SUPABASE_URL must be a valid URL.'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'VITE_SUPABASE_ANON_KEY is missing. Add it to your .env file.'),
});

const parsed = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const messages = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Missing or invalid environment variables:\n${messages}\n\nCopy .env.example to .env and fill in the values.`
  );
}

export const env = parsed.data;
