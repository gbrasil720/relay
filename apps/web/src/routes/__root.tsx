import { Toaster } from "@relay/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import type { trpc } from "@/utils/trpc";
import "../index.css";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Relay — tudo que você lança, contado para quem usa",
      },
      {
        name: "description",
        content:
          "Conecte o GitHub. A Relay separa o que importa para quem usa e escreve o email de novidades com a sua marca.",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "48x48",
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  }),
});

function RootComponent() {
  const isPublicPage = useLocation({
    select: (l) =>
      l.pathname === "/" ||
      l.pathname === "/privacidade" ||
      l.pathname.startsWith("/admin"),
  });

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        {isPublicPage ? (
          <Outlet />
        ) : (
          <div className="grid h-svh grid-rows-[auto_1fr]">
            <Header />
            <Outlet />
          </div>
        )}
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
