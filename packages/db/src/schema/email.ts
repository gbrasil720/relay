import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Statuses in the order an email moves through them; SES events never move one back.
export const EMAIL_STATUSES = [
  "sent",
  "delivery_delayed",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
] as const;

export type EmailStatus = (typeof EMAIL_STATUSES)[number];

// One row per email sent through SES, keyed by its SES message id.
export const emailMessage = pgTable("email_message", {
  id: text("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  status: text("status", { enum: EMAIL_STATUSES }).default("sent").notNull(),
  bounceType: text("bounce_type"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
