import { router } from "./index";
import { authModule } from "./modules/auth";
import { healthModule } from "./modules/health";
import { waitlistModule } from "./modules/waitlist";

export const appRouter = router({
  healthCheck: healthModule,
  privateData: authModule,
  waitlist: waitlistModule,
});
export type AppRouter = typeof appRouter;
