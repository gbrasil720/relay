import { createFileRoute } from "@tanstack/react-router";
import { AdminEntrega } from "@/components/admin/screens/entrega";

export const Route = createFileRoute("/admin/entrega")({
  component: AdminEntrega,
});
