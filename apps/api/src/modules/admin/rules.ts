import { db } from "@relay/db";
import { adminSetting } from "@relay/db/schema/waitlist";
import { eq } from "drizzle-orm";

export type InviteRules = {
  size: number;
  /** 0 = Sunday … 5 = Friday */
  weekday: number;
  /** America/Sao_Paulo local time */
  time: string;
  validityDays: number;
  reminderDay: number;
};

export const DEFAULT_RULES: InviteRules = {
  size: 25,
  weekday: 5,
  time: "10:00",
  validityDays: 7,
  reminderDay: 5,
};

export async function inviteRules() {
  const [row] = await db
    .select({ value: adminSetting.value })
    .from(adminSetting)
    .where(eq(adminSetting.key, "invite_rules"));
  return { ...DEFAULT_RULES, ...(row?.value as Partial<InviteRules>) };
}

/** Next occurrence of the rules' weekday and time, São Paulo is always GMT-3. */
export function nextBatchAt(rules: InviteRules, now = new Date()) {
  const [hour = 10, minute = 0] = rules.time.split(":").map(Number);
  const next = new Date(now);
  next.setUTCHours(hour + 3, minute, 0, 0);
  while (next.getUTCDay() !== rules.weekday || next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}
