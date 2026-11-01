import { expect, test } from "vitest";
import { WaitlistModel } from "./model";

const parse = (email: string) =>
  WaitlistModel.joinInput.safeParse({ email, source: "hero" });

test("normalizes email so duplicates hit the unique constraint", () => {
  expect(parse("  Ana@Tinta.APP ").data?.email).toBe("ana@tinta.app");
});

test("rejects invalid and oversized email", () => {
  expect(parse("not-an-email").success).toBe(false);
  expect(parse(`${"a".repeat(250)}@x.co`).success).toBe(false);
});

test("rejects unknown source", () => {
  const result = WaitlistModel.joinInput.safeParse({
    email: "ana@tinta.app",
    source: "api",
  });
  expect(result.success).toBe(false);
});
