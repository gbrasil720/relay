import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/landing/privacy-page";

export const Route = createFileRoute("/privacidade")({
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: "Política de privacidade — Relay" }],
  }),
});
