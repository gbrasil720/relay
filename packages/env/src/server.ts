import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

// Load monorepo package env relative to this file (not process.cwd()).
// Turbo/`bun run` from the workspace root would otherwise miss apps/*/ .env.
// Workers have no filesystem; their vars and secrets are already in process.env.
if (import.meta.url?.startsWith("file:")) {
  const envFilePath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../apps/server/.env",
  );
  config({ path: envFilePath });
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),

    CORS_ORIGIN: z.url(),
    // Set behind a proxy, e.g. x-forwarded-for. Unset, the socket address is used.
    CLIENT_IP_HEADER: z.string().min(1).optional(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    MILLIONSEND_API_KEY: z.string().min(1).optional(),
    MILLIONSEND_BASE_URL: z.url().default("https://api.millionsend.com"),
    // Placeholder only; replace with a verified sender before sending.
    MILLIONSEND_FROM_EMAIL: z
      .string()
      .min(1)
      .default("Acme <noreply@example.com>"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
