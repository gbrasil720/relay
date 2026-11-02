import { createFileRoute } from "@tanstack/react-router";
import { AdminGeral } from "@/components/admin/screens/geral";

export const Route = createFileRoute("/admin/")({
  component: AdminGeral,
});
