import { z } from 'zod';

export const EnvSchema = z.object({
  MODE: z.enum(['development', 'production', 'test']),
  VITE_ENVIRONMENT_NAME: z.enum(['development', 'production', 'sandbox', 'local']),
  VITE_API_URL: z.string().url().default('https://api-dev.ballerine.io/v2'),
  VITE_API_URL_COMMON: z.string().url().default('https://api-dev.ballerine.io/v2'),
  VITE_API_KEY: z.string(),
  VITE_AUTH_ENABLED: z.preprocess(
    value => (typeof value === 'string' ? JSON.parse(value) : value),
    z.boolean().default(true),
  ),
  VITE_MOCK_SERVER: z.preprocess(
    value => (typeof value === 'string' ? JSON.parse(value) : value),
    z.boolean().default(true),
  ),
  VITE_POLLING_INTERVAL: z.coerce
    .number()
    .transform(v => v * 1000)
    .or(z.literal(false))
    .catch(false),
  VITE_ASSIGNMENT_POLLING_INTERVAL: z.coerce
    .number()
    .transform(v => v * 1000)
    .or(z.literal(false))
    .catch(undefined),
  VITE_IMAGE_LOGO_URL: z.string().optional(),
  VITE_FETCH_SIGNED_URL: z.preprocess(
    value => (typeof value === 'string' ? JSON.parse(value) : value),
    z.boolean().default(true),
  ),
  VITE_POSTHOG_KEY: z.string().optional(),
  VITE_POSTHOG_HOST: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_SENTRY_PROPAGATION_TARGET: z.preprocess(value => {
    if (typeof value !== 'string') {
      return value;
    }

    return new RegExp(value);
  }, z.custom<RegExp>(value => value instanceof RegExp).optional()),
});
