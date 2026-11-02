import { neon, neonConfig } from "@neondatabase/serverless";
import { env } from "@relay/env/server";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// docker-compose.dev.yml exposes Postgres through a local Neon HTTP proxy.
if (env.DATABASE_URL.includes("db.localtest.me")) {
  neonConfig.fetchEndpoint = (host) => `http://${host}:4444/sql`;
}

export function createDb() {
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema });
}

export const db = createDb();
