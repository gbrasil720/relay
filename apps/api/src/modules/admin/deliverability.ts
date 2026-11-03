import { db } from "@relay/db";
import { emailMessage } from "@relay/db/schema/email";
import { ses } from "@relay/email";
import { env } from "@relay/env/server";
import { gte } from "drizzle-orm";
import { adminProcedure, router } from "../../index";

const DOMAIN = "userelay.site";
const DAY = 24 * 60 * 60 * 1000;
const RR_TYPE = { TXT: 16, MX: 15, CNAME: 5 } as const;

// SES Easy DKIM publishes three selectors; they're created together, so one stands in.
// SPF and MX sit on the custom MAIL FROM subdomain; the apex has neither, by design.
const RECORDS = [
  {
    key: "dkim",
    label: "DKIM",
    name: `s65rpadwgod42v4wi635bvwed6bbciep._domainkey.${DOMAIN}`,
    type: "CNAME",
    valid: /\.dkim\.amazonses\.com\.?$/,
  },
  {
    key: "spf",
    label: "SPF",
    name: `bounce.${DOMAIN}`,
    type: "TXT",
    valid: /^v=spf1\s.*include:amazonses\.com/i,
  },
  {
    key: "dmarc",
    label: "DMARC",
    name: `_dmarc.${DOMAIN}`,
    type: "TXT",
    valid: /^v=DMARC1\b/i,
  },
  {
    key: "mx",
    label: "MX",
    name: `bounce.${DOMAIN}`,
    type: "MX",
    valid: /feedback-smtp\.[a-z0-9-]+\.amazonses\.com/,
  },
] as const;

/** Record values, or null when the resolver couldn't answer. */
async function lookup(name: string, type: keyof typeof RR_TYPE) {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`,
      {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return null;
    const dns = (await res.json()) as {
      Status: number;
      Answer?: { type: number; data: string }[];
    };
    // 0 = NOERROR, 3 = NXDOMAIN: both are real answers, anything else isn't.
    if (dns.Status !== 0 && dns.Status !== 3) return null;
    return (dns.Answer ?? [])
      .filter((a) => a.type === RR_TYPE[type])
      .map((a) => a.data.replace(/"\s*"/g, "").replace(/"/g, ""));
  } catch {
    return null;
  }
}

function checkRecords() {
  return Promise.all(
    RECORDS.map(async ({ valid, ...record }) => {
      const values = await lookup(record.name, record.type);
      return {
        ...record,
        ok: values && values.some((value) => valid.test(value)),
      };
    }),
  );
}

// An email that was opened, clicked or complained about was delivered first.
const DELIVERED = new Set(["delivered", "opened", "clicked", "complained"]);

function provider(to: string | undefined) {
  const domain = to?.split("@")[1]?.toLowerCase() ?? "";
  if (/^(gmail|googlemail)\./.test(domain)) return "gmail";
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) return "outlook";
  if (/^(icloud|me|mac)\.com$/.test(domain)) return "icloud";
  return "outros";
}

type Provider = ReturnType<typeof provider>;

async function emailStats() {
  const now = Date.now();
  const stats = {
    sent: 0,
    delivered: 0,
    bounced: 0,
    complained: 0,
    // SES has no queue we can see: a send call either hands the email over or fails.
    waiting: 0,
    delayed: 0,
    days: Array.from({ length: 7 }, () => ({ delivered: 0, bounced: 0 })),
    providers: {
      gmail: { sent: 0, delivered: 0, bounced: 0 },
      outlook: { sent: 0, delivered: 0, bounced: 0 },
      icloud: { sent: 0, delivered: 0, bounced: 0 },
      outros: { sent: 0, delivered: 0, bounced: 0 },
    } satisfies Record<Provider, unknown>,
  };

  const emails = await db
    .select({
      to: emailMessage.to,
      status: emailMessage.status,
      createdAt: emailMessage.createdAt,
    })
    .from(emailMessage)
    .where(gte(emailMessage.createdAt, new Date(now - 7 * DAY)));

  for (const email of emails) {
    const age = now - email.createdAt.getTime();
    const day = stats.days[6 - Math.floor(age / DAY)];
    const by = stats.providers[provider(email.to)];
    stats.sent++;
    by.sent++;
    if (email.status === "delivery_delayed") stats.delayed++;
    if (email.status === "complained") stats.complained++;
    if (DELIVERED.has(email.status)) {
      stats.delivered++;
      by.delivered++;
      if (day) day.delivered++;
    }
    if (email.status === "bounced") {
      stats.bounced++;
      by.bounced++;
      if (day) day.bounced++;
    }
  }
  return stats;
}

// SES enforcement status, mapped onto the screen's band/guardrail labels.
const ENFORCEMENT = {
  HEALTHY: { band: "good", guardrail: "ok" },
  PROBATION: { band: "at_risk", guardrail: "warning" },
  SHUTDOWN: { band: "at_risk", guardrail: "paused" },
} as const;

async function reputation() {
  if (!env.AWS_ACCESS_KEY_ID) return null;
  try {
    const account = await ses<{
      EnforcementStatus: keyof typeof ENFORCEMENT;
      SendingEnabled: boolean;
    }>("account");
    if (!account.SendingEnabled) return ENFORCEMENT.SHUTDOWN;
    return ENFORCEMENT[account.EnforcementStatus] ?? null;
  } catch (error) {
    console.error("SES account lookup failed", error);
    return null;
  }
}

export const deliverabilityRouter = router({
  check: adminProcedure.query(async () => {
    const [checks, stats, score] = await Promise.all([
      checkRecords(),
      emailStats(),
      reputation(),
    ]);
    return {
      domain: DOMAIN,
      checkedAt: new Date(),
      checks,
      stats,
      reputation: score,
    };
  }),
});
