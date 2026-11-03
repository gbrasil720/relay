import { db } from "@relay/db";
import { sendEmail } from "@relay/email";
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
        WaitlistService.confirm(input.email).catch((error) => {
          console.error("Waitlist confirmation failed", error);
        }),
      );
    }

    return { ok: true };
  }

  private static async confirm(to: string) {
    if (!env.AWS_ACCESS_KEY_ID) return;

    const position = await db.$count(waitlist);
    const email = waitlistEmail({ position, siteUrl: env.CORS_ORIGIN });
    await sendEmail({
      to,
      ...email,
      replyTo: CONTACT_EMAIL,
    });
  }
}
