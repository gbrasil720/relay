import { createFileRoute } from "@tanstack/react-router";
import { AdminChangelog } from "@/components/admin/screens/changelog";

export const Route = createFileRoute("/admin/changelog")({
  component: AdminChangelog,
});
