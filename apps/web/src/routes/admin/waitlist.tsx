import { createFileRoute } from "@tanstack/react-router";
import { AdminWaitlist } from "@/components/admin/screens/waitlist";

export const Route = createFileRoute("/admin/waitlist")({
  component: AdminWaitlist,
});
