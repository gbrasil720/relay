// Signup is closed, so the first admin is created by hand:
// DATABASE_URL=... bun packages/auth/scripts/create-admin.ts email "Nome" senha
import { randomUUID } from "node:crypto";
import { db } from "@relay/db";
import { account, user } from "@relay/db/schema/auth";
import { auth } from "../src/index";

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password || password.length < 12) {
  throw new Error("Usage: create-admin.ts <email> <name> <password 12+ chars>");
}

const id = randomUUID();
await db.insert(user).values({ id, email: email.toLowerCase(), name });
await db.insert(account).values({
  id: randomUUID(),
  userId: id,
  accountId: id,
  providerId: "credential",
  password: await (await auth.$context).password.hash(password),
});
console.log(`Created ${email}`);
