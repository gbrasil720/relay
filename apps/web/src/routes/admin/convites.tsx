import { createFileRoute } from "@tanstack/react-router";
import { AdminConvites } from "@/components/admin/screens/convites";

export const Route = createFileRoute("/admin/convites")({
  component: AdminConvites,
});
