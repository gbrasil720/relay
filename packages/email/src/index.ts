import { db } from "@relay/db";
import { emailMessage } from "@relay/db/schema/email";
import { env } from "@relay/env/server";
import { AwsClient } from "aws4fetch";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
};

let client: AwsClient | undefined;

/** Signed call to the SESv2 API, e.g. `ses("account")`. */
export async function ses<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required");
  }
  client ??= new AwsClient({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    service: "ses",
    region: env.AWS_REGION,
  });
  const res = await client.fetch(
    `https://email.${env.AWS_REGION}.amazonaws.com/v2/email/${path}`,
    { ...init, headers: { "content-type": "application/json" } },
  );
  const body = (await res.json()) as T & { message?: string; Message?: string };
  if (!res.ok) {
    throw new Error(
      `SES ${path} ${res.status}: ${body.message ?? body.Message}`,
    );
  }
  return body as T;
}

/** Send a transactional email via SES and log it for the deliverability screen. */
export async function sendEmail({ to, subject, html, from, replyTo }: SendEmailInput) {
  const { MessageId } = await ses<{ MessageId: string }>("outbound-emails", {
    method: "POST",
    body: JSON.stringify({
      FromEmailAddress: from ?? env.EMAIL_FROM,
      Destination: { ToAddresses: [to] },
      ReplyToAddresses: replyTo ? [replyTo] : undefined,
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { Html: { Data: html, Charset: "UTF-8" } },
        },
      },
      ConfigurationSetName: env.SES_CONFIGURATION_SET,
    }),
  });

  // The email is out either way; a failed log must not read as a failed send.
  await db
    .insert(emailMessage)
    .values({ id: MessageId, to, subject })
    .onConflictDoNothing()
    .catch((error) => console.error("Email log failed", MessageId, error));

  return { id: MessageId };
}
