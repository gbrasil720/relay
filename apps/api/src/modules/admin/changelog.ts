import { db } from "@relay/db";
import { changelogEntry } from "@relay/db/schema/waitlist";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, router } from "../../index";

const createInput = z.object({
  type: z.enum(["novo", "melhoria", "correção"]),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  pr: z.number().int().positive().max(2147483647).optional(),
  publish: z.boolean(),
});

export const changelogRouter = router({
  // Postgres sorts NULL first on DESC, so drafts stay on top.
  list: adminProcedure.query(() =>
    db
      .select()
      .from(changelogEntry)
      .orderBy(desc(changelogEntry.publishedAt), desc(changelogEntry.createdAt)),
  ),
  create: adminProcedure
    .input(createInput)
    .mutation(async ({ input: { publish, ...entry } }) => {
      const [row] = await db
        .insert(changelogEntry)
        .values({ ...entry, publishedAt: publish ? new Date() : null })
        .returning();
      return row;
    }),
  publish: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(changelogEntry)
        .set({ publishedAt: new Date() })
        .where(
          and(
            eq(changelogEntry.id, input.id),
            isNull(changelogEntry.publishedAt),
          ),
        )
        .returning();
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found" });
      }
      return row;
    }),
});
