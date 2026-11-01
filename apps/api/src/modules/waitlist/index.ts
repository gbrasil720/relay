import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../index";
import { WaitlistModel } from "./model";
import { allowAttempt } from "./rate-limit";
import { WaitlistService } from "./service";

export const waitlistModule = router({
  join: publicProcedure
    .use(async ({ ctx, next }) => {
      if (!(await allowAttempt(ctx.ip ?? "unknown"))) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts",
        });
      }
      return next();
    })
    .input(WaitlistModel.joinInput)
    .mutation(({ input, ctx }) => WaitlistService.join(input, ctx.defer)),
});
