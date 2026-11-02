import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
  component: AdminShell,
  beforeLoad: async ({ context }) => {
    const session = await authClient.getSession();
    if (!session.data) throw redirect({ to: "/login" });

    const allowed = await context.queryClient
      .fetchQuery(context.trpc.admin.isAdmin.queryOptions())
      .catch(() => false);
    if (!allowed) throw redirect({ to: "/" });
  },
});
