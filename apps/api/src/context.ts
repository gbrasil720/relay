import { auth } from "@relay/auth";
import { env } from "@relay/env/server";
import type { Context as ElysiaContext } from "elysia";

export type CreateContextOptions = {
  context: Pick<ElysiaContext, "request"> &
    Partial<Pick<ElysiaContext, "server">>;
  // Keeps work alive after the response; Workers cancel anything left unawaited.
  defer?: (task: Promise<unknown>) => void;
};

// A proxy appends the address it saw, so the last entry is the one it vouches for.
function clientIp({ request, server }: CreateContextOptions["context"]) {
  const header = env.CLIENT_IP_HEADER;
  if (header) return request.headers.get(header)?.split(",").at(-1)?.trim();
  return server?.requestIP(request)?.address;
}

export async function createContext({ context, defer }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });
  return {
    auth: null,
    session,
    ip: clientIp(context),
    defer: defer ?? (() => {}),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
