import { createFileRoute } from "@tanstack/react-router";
import { AdminUso } from "@/components/admin/screens/uso";

export const Route = createFileRoute("/admin/uso")({
  component: AdminUso,
});
