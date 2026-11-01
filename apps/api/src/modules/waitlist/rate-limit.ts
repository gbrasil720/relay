import { createHmac } from "node:crypto";
import { db } from "@relay/db";
import { rateLimit } from "@relay/db/schema/rate-limit";
import { env } from "@relay/env/server";
import { lte, sql } from "drizzle-orm";

const MAX_ATTEMPTS = 10;

// The privacy policy promises only a hash of the IP is stored, and only until
// the window expires. Changing either means changing the policy.
export async function allowAttempt(ip: string) {
  const key = createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(ip)
    .digest("hex");

  await db.delete(rateLimit).where(lte(rateLimit.resetAt, sql`now()`));

  const [row] = await db
    .insert(rateLimit)
    .values({ key, count: 1, resetAt: sql`now() + interval '10 minutes'` })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: { count: sql`${rateLimit.count} + 1` },
    })
    .returning({ count: rateLimit.count });

  return (row?.count ?? 0) <= MAX_ATTEMPTS;
}
