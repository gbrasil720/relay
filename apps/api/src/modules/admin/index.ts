import { db } from "@relay/db";
import { user } from "@relay/db/schema/auth";
import { waitlist } from "@relay/db/schema/waitlist";
import { env } from "@relay/env/server";
import { and, isNotNull, isNull } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../../index";
import { changelogRouter } from "./changelog";
import { clientsRouter } from "./clients";
import { deliverabilityRouter } from "./deliverability";
import { invitesRouter } from "./invites";
import { overviewRouter } from "./overview";
import { inviteRules, nextBatchAt } from "./rules";
import { usageRouter } from "./usage";
import { waitlistRouter } from "./waitlist";

export const adminModule = router({
  isAdmin: protectedProcedure.query(({ ctx }) =>
    env.ADMIN_EMAILS.includes(ctx.session.user.email.toLowerCase()),
  ),
  shell: adminProcedure.query(async () => {
    const [queue, invited, pendingInvites, clients, rules] = await Promise.all([
      db.$count(
        waitlist,
        and(isNull(waitlist.invitedAt), isNull(waitlist.skippedAt)),
      ),
      db.$count(waitlist, isNotNull(waitlist.invitedAt)),
      db.$count(
        waitlist,
        and(isNotNull(waitlist.invitedAt), isNull(waitlist.redeemedAt)),
      ),
      db.$count(user),
      inviteRules(),
    ]);
    return {
      queue,
      invited,
      pendingInvites,
      clients,
      nextBatchAt: nextBatchAt(rules),
    };
  }),
  overview: overviewRouter,
  waitlist: waitlistRouter,
  invites: invitesRouter,
  clients: clientsRouter,
  usage: usageRouter,
  deliverability: deliverabilityRouter,
  changelog: changelogRouter,
});
