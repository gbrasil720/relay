import { z } from "zod";

const attribution = z.string().max(2048).optional();

export namespace WaitlistModel {
  export const joinInput = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    source: z.enum(["hero", "closing"]),
    referrer: attribution,
    utmSource: attribution,
    utmMedium: attribution,
    utmCampaign: attribution,
    locale: z.string().max(35).optional(),
  });

  export type JoinInput = z.infer<typeof joinInput>;
}
