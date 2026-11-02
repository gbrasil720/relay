import { db } from "@relay/db";
import { user } from "@relay/db/schema/auth";
import { desc } from "drizzle-orm";
import { adminProcedure, router } from "../../index";

export const clientsRouter = router({
  // ponytail: whole table, the screen searches and pages in memory. Paginate here past a few thousand users.
  list: adminProcedure.query(() =>
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt)),
  ),
});
