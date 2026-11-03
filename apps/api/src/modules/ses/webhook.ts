import { db } from "@relay/db";
import {
  EMAIL_STATUSES,
  type EmailStatus,
  emailMessage,
} from "@relay/db/schema/email";
import { env } from "@relay/env/server";
import { inArray, sql } from "drizzle-orm";

type SnsMessage = {
  Type: "Notification" | "SubscriptionConfirmation" | "UnsubscribeConfirmation";
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: "1" | "2";
  Signature: string;
  SigningCertURL: string;
  Subject?: string;
  SubscribeURL?: string;
  Token?: string;
};

type SesEvent = {
  eventType: string;
  mail: {
    messageId: string;
    destination: string[];
    commonHeaders?: { subject?: string };
  };
  bounce?: { bounceType: string };
};

const AWS_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com$/;

// Fields AWS signs, in order: https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
export function stringToSign(m: SnsMessage) {
  const keys =
    m.Type === "Notification"
      ? (["Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"] as const)
      : (["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"] as const);
  return keys
    .filter((key) => m[key] !== undefined)
    .map((key) => `${key}\n${m[key]}\n`)
    .join("");
}

/** Byte range of the DER element at `at`, and where its contents start. */
function der(bytes: Uint8Array, at: number) {
  let length = bytes[at + 1] ?? 0;
  let header = 2;
  if (length & 0x80) {
    const n = length & 0x7f;
    length = 0;
    for (let i = 0; i < n; i++) length = length * 256 + (bytes[at + 2 + i] ?? 0);
    header += n;
  }
  return { body: at + header, end: at + header + length };
}

/** SubjectPublicKeyInfo of an X.509 PEM: WebCrypto imports keys, not certificates. */
export function publicKeyOf(pem: string) {
  const bytes = Uint8Array.from(
    atob(pem.replace(/-----[^-]+-----|\s/g, "")),
    (c) => c.charCodeAt(0),
  );
  const tbs = der(bytes, der(bytes, 0).body);
  let at = tbs.body;
  // Optional [0] version, then serial, signature, issuer, validity, subject.
  if (bytes[at] === 0xa0) at = der(bytes, at).end;
  for (let i = 0; i < 5; i++) at = der(bytes, at).end;
  return bytes.slice(at, der(bytes, at).end);
}

const keys = new Map<string, Promise<CryptoKey>>();

function signingKey(url: string, hash: "SHA-1" | "SHA-256") {
  const id = `${hash} ${url}`;
  let key = keys.get(id);
  if (!key) {
    key = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`SNS cert ${res.status}`);
        return res.text();
      })
      .then((pem) =>
        crypto.subtle.importKey(
          "spki",
          publicKeyOf(pem),
          { name: "RSASSA-PKCS1-v1_5", hash },
          false,
          ["verify"],
        ),
      );
    key.catch(() => keys.delete(id));
    keys.set(id, key);
  }
  return key;
}

function fromAws(url: string | undefined) {
  if (!url) return false;
  const parsed = new URL(url);
  return parsed.protocol === "https:" && AWS_HOST.test(parsed.hostname);
}

export async function verify(m: SnsMessage, getKey = signingKey) {
  if (!fromAws(m.SigningCertURL)) return false;
  const hash = m.SignatureVersion === "2" ? "SHA-256" : "SHA-1";
  const signature = Uint8Array.from(atob(m.Signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    await getKey(m.SigningCertURL, hash),
    signature,
    new TextEncoder().encode(stringToSign(m)),
  );
}

/** Status an SES event moves an email to, or null for events we don't track. */
export function statusOf(event: SesEvent): EmailStatus | null {
  switch (event.eventType) {
    case "Delivery":
      return "delivered";
    case "DeliveryDelay":
      return "delivery_delayed";
    case "Open":
      return "opened";
    case "Click":
      return "clicked";
    case "Complaint":
      return "complained";
    // Transient bounces are retried by SES and don't count against reputation.
    case "Bounce":
      return event.bounce?.bounceType === "Permanent" ? "bounced" : null;
    default:
      return null;
  }
}

async function record(event: SesEvent) {
  const status = statusOf(event);
  if (!status) return;
  const earlier = EMAIL_STATUSES.slice(0, EMAIL_STATUSES.indexOf(status));
  await db
    .insert(emailMessage)
    .values({
      id: event.mail.messageId,
      to: event.mail.destination[0] ?? "",
      subject: event.mail.commonHeaders?.subject ?? "",
      status,
      bounceType: event.bounce?.bounceType,
    })
    .onConflictDoUpdate({
      target: emailMessage.id,
      set: {
        status,
        bounceType: event.bounce?.bounceType,
        updatedAt: sql`now()`,
      },
      // Events can arrive out of order: an Open after a Click must not undo it.
      setWhere: inArray(emailMessage.status, earlier),
    });
}

/** SNS HTTPS endpoint for the SES configuration set's event destination. */
export async function handleSesWebhook(request: Request) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  let message: SnsMessage;
  try {
    message = (await request.json()) as SnsMessage;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Any AWS account can sign for its own topic, so the signature alone isn't enough.
  if (!env.SES_EVENTS_TOPIC_ARN || message.TopicArn !== env.SES_EVENTS_TOPIC_ARN) {
    return new Response("Unknown topic", { status: 403 });
  }
  if (!(await verify(message).catch(() => false))) {
    return new Response("Bad signature", { status: 403 });
  }

  if (message.Type === "SubscriptionConfirmation") {
    if (!fromAws(message.SubscribeURL)) {
      return new Response("Bad subscribe URL", { status: 400 });
    }
    const res = await fetch(message.SubscribeURL as string);
    return new Response(null, { status: res.ok ? 200 : 502 });
  }
  if (message.Type === "Notification") {
    await record(JSON.parse(message.Message));
  }
  return new Response(null, { status: 200 });
}
