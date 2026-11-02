import { env } from "@relay/env/server";
import { adminProcedure, router } from "../../index";

const DOMAIN = "userelay.site";
const DAY = 24 * 60 * 60 * 1000;
const RR_TYPE = { TXT: 16, MX: 15 } as const;

// `millionsend` is the live DKIM selector. SPF and MX sit on MillionSend's
// return-path subdomain (default "send"); the apex has neither, by design.
const RECORDS = [
  {
    key: "dkim",
    label: "DKIM",
    name: `millionsend._domainkey.${DOMAIN}`,
    type: "TXT",
    valid: /\bp=[^;\s]/,
  },
  {
    key: "spf",
    label: "SPF",
    name: `send.${DOMAIN}`,
    type: "TXT",
    valid: /^v=spf1\s/i,
  },
  {
    key: "dmarc",
    label: "DMARC",
    name: `_dmarc.${DOMAIN}`,
    type: "TXT",
    valid: /^v=DMARC1\b/i,
  },
  { key: "mx", label: "MX", name: `send.${DOMAIN}`, type: "MX", valid: /\S/ },
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
const DELIVERED = new Set([
  "delivered",
  "opened",
  "clicked",
  "complained",
  "prefetched",
]);
const WAITING = new Set(["queued", "scheduled"]);

function provider(to: string | undefined) {
  const domain = to?.split("@")[1]?.toLowerCase() ?? "";
  if (/^(gmail|googlemail)\./.test(domain)) return "gmail";
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) return "outlook";
  if (/^(icloud|me|mac)\.com$/.test(domain)) return "icloud";
  return "outros";
}

type Provider = ReturnType<typeof provider>;

async function emailStats() {
  // The client throws on import without a key.
  if (!env.MILLIONSEND_API_KEY) return null;
  const { millionsend } = await import("@relay/millionsend");

  const now = Date.now();
  const stats = {
    sent: 0,
    delivered: 0,
    bounced: 0,
    complained: 0,
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

  // ponytail: stops at 2k emails in the window, undercounting past that;
  // upgrade to storing webhook events if volume gets there.
  let after: string | undefined;
  for (let page = 0; page < 20; page++) {
    const { data, error } = await millionsend.emails.list({
      limit: 100,
      after,
    });
    if (error) return null;
    for (const email of data.data) {
      const age = now - new Date(email.created_at).getTime();
      if (age >= 7 * DAY) return stats;
      if (WAITING.has(email.last_event)) {
        stats.waiting++;
        continue;
      }
      if (email.last_event === "canceled") continue;

      const day = stats.days[6 - Math.floor(age / DAY)];
      const by = stats.providers[provider(email.to[0])];
      stats.sent++;
      by.sent++;
      if (email.last_event === "delivery_delayed") stats.delayed++;
      if (email.last_event === "complained") stats.complained++;
      if (DELIVERED.has(email.last_event)) {
        stats.delivered++;
        by.delivered++;
        if (day) day.delivered++;
      }
      if (email.last_event === "bounced") {
        stats.bounced++;
        by.bounced++;
        if (day) day.bounced++;
      }
    }
    if (!data.has_more) break;
    after = data.data.at(-1)?.id;
  }
  return stats;
}

async function reputation() {
  if (!env.MILLIONSEND_API_KEY) return null;
  const { millionsend } = await import("@relay/millionsend");
  const { data, error } = await millionsend.deliverability.get();
  if (error) return null;
  return { band: data.band, guardrail: data.guardrail_status };
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
