import { db } from "@relay/db";
import { adminSetting, inviteBatch, waitlist } from "@relay/db/schema/waitlist";
import { env } from "@relay/env/server";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull, lt, max, or, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, router } from "../../index";
import { CONTACT_EMAIL } from "../waitlist/email";
import { inviteEmail } from "./invite-email";
import { inviteRules } from "./rules";
import {
  countsOf,
  emailInput,
  idsInput,
  loadEntries,
  nextBatch,
} from "./waitlist";

const DAY = 86_400_000;

const rulesInput = z
  .object({
    size: z.number().int().min(1, "Tamanho inválido.").max(500, "Tamanho inválido."),
    weekday: z.number().int().min(0).max(6),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido."),
    validityDays: z.number().int().min(1, "Validade inválida.").max(90, "Validade inválida."),
    reminderDay: z.number().int().min(1, "Lembrete inválido."),
  })
  .refine((rules) => rules.reminderDay < rules.validityDays, {
    message: "O lembrete precisa sair antes do convite expirar.",
  });

function signupUrl() {
  if (!env.INVITE_SIGNUP_URL) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Signup ainda não abriu: defina INVITE_SIGNUP_URL para enviar convites.",
    });
  }
  if (!env.MILLIONSEND_API_KEY) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Defina MILLIONSEND_API_KEY para enviar convites.",
    });
  }
  return env.INVITE_SIGNUP_URL;
}

function nothingToSend(message: string) {
  return new TRPCError({ code: "BAD_REQUEST", message });
}

export abstract class InviteService {
  /** Claims the rows first so a repeated call can't invite anyone twice. */
  static async send(ids: string[], message?: string) {
    const baseUrl = signupUrl();
    const rules = await inviteRules();
    const now = new Date();
    const expiredBefore = new Date(now.getTime() - rules.validityDays * DAY);
    const invitable = and(
      inArray(waitlist.id, ids),
      isNull(waitlist.redeemedAt),
      or(isNull(waitlist.invitedAt), lt(waitlist.invitedAt, expiredBefore)),
    );
    const size = await db.$count(waitlist, invitable);
    if (!size) throw nothingToSend("Esses emails já têm convite em aberto.");

    const [last] = await db
      .select({ number: max(inviteBatch.number) })
      .from(inviteBatch);
    const batchId = crypto.randomUUID();
    // neon-http has no interactive transactions; batch is atomic and the unique number aborts a race.
    const [, claimed] = await db.batch([
      db.insert(inviteBatch).values({
        id: batchId,
        number: (last?.number ?? 0) + 1,
        scheduledAt: now,
        sentAt: now,
        size,
      }),
      db
        .update(waitlist)
        .set({
          inviteCode: sql`gen_random_uuid()::text`,
          invitedAt: now,
          inviteOpenedAt: null,
          remindedAt: null,
          skippedAt: null,
          batchId,
        })
        .where(invitable)
        .returning({
          id: waitlist.id,
          email: waitlist.email,
          inviteCode: waitlist.inviteCode,
        }),
    ]);

    // Imported here because the client throws at load without an API key.
    const { sendEmail } = await import("@relay/millionsend");
    const failed: string[] = [];
    for (const row of claimed) {
      const inviteUrl = new URL(baseUrl);
      inviteUrl.searchParams.set("code", row.inviteCode ?? "");
      try {
        await sendEmail({
          to: row.email,
          ...inviteEmail({
            inviteUrl: inviteUrl.href,
            siteUrl: env.CORS_ORIGIN,
            validityDays: rules.validityDays,
            message,
          }),
          replyTo: CONTACT_EMAIL,
          idempotencyKey: `invite/${row.id}/${row.inviteCode}`,
        });
      } catch (error) {
        console.error("Invite email failed", row.id, error);
        failed.push(row.id);
      }
    }

    // Whoever didn't get the email goes back to the queue, never shown as invited.
    if (failed.length) {
      await db
        .update(waitlist)
        .set({ inviteCode: null, invitedAt: null, batchId: null })
        .where(inArray(waitlist.id, failed));
      if (failed.length === claimed.length) {
        await db.delete(inviteBatch).where(eq(inviteBatch.id, batchId));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nenhum convite saiu. Nada foi registrado.",
        });
      }
      await db
        .update(inviteBatch)
        .set({ size: claimed.length - failed.length })
        .where(eq(inviteBatch.id, batchId));
    }

    return { sent: claimed.length - failed.length, failed: failed.length };
  }

  static async sendNext() {
    signupUrl();
    const { entries, rules } = await loadEntries();
    const { ids } = nextBatch(entries, rules);
    if (!ids.length) throw nothingToSend("A fila está vazia.");
    return InviteService.send(ids);
  }

  static async resendExpired() {
    signupUrl();
    const { entries } = await loadEntries();
    const ids = entries.filter((e) => e.status === "expired").map((e) => e.id);
    if (!ids.length) throw nothingToSend("Nenhum convite expirado.");
    return InviteService.send(ids);
  }

  /** Jumps the queue. Unknown emails join the list so the invite stays on record. */
  static async sendOne(email: string, message?: string) {
    signupUrl();
    await db
      .insert(waitlist)
      .values({ email, source: "avulso" })
      .onConflictDoNothing({ target: waitlist.email });
    const [row] = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.email, email));
    return InviteService.send(row ? [row.id] : [], message);
  }
}

export const invitesRouter = router({
  summary: adminProcedure.query(async () => {
    const [{ entries, rules }, batches] = await Promise.all([
      loadEntries(),
      db.select().from(inviteBatch).orderBy(desc(inviteBatch.number)),
    ]);
    const invitedAt = entries.flatMap((e) => e.invitedAt ?? []);
    return {
      counts: countsOf(entries),
      rules,
      next: nextBatch(entries, rules),
      since: invitedAt.length
        ? new Date(Math.min(...invitedAt.map(Number)))
        : null,
      batches: batches.map((batch) => {
        const members = entries.filter((e) => e.batchId === batch.id);
        const ranks = members.map((e) => e.rank);
        return {
          number: batch.number,
          at: batch.sentAt ?? batch.scheduledAt,
          size: batch.size,
          opened: members.filter((e) => e.inviteOpenedAt).length,
          redeemed: members.filter((e) => e.redeemedAt).length,
          from: ranks.length ? Math.min(...ranks) : null,
          to: ranks.length ? Math.max(...ranks) : null,
          status: members.some((e) => e.status === "invited")
            ? ("open" as const)
            : ("closed" as const),
        };
      }),
    };
  }),
  emailPreview: adminProcedure.query(async () => {
    const rules = await inviteRules();
    return inviteEmail({
      inviteUrl: env.INVITE_SIGNUP_URL ?? env.CORS_ORIGIN,
      siteUrl: env.CORS_ORIGIN,
      validityDays: rules.validityDays,
    });
  }),
  send: adminProcedure
    .input(idsInput)
    .mutation(({ input }) => InviteService.send(input.ids)),
  sendNext: adminProcedure.mutation(() => InviteService.sendNext()),
  resendExpired: adminProcedure.mutation(() => InviteService.resendExpired()),
  sendOne: adminProcedure
    .input(
      z.object({
        email: emailInput,
        message: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(({ input }) =>
      InviteService.sendOne(input.email, input.message),
    ),
  updateRules: adminProcedure
    .input(rulesInput)
    .mutation(async ({ input }) => {
      await db
        .insert(adminSetting)
        .values({ key: "invite_rules", value: input })
        .onConflictDoUpdate({
          target: adminSetting.key,
          set: { value: input, updatedAt: new Date() },
        });
    }),
});
