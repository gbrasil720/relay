import { cn } from "@relay/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { himetrica } from "@/lib/himetrica";
import { trpc } from "@/utils/trpc";
import { PixelArt } from "./pixel-art";
import { MASCOT } from "./pixels";

const MAX_ATTRIBUTION = 2048;
const JOINED_KEY = "relay:waitlist-email";

function readJoined() {
  try {
    return localStorage.getItem(JOINED_KEY);
  } catch {
    return null;
  }
}

export function useJoinedEmail() {
  const [email, setEmail] = useState(readJoined);

  function onJoined(joined: string) {
    setEmail(joined);
    try {
      localStorage.setItem(JOINED_KEY, joined);
    } catch {
      // Blocked storage only means the form comes back on the next visit.
    }
  }

  return [email, onJoined] as const;
}

function attribution() {
  const params = new URLSearchParams(window.location.search);
  const read = (value: string | null) =>
    value?.slice(0, MAX_ATTRIBUTION) || undefined;

  return {
    referrer: read(document.referrer),
    utmSource: read(params.get("utm_source")),
    utmMedium: read(params.get("utm_medium")),
    utmCampaign: read(params.get("utm_campaign")),
    locale: navigator.language.slice(0, 35),
  };
}

function JoinedCard({
  email,
  closing,
  celebrate,
}: {
  email: string;
  closing: boolean;
  celebrate: boolean;
}) {
  return (
    <div
      className={cn(
        "box-border flex w-full max-w-[560px] items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left",
        closing
          ? "border-white bg-white text-[#16181D]"
          : "border-rl-edge bg-rl-raised/90 text-rl-fg",
        celebrate && "rl-pop",
      )}
      role="status"
    >
      <span
        className={cn(
          "grid size-12 flex-none place-items-center rounded-xl bg-rl-sky-ink",
          celebrate && "rl-land",
        )}
      >
        <PixelArt cols={16} pixels={MASCOT} size={2} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <strong className="text-[16px]">Você está na lista.</strong>
        <span
          className={cn(
            "break-words text-[14px]",
            closing ? "text-[#444851]" : "text-rl-dim",
          )}
        >
          O convite chega em {email} quando for a sua vez.
        </span>
      </span>
    </div>
  );
}

type WaitlistFormProps = {
  source: "hero" | "closing";
  joinedEmail: string | null;
  onJoined: (email: string) => void;
};

export function WaitlistForm({
  source,
  joinedEmail,
  onJoined,
}: WaitlistFormProps) {
  const closing = source === "closing";
  const inputId = useId();
  const [email, setEmail] = useState("");
  // Only a signup in this visit celebrates; a returning visitor's card stays still.
  const [returning] = useState(Boolean(joinedEmail));
  const join = useMutation(
    trpc.waitlist.join.mutationOptions({
      onSuccess: (_, input) => {
        onJoined(input.email.trim().toLowerCase());
        himetrica?.track("waitlist_joined", { source: input.source });
      },
      onError: (error) => {
        toast.error(
          error.data?.code === "TOO_MANY_REQUESTS"
            ? "Muitas tentativas. Tente de novo em alguns minutos."
            : "Não deu para entrar na lista. Tente de novo.",
        );
      },
    }),
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    join.mutate({ email, source, ...attribution() });
  }

  if (joinedEmail)
    return (
      <JoinedCard
        celebrate={!returning}
        closing={closing}
        email={joinedEmail}
      />
    );

  return (
    <form
      className="m-0 flex w-full max-w-[560px] flex-wrap justify-center gap-2"
      onSubmit={onSubmit}
    >
      <label className="sr-only" htmlFor={inputId}>
        Seu email de trabalho
      </label>
      <input
        autoComplete="email"
        className={cn(
          "min-h-[54px] min-w-0 flex-[1_1_260px] rounded-xl border px-[18px] text-[16px]",
          closing
            ? "border-white bg-white text-[#16181D]"
            : "border-rl-edge bg-rl-raised/90 text-rl-fg",
        )}
        id={inputId}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="voce@seuproduto.com"
        required
        type="email"
        value={email}
      />
      <button
        className={cn(
          "rl-press inline-flex min-h-[54px] cursor-pointer items-center gap-2.5 rounded-xl border-0 px-6 font-bold text-[17px] text-white disabled:cursor-wait disabled:opacity-70",
          closing
            ? "bg-rl-sky-ink"
            : "bg-rl-accent shadow-[0_0_0_1px_var(--color-rl-accent),0_12px_40px_-14px_var(--color-rl-accent)]",
        )}
        disabled={join.isPending}
        type="submit"
      >
        Entrar na lista
        {!closing && <ArrowRight aria-hidden="true" className="size-[18px]" />}
      </button>
    </form>
  );
}
