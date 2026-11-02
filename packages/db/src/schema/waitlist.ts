import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const waitlist = pgTable("waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  source: text("source").notNull(),
  referrer: text("referrer"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  locale: text("locale"),
  inviteCode: text("invite_code").unique(),
  invitedAt: timestamp("invited_at", { withTimezone: true }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  priority: boolean("priority").default(false).notNull(),
  note: text("note"),
  skippedAt: timestamp("skipped_at", { withTimezone: true }),
  batchId: uuid("batch_id").references(() => inviteBatch.id),
  inviteOpenedAt: timestamp("invite_opened_at", { withTimezone: true }),
  remindedAt: timestamp("reminded_at", { withTimezone: true }),
});

export const inviteBatch = pgTable("invite_batch", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: integer("number").notNull().unique(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  size: integer("size").notNull(),
});

export const changelogEntry = pgTable("changelog_entry", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type", { enum: ["novo", "melhoria", "correção"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  pr: integer("pr"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

// One row per setting, e.g. "invite_rules" and "landing_mode".
export const adminSetting = pgTable("admin_setting", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
