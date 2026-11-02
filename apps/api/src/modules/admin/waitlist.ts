import { db } from "@relay/db";
import { waitlist } from "@relay/db/schema/waitlist";
import { and, asc, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, router } from "../../index";
import { type InviteRules, inviteRules, nextBatchAt } from "./rules";

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const PAGE_SIZE = 11;
const FREE_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "uol.com.br",
  "yahoo.com",
  "yahoo.com.br",
]);

type Row = typeof waitlist.$inferSelect;
export type Entry = Awaited<ReturnType<typeof loadEntries>>["entries"][number];

export const emailInput = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Email inválido.").max(254, "Email inválido."));
export const idsInput = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
});

function statusOf(
  row: Row,
  rules: InviteRules,
  now: Date,
): "redeemed" | "skipped" | "queued" | "expired" | "invited" {
  if (row.redeemedAt) return "redeemed";
  if (row.skippedAt) return "skipped";
  if (!row.invitedAt) return "queued";
  const age = now.getTime() - row.invitedAt.getTime();
  return age > rules.validityDays * DAY ? "expired" : "invited";
}

function originOf(row: Row) {
  if (row.source === "manual") return "à mão";
  if (row.source === "avulso") return "avulso";
  const utm = row.utmSource?.toLowerCase() ?? "";
  const host =
    row.referrer && URL.canParse(row.referrer)
      ? new URL(row.referrer).hostname.replace(/^www\./, "")
      : "";
  if (["x", "twitter"].includes(utm) || ["x.com", "twitter.com", "t.co"].includes(host)) {
    return "X / post";
  }
  if (utm.includes("producthunt") || host.endsWith("producthunt.com")) {
    return "Product Hunt";
  }
  if (["indicacao", "indicação", "referral"].includes(utm) || row.utmMedium === "referral") {
    return "indicação";
  }
  return "landing";
}

// ponytail: loads the whole table per request, fine for a pre-launch list; move rank and filters to SQL past ~50k rows.
export async function loadEntries(now = new Date()) {
  const [rows, rules] = await Promise.all([
    db.select().from(waitlist).orderBy(asc(waitlist.subscribedAt), asc(waitlist.id)),
    inviteRules(),
  ]);
  const entries = rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    status: statusOf(row, rules, now),
    origin: originOf(row),
    domain: row.email.split("@")[1] ?? "",
    invitedDays: row.invitedAt
      ? Math.floor((now.getTime() - row.invitedAt.getTime()) / DAY)
      : null,
  }));
  return { entries, rules };
}

export function countsOf(entries: Entry[]) {
  const total = (test: (entry: Entry) => unknown) =>
    entries.filter(test).length;
  return {
    all: entries.length,
    queued: total((e) => e.status === "queued"),
    invited: total((e) => e.invitedAt),
    opened: total((e) => e.inviteOpenedAt),
    redeemed: total((e) => e.redeemedAt),
    skipped: total((e) => e.status === "skipped"),
    expired: total((e) => e.status === "expired"),
    open: total((e) => e.status === "invited"),
    notOpened: total((e) => e.status === "invited" && !e.inviteOpenedAt),
  };
}

/** Priority first, then arrival. Expired invites go back in as priority, per the rules. */
export function nextBatch(entries: Entry[], rules: InviteRules) {
  const first = (e: Entry) => e.priority || e.status === "expired";
  const picked = entries
    .filter((e) => e.status === "queued" || e.status === "expired")
    .sort((a, b) => Number(first(b)) - Number(first(a)) || a.rank - b.rank)
    .slice(0, rules.size);
  const ranks = picked.map((e) => e.rank);
  return {
    ids: picked.map((e) => e.id),
    count: picked.length,
    priorities: picked.filter(first).length,
    from: ranks.length ? Math.min(...ranks) : null,
    to: ranks.length ? Math.max(...ranks) : null,
    at: nextBatchAt(rules),
  };
}

/** São Paulo is always GMT-3, see rules.ts. */
export function dayKey(date: Date) {
  return new Date(date.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
}

export function perDay(dates: Date[], days: number, now = new Date()) {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = dayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, index) => {
    const at = new Date(now.getTime() - (days - 1 - index) * DAY);
    return { at, count: counts.get(dayKey(at)) ?? 0 };
  });
}

function toRow(e: Entry) {
  return {
    id: e.id,
    rank: e.rank,
    email: e.email,
    domain: e.domain,
    note: e.note,
    priority: e.priority,
    origin: e.origin,
    subscribedAt: e.subscribedAt,
    status: e.status,
    invitedDays: e.invitedDays,
  };
}

const tabs = {
  all: () => true,
  queued: (e: Entry) => e.status === "queued",
  invited: (e: Entry) => e.invitedAt !== null,
  redeemed: (e: Entry) => e.redeemedAt !== null,
  skipped: (e: Entry) => e.status === "skipped",
};

const orders = {
  rank: (a: Entry, b: Entry) => a.rank - b.rank,
  recent: (a: Entry, b: Entry) => b.rank - a.rank,
  priority: (a: Entry, b: Entry) =>
    Number(b.priority) - Number(a.priority) || a.rank - b.rank,
};

export const waitlistRouter = router({
  summary: adminProcedure.query(async () => {
    const now = new Date();
    const { entries, rules } = await loadEntries(now);
    const queue = entries.filter((e) => e.status === "queued");
    const waiting = entries.filter((e) => e.status !== "skipped");
    const waited = waiting.reduce(
      (sum, e) =>
        sum + (e.invitedAt ?? now).getTime() - e.subscribedAt.getTime(),
      0,
    );
    const origins = new Map<string, number>();
    for (const { origin } of entries) {
      origins.set(origin, (origins.get(origin) ?? 0) + 1);
    }
    return {
      counts: countsOf(entries),
      rules,
      next: nextBatch(entries, rules),
      newThisWeek: entries.filter(
        (e) => now.getTime() - e.subscribedAt.getTime() < WEEK,
      ).length,
      lastDays: perDay(entries.map((e) => e.subscribedAt), 14, now),
      avgWaitDays: waiting.length
        ? Math.round(waited / waiting.length / DAY)
        : null,
      sources: [...origins]
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => b.total - a.total),
      ownDomain: queue.filter((e) => !FREE_MAIL.has(e.domain)).length,
      pageSize: PAGE_SIZE,
    };
  }),
  list: adminProcedure
    .input(
      z.object({
        tab: z.enum(["all", "queued", "invited", "redeemed", "skipped"]),
        order: z.enum(["rank", "recent", "priority"]),
        q: z.string().trim().max(254),
        page: z.number().int().min(1),
      }),
    )
    .query(async ({ input }) => {
      const { entries } = await loadEntries();
      const q = input.q.toLowerCase();
      const matches = entries
        .filter(tabs[input.tab])
        .filter(
          (e) =>
            e.email.includes(q) || e.note?.toLowerCase().includes(q),
        )
        .sort(orders[input.order]);
      const start = (input.page - 1) * PAGE_SIZE;
      return {
        rows: matches.slice(start, start + PAGE_SIZE).map(toRow),
        total: matches.length,
        start,
      };
    }),
  export: adminProcedure.query(async () => {
    const { entries } = await loadEntries();
    return entries.map(toRow);
  }),
  add: adminProcedure
    .input(z.object({ email: emailInput }))
    .mutation(async ({ input }) => {
      const added = await db
        .insert(waitlist)
        .values({ email: input.email, source: "manual" })
        .onConflictDoNothing({ target: waitlist.email })
        .returning({ id: waitlist.id });
      return { added: added.length > 0 };
    }),
  togglePriority: adminProcedure
    .input(idsInput)
    .mutation(async ({ input }) => {
      const scope = inArray(waitlist.id, input.ids);
      const rows = await db
        .select({ priority: waitlist.priority })
        .from(waitlist)
        .where(scope);
      await db
        .update(waitlist)
        .set({ priority: !rows.every((row) => row.priority) })
        .where(scope);
    }),
  // Only people still in line: an invite already sent can't be skipped.
  toggleSkip: adminProcedure.input(idsInput).mutation(async ({ input }) => {
    const scope = and(
      inArray(waitlist.id, input.ids),
      isNull(waitlist.invitedAt),
      isNull(waitlist.redeemedAt),
    );
    const rows = await db
      .select({ skippedAt: waitlist.skippedAt })
      .from(waitlist)
      .where(scope);
    await db
      .update(waitlist)
      .set({ skippedAt: rows.every((row) => row.skippedAt) ? null : new Date() })
      .where(scope);
  }),
  setNote: adminProcedure
    .input(idsInput.extend({ note: z.string().trim().max(500) }))
    .mutation(async ({ input }) => {
      await db
        .update(waitlist)
        .set({ note: input.note || null })
        .where(inArray(waitlist.id, input.ids));
    }),
});
