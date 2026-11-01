import { db } from "@relay/db";
import { waitlist } from "@relay/db/schema/waitlist";
import { env } from "@relay/env/server";
import { CONTACT_EMAIL, waitlistEmail } from "./email";
import type { Context } from "../../context";
import type { WaitlistModel } from "./model";

export abstract class WaitlistService {
  // Same response for new and repeated emails, so the form can't reveal who signed up.
  static async join(input: WaitlistModel.JoinInput, defer: Context["defer"]) {
    const [row] = await db
      .insert(waitlist)
      .values(input)
      .onConflictDoNothing({ target: waitlist.email })
      .returning({ id: waitlist.id });

    // Not awaited: send time would otherwise tell new emails from repeated ones.
    if (row) {
      defer(
        WaitlistService.confirm(row.id, input.email).catch((error) => {
          console.error("Waitlist confirmation failed", error);
        }),
      );
    }

    return { ok: true };
  }

  private static async confirm(id: string, to: string) {
    if (!env.MILLIONSEND_API_KEY) return;

    // Imported here because the client throws at load without an API key.
    const { sendEmail } = await import("@relay/millionsend");
    const position = await db.$count(waitlist);
    const email = waitlistEmail({ position, siteUrl: env.CORS_ORIGIN });
    await sendEmail({
      to,
      ...email,
      replyTo: CONTACT_EMAIL,
      idempotencyKey: `waitlist/${id}`,
    });
  }
}
