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
    // Comma-separated emails allowed into /admin.
    ADMIN_EMAILS: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    // IAM user limited to ses:SendEmail and ses:GetAccount. Unset, nothing is emailed.
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    AWS_REGION: z.string().min(1).default("us-east-1"),
    // Publishes SES events to SNS, which posts them to /webhooks/ses.
    SES_CONFIGURATION_SET: z.string().min(1).default("relay-default"),
    // Only notifications from this topic are accepted at /webhooks/ses.
    SES_EVENTS_TOPIC_ARN: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).default("Relay <ola@userelay.site>"),
    // Where invite links lead. Unset, invites are refused: signup is not open yet.
    INVITE_SIGNUP_URL: z.url().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
