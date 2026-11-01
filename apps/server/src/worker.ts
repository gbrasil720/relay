import { createContext } from "@relay/api/context";
import { appRouter } from "@relay/api/routers/index";
import { auth } from "@relay/auth";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

type Env = { ASSETS: { fetch: typeof fetch } };
type WorkerContext = { waitUntil: (task: Promise<unknown>) => void };

export default {
  fetch(request: Request, env: Env, worker: WorkerContext) {
    const url = new URL(request.url);

    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith("/api/auth/")) return auth.handler(request);
    if (url.pathname.startsWith("/trpc/")) {
      return fetchRequestHandler({
        endpoint: "/trpc",
        router: appRouter,
        req: request,
        createContext: () =>
          createContext({
            context: { request },
            defer: (task) => worker.waitUntil(task),
          }),
      });
    }

    return env.ASSETS.fetch(request);
  },
};
