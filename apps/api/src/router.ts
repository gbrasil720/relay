import { router } from "./index";
import { adminModule } from "./modules/admin";
import { authModule } from "./modules/auth";
import { healthModule } from "./modules/health";
import { waitlistModule } from "./modules/waitlist";

export const appRouter = router({
  admin: adminModule,
  healthCheck: healthModule,
  privateData: authModule,
  waitlist: waitlistModule,
});
export type AppRouter = typeof appRouter;
