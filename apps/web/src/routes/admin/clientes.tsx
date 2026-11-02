import { createFileRoute } from "@tanstack/react-router";
import { AdminClientes } from "@/components/admin/screens/clientes";

export const Route = createFileRoute("/admin/clientes")({
  component: AdminClientes,
});
