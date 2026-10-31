import { env } from "@relay/env/server";
import { millionsend } from "./client";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string | string[];
  /** Reuse this key when retrying the same send. */
  idempotencyKey?: string;
};

/** Send a transactional email via MillionSend. */
export async function sendEmail(input: SendEmailInput) {
  const { idempotencyKey, from, ...message } = input;
  const defaultFrom = env.MILLIONSEND_FROM_EMAIL;
  const { data, error } = await millionsend.emails.send(
    {
      ...message,
      from: from ?? defaultFrom ?? "Acme <noreply@example.com>",
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (error) throw new Error(error.message);
  return data;
}
