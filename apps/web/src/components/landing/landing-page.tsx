import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { FAQ, FEED, TONES, type Tone } from "./content";
import isoCadence from "./iso-cadence.svg";
import isoDomain from "./iso-domain.svg";
import isoTone from "./iso-tone.svg";
import { HeroField, PixelArt, SkyField } from "./pixel-art";
import { GLYPH, MASCOT } from "./pixels";
import { useJoinedEmail, WaitlistForm } from "./waitlist-form";

const h2 =
  "m-0 font-light font-rl-display text-[clamp(40px,5vw,70px)] leading-[0.98] tracking-[-0.05em]";
const card = "rounded-[18px] border border-rl-line bg-rl-card";
const chip =
  "rounded-md border border-rl-edge bg-rl-chip px-[9px] py-[5px] text-rl-fg";
const anchor = "scroll-mt-6";

// Hidden for now: no customer logos yet, and these pages don't exist yet.
const SHOW_PROOF = false;
const SHOW_FOOTER_LINKS = false;

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { isIntersecting, target } of entries) {
          if (!isIntersecting) continue;
          target.setAttribute("data-visible", "");
          observer.unobserve(target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    const targets = ref.current?.querySelectorAll(".rl-reveal, .rl-stagger");
    for (const target of targets ?? []) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function Logo({ size }: { size: number }) {
  return <PixelArt cols={16} pixels={MASCOT} size={size} />;
}

function Eyebrow({
  children,
  accent,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-rl-pixel text-[12px] uppercase ${accent ? "text-rl-accent-light" : "text-rl-faint"}`}
    >
      <PixelArt cols={4} gap={1} pixels={GLYPH} size={4} />
      {children}
    </span>
  );
}

function Dot() {
  return <span aria-hidden="true" className="size-[3px] bg-[#4A4D57]" />;
}

function Nav() {
  const links = [
    ["#como", "Como funciona"],
    ["#produto", "Produto"],
    ["#email", "O email"],
  ];

  return (
    <header className="sticky top-0 z-50 bg-rl-ink/85 shadow-[0_1px_0_var(--color-rl-hairline)] backdrop-blur-md">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-8 py-[22px] min-[860px]:grid min-[860px]:gap-x-8 min-[860px]:grid-cols-[1fr_auto_1fr]"
      >
        <a
          aria-label="Relay, início"
          className="flex items-center gap-2.5 justify-self-start font-extrabold font-rl-display text-[22px] text-rl-fg tracking-[-0.045em] no-underline"
          href="#topo"
        >
          <Logo size={2.2} />
          relay
        </a>
        <div className="hidden flex-wrap justify-center gap-x-[26px] text-[15px] min-[860px]:flex">
          {links.map(([href, label]) => (
            <a
              className="rl-link py-2.5 text-rl-dim no-underline hover:text-white"
              href={href}
              key={href}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center justify-end gap-x-4 min-[860px]:gap-x-8">
          <a
            className="rl-press rounded-[10px] bg-rl-fg px-4 py-[11px] font-bold text-[15px] text-rl-ink no-underline"
            href="#topo"
          >
            Entrar na lista
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero({ joinedEmail, onJoined }: WaitlistProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[860px] scroll-mt-[200px] flex-col justify-center overflow-hidden border-rl-hairline border-b"
      id="topo"
    >
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <HeroField />
        <div className="rl-hop absolute bottom-10 left-[8%] drop-shadow-[3px_3px_0_#00000088]">
          <PixelArt cols={16} pixels={MASCOT} size={5} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_56%_44%_at_50%_40%,#0C0C0EEB_0%,#0C0C0EB0_55%,#0C0C0E00_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[90px] bg-gradient-to-b from-transparent to-rl-ink" />
      </div>

      <div className="relative z-2 mx-auto flex max-w-[980px] flex-col items-center gap-[26px] px-8 pt-12 pb-[140px] text-center">
        <span className="rl-word inline-flex items-center gap-2.5 rounded-lg border border-rl-line bg-rl-ink/80 px-3 py-[7px] font-rl-pixel text-rl-dim text-[12px] uppercase">
          <span className="rl-blink size-[7px] bg-rl-accent" />
          Acesso antecipado · convites por ordem de chegada
        </span>
        <h1
          className="m-0 font-light font-rl-display text-[clamp(48px,7vw,100px)] leading-[0.95] tracking-[-0.05em] text-balance"
          id="hero-title"
        >
          <span className="rl-word block [animation-delay:80ms]">
            Tudo que você lança,
          </span>
          <span className="rl-word block font-extrabold [animation-delay:160ms]">
            contado para <span className="text-rl-accent-light">quem usa.</span>
          </span>
        </h1>
        <p className="rl-word m-0 max-w-[600px] text-[clamp(17px,1.6vw,20px)] text-pretty text-rl-soft leading-normal [animation-delay:240ms]">
          Conecte o GitHub. A Relay separa o que muda a vida de quem usa, deixa
          a manutenção de fora e escreve o email de novidades com a sua marca.
        </p>
        <div className="rl-word flex w-full flex-col items-center gap-3 [animation-delay:320ms]">
          <WaitlistForm
            joinedEmail={joinedEmail}
            onJoined={onJoined}
            source="hero"
          />
          <span className="inline-flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-rl-faint text-[14px]">
            {!joinedEmail && (
              <>
                <span>Só usamos o email para o convite</span>
                <Dot />
              </>
            )}
            <a className="text-rl-soft underline" href="#email">
              Ver um email de exemplo
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section
      aria-label="Quem usa"
      className="border-rl-line border-t border-b-rl-hairline border-b"
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-10 gap-y-3.5 px-8 py-7">
        <span className="font-rl-pixel text-[11.5px] text-rl-faint uppercase">
          Produtos que mandam novidades com a Relay
        </span>
        {[1, 2, 3, 4].map((n) => (
          <span
            className="rounded-lg border border-rl-edge border-dashed px-[18px] py-2.5 text-[13px] text-rl-faint"
            key={n}
          >
            [LOGO]
          </span>
        ))}
      </div>
    </section>
  );
}

function Step({
  n,
  time,
  title,
  body,
  children,
  last,
}: {
  n: number;
  time: string;
  title: string;
  body: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <li
      className={`grid grid-cols-[40px_minmax(0,1fr)] gap-x-7 ${last ? "" : "pb-[72px]"}`}
    >
      <span
        className={`relative z-1 grid size-10 place-items-center rounded-[10px] border-[1.5px] border-rl-accent font-rl-pixel text-[13px] ${last ? "bg-rl-accent text-white" : "bg-rl-ink text-rl-accent-light"}`}
      >
        {n}
      </span>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-center gap-x-12 gap-y-7">
        <div className="rl-reveal flex flex-col gap-2.5">
          <span className="font-rl-pixel text-[11.5px] text-rl-faint uppercase">
            {time}
          </span>
          <h3 className="m-0 font-bold font-rl-display text-[30px] leading-[1.05] tracking-[-0.035em]">
            {title}
          </h3>
          <p className="m-0 max-w-[440px] text-[16px] text-rl-soft">{body}</p>
        </div>
        {children}
      </div>
    </li>
  );
}

function DiffLine({
  removed,
  added,
  caret,
}: {
  removed: string;
  added: string;
  caret?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-[18px_minmax(0,1fr)] gap-2 rounded-lg bg-[#E0607A14] px-2 py-1.5 text-[#E0607A]">
        <span>−</span>
        <span className="line-through decoration-[#E0607A88]">{removed}</span>
      </div>
      <div className="grid grid-cols-[18px_minmax(0,1fr)] gap-2 rounded-lg bg-[#6BD49A14] px-2 py-1.5 text-rl-fg">
        <span className="text-rl-ok">+</span>
        <span className="font-rl-body font-semibold text-[15px]">
          {added}
          {caret && (
            <span
              aria-hidden="true"
              className="rl-blink ml-[3px] inline-block h-[15px] w-[7px] bg-rl-accent align-[-2px]"
            />
          )}
        </span>
      </div>
    </>
  );
}

function scoreColor(score: number) {
  if (score > 6) return "var(--color-rl-accent)";
  return score === 6 ? "var(--color-rl-accent-pale)" : "#3A3D46";
}

function Feed() {
  return (
    <div className="rl-stagger flex flex-col gap-1 rounded-2xl border border-rl-line bg-rl-card p-3">
      {FEED.map(({ msg, score }) => (
        <div
          className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 rounded-lg px-2.5 py-2 ${score > 6 ? "bg-rl-accent/8" : ""}`}
          key={msg}
        >
          <span
            className={`truncate font-rl-mono text-[12px] ${score >= 6 ? "text-rl-fg" : "text-rl-faint"}`}
          >
            {msg}
          </span>
          <span className="rl-meter hidden grid-cols-[repeat(12,6px)] gap-0.5 sm:grid">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                className="h-[9px]"
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length meter
                key={i}
                style={{
                  background: i < score ? scoreColor(score) : "#1E2027",
                }}
              />
            ))}
          </span>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 px-2.5 pt-2 pb-0.5 text-rl-dim text-[12px]">
        {[
          ["entra", "bg-rl-accent"],
          ["você decide", "bg-rl-accent-pale"],
          ["fica com o time", "bg-[#3A3D46]"],
        ].map(([label, color]) => (
          <span className="inline-flex items-center gap-1.5" key={label}>
            <span className={`size-2 ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section
      className={`mx-auto flex max-w-[1280px] flex-col gap-14 px-8 pt-[130px] pb-[60px] ${anchor}`}
      id="como"
    >
      <div className="rl-reveal flex max-w-[820px] flex-col gap-[18px]">
        <Eyebrow>01 · Como funciona</Eyebrow>
        <h2 className={`${h2} text-balance`}>
          De um merge na madrugada{" "}
          <span className="font-extrabold">ao email de sexta.</span>
        </h2>
        <p className="m-0 max-w-[560px] text-[18px] text-rl-soft">
          Role e acompanhe o que acontece quando alguém do time dá push.
        </p>
      </div>

      <ol className="relative m-0 flex list-none flex-col p-0">
        <span
          aria-hidden="true"
          className="absolute top-6 bottom-6 left-[19px] w-0.5 bg-[repeating-linear-gradient(180deg,#2E3039_0_6px,transparent_6px_12px)]"
        />
        <span
          aria-hidden="true"
          className="rl-progress absolute top-6 bottom-6 left-[19px] w-0.5 bg-[repeating-linear-gradient(180deg,var(--color-rl-accent)_0_6px,transparent_6px_12px)]"
        />
        <Step
          body="Ela acompanha a branch principal do repositório conectado. Mensagens, diffs e PRs já são o briefing."
          n={1}
          time="02:13 · o push"
          title="Alguém dá merge. Ninguém precisa avisar a Relay."
        >
          <div className="rl-stagger flex flex-col overflow-hidden rounded-2xl border border-rl-line bg-rl-card px-5 py-[18px] font-rl-mono text-[13.5px] text-rl-soft leading-[1.8]">
            <span>
              <span className="text-rl-accent-light">$</span> git push origin
              main
            </span>
            <span className="text-[#6E717C]">
              To github.com:tinta-app/tinta.git
            </span>
            <span className="text-[#6E717C]">
              &nbsp;&nbsp; 0d3a6f9..a1f3c9e&nbsp; main → main
            </span>
            <span className="mt-2.5 inline-flex items-center gap-2 self-start rounded-lg border border-rl-edge bg-rl-chip px-2.5 py-1.5 text-rl-fg text-[12px]">
              <Logo size={1.5} />
              relay leu 8 commits novos
            </span>
          </div>
        </Step>
        <Step
          body="Refatoração, CI, dependências e testes ficam com o time. O que está no limite espera você decidir."
          n={2}
          time="02:14 · a triagem"
          title="Cada mudança ganha uma nota de relevância para quem usa."
        >
          <Feed />
        </Step>
        <Step
          body="Você define a voz uma vez. Cada linha pode ser reescrita antes de sair."
          n={3}
          time="02:15 · a escrita"
          title="O commit vira benefício, no tom e com a marca do seu produto."
        >
          <div className="rl-stagger flex flex-col gap-2.5 rounded-2xl border border-rl-line bg-rl-card p-3.5 font-rl-mono text-[13px]">
            <DiffLine
              added="Exporte notas em PDF, com capa"
              removed="feat(export): PDF export with cover"
            />
            <DiffLine
              added="Suas notas voltam inteiras, mesmo offline"
              caret
              removed="fix(sync): duplicated notes on reconnect"
            />
            <span className="px-2 pt-1 text-[11.5px] text-rl-faint">
              tom: direto · marca: Tinta · assinatura: Ana
            </span>
          </div>
        </Step>
        <Step
          body="A edição fica pronta e aguarda sua aprovação. Quando confiar, ligue o automático e ela sai sozinha na hora marcada."
          last
          n={4}
          time="sex · 10:00 · o envio"
          title="O que é sensível espera por você."
        >
          <div className="rl-reveal flex flex-col gap-3.5 rounded-2xl border border-rl-accent bg-rl-card [--rl-i:1] px-5 py-[18px] shadow-[0_0_60px_-30px_var(--color-rl-accent)]">
            <span className="inline-flex items-center gap-2 font-rl-pixel text-[11.5px] text-rl-accent-light uppercase">
              <span className="rl-blink size-[7px] bg-rl-accent" />
              aguardando você · expira em 2 dias
            </span>
            <strong className="font-bold font-rl-display text-[20px] tracking-[-0.03em]">
              Edição #14 da Tinta quer sair sexta, 10:00
            </strong>
            <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-rl-soft text-[14px]">
              <span className="text-rl-faint">Para</span>
              <span>1.284 inscritos · lista novidades</span>
              <span className="text-rl-faint">Conteúdo</span>
              <span>3 novidades · 5 commits ficaram com o time</span>
              <span className="text-rl-faint">Remetente</span>
              <span>novidades@tinta.app</span>
            </div>
            <div className="flex flex-wrap gap-2 text-center text-[14px]">
              <span className="flex-[2_1_160px] rounded-[10px] bg-rl-accent p-3 font-bold text-white">
                Aprovar e agendar
              </span>
              <span className="flex-[1_1_100px] rounded-[10px] border border-rl-edge p-3">
                Editar
              </span>
            </div>
          </div>
        </Step>
      </ol>
    </section>
  );
}

function Callout({
  title,
  children,
  side,
}: {
  title: ReactNode;
  children: ReactNode;
  side: "left" | "right";
}) {
  return (
    <div
      className={`relative flex flex-col gap-1.5 ${side === "left" ? "lg:pr-9 lg:text-right" : "lg:pl-9"}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-2.5 hidden w-7 border-rl-accent border-t-2 border-dotted lg:block ${side === "left" ? "right-0" : "left-0"}`}
      />
      <strong className="font-rl-display text-[17px] tracking-[-0.02em]">
        {title}
      </strong>
      <span className="text-rl-dim text-[14px]">{children}</span>
    </div>
  );
}

function EmailPreview() {
  const [tone, setTone] = useState<Tone>("direto");
  const out = TONES[tone];

  return (
    <section
      className={`mx-auto flex max-w-[1280px] flex-col items-center gap-12 px-8 pt-20 pb-[130px] ${anchor}`}
      id="email"
    >
      <div className="rl-reveal flex max-w-[760px] flex-col items-center gap-[18px] text-center">
        <Eyebrow accent>02 · O email</Eyebrow>
        <h2 className={`${h2} text-balance`}>
          É isto que chega{" "}
          <span className="font-extrabold">na caixa de entrada.</span>
        </h2>
        <p className="m-0 max-w-[520px] text-[18px] text-rl-soft">
          Sem a marca da Relay em lugar nenhum. Troque o tom e veja o mesmo
          email reescrito.
        </p>
        <fieldset className="m-0 flex flex-wrap justify-center gap-2 border-0 p-0">
          <legend className="sr-only">Tom de voz</legend>
          {(Object.keys(TONES) as Tone[]).map((id) => (
            <button
              aria-pressed={id === tone}
              className={`rl-press min-h-11 cursor-pointer rounded-[10px] border-[1.5px] px-[18px] font-semibold text-[15px] ${
                id === tone
                  ? "border-rl-accent bg-rl-accent/15 text-rl-fg"
                  : "border-rl-edge bg-transparent text-rl-dim"
              }`}
              key={id}
              onClick={() => setTone(id)}
              type="button"
            >
              {TONES[id].label}
            </button>
          ))}
        </fieldset>
      </div>

      <div className="grid w-full grid-cols-1 items-start gap-x-5 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_minmax(0,1fr)]">
        <div className="rl-stagger order-2 flex flex-col gap-8 lg:order-none lg:gap-[110px] lg:pt-10">
          <Callout side="left" title="Remetente seu">
            Sai do seu domínio, verificado por DNS. Chega na caixa de entrada,
            não em promoções.
          </Callout>
          <Callout side="left" title="Só o que importa">
            Três novidades de oito commits. Cinco ficaram com o time.
          </Callout>
          <Callout side="left" title="Descadastro real">
            Um clique. A lista se atualiza sozinha.
          </Callout>
        </div>

        <div className="rl-reveal order-1 flex flex-col gap-3 rounded-[18px] bg-[#F3F1EC] p-4 text-[#16181D] shadow-[0_40px_80px_-40px_#000000] lg:order-none">
          <div className="flex flex-col gap-1 px-1.5 py-0.5 font-rl-mail text-[#5A5E66] text-[13px]">
            <div className="flex gap-2">
              <span className="w-14 flex-none">De</span>
              <span className="text-[#16181D]">
                Ana da Tinta &lt;novidades@tinta.app&gt;
              </span>
            </div>
            <div className="flex gap-2">
              <span className="w-14 flex-none">Assunto</span>
              <span className="rl-swap font-semibold text-[#16181D]" key={tone}>
                {out.subject}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-5 rounded-xl bg-white p-[30px] font-rl-mail">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-[#3446E0] font-bold font-rl-serif text-[15px] text-white">
                T
              </span>
              <strong className="text-[15px]">Tinta</strong>
              <span className="ml-auto text-[#5A5E66] text-[12px]">
                Novidades · nov 2026
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3
                className="rl-swap m-0 font-bold text-[23px] leading-[1.2] tracking-[-0.01em]"
                key={`${tone}-title`}
              >
                {out.title}
              </h3>
              <p
                className="rl-swap m-0 text-[#444851] text-[15px] leading-normal"
                key={`${tone}-intro`}
              >
                {out.intro}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {out.items.map(([title, body], i) => (
                <div
                  className="rl-swap grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3"
                  key={`${tone}-${title}`}
                >
                  <span className="grid size-7 place-items-center rounded-lg bg-[#EEF0FD] font-bold text-[#3446E0] text-[13px]">
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-[15.5px]">{title}</strong>
                    <span className="text-[#444851] text-[14.5px] leading-normal">
                      {body}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <span className="self-start rounded-[9px] bg-[#3446E0] px-[18px] py-3 font-semibold text-[14px] text-white">
              Abrir a Tinta
            </span>
            <p className="m-0 border-[#ECEAE4] border-t pt-4 text-[#6A6E76] text-[13px]">
              <span className="rl-swap inline-block" key={tone}>
                — {out.sign}
              </span>
              <br />
              Você recebe isto porque usa a Tinta.{" "}
              <span className="underline">Descadastrar</span>
            </p>
          </div>
        </div>

        <div className="rl-stagger order-3 flex flex-col gap-8 lg:order-none lg:gap-[110px] lg:pt-[150px]">
          <Callout side="right" title="Sua marca">
            Logo, cor e assinatura do seu produto. A Relay não aparece.
          </Callout>
          <Callout side="right" title="Benefício, não commit">
            <span className="font-rl-mono text-[12.5px] text-rl-faint line-through">
              feat(export): PDF export with cover
            </span>{" "}
            virou a linha 1.
          </Callout>
          <Callout
            side="right"
            title={
              <span className="rl-swap inline-block" key={tone}>
                Tom: {out.name}
              </span>
            }
          >
            Você define uma vez. Pode reescrever qualquer linha antes de
            aprovar.
          </Callout>
        </div>
      </div>
    </section>
  );
}

function BentoCopy({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <strong className="font-bold font-rl-display text-[18px] tracking-[-0.03em]">
        {title}
      </strong>
      <span className="text-rl-dim text-[14px] leading-normal">{children}</span>
    </div>
  );
}

function BentoIso({
  src,
  alt,
  className,
  maxWidth,
  title,
  children,
  footer,
}: {
  src: string;
  alt: string;
  className: string;
  maxWidth: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className={`${card} rl-reveal flex flex-col gap-3 overflow-hidden px-[22px] py-5 ${className}`}
    >
      <img
        alt={alt}
        className={`mx-auto -mt-1 mb-1.5 aspect-[600/340] h-auto w-full ${maxWidth}`}
        height={340}
        src={src}
        width={600}
      />
      <BentoCopy title={title}>{children}</BentoCopy>
      {footer}
    </div>
  );
}

function Product() {
  const pre =
    "m-0 overflow-x-auto rounded-[10px] border border-rl-line bg-rl-ink px-3.5 py-3 font-rl-mono text-[12.5px] text-rl-soft leading-[1.6]";
  const green = "text-[#A9D7B9]";
  const cell = `${card} rl-reveal flex flex-col justify-between gap-3.5 overflow-hidden px-[22px] py-5`;

  return (
    <section
      className={`mx-auto flex max-w-[1280px] flex-col gap-11 px-8 pt-[120px] pb-[60px] ${anchor}`}
      id="produto"
    >
      <div className="rl-reveal flex max-w-[820px] flex-col gap-[18px]">
        <Eyebrow>03 · Tudo num lugar só</Eyebrow>
        <h2 className={`${h2} text-balance`}>
          Um painel pequeno{" "}
          <span className="font-extrabold">
            para um trabalho que ninguém queria fazer.
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-3.5 min-[980px]:grid-cols-6">
        <BentoIso
          alt="Uma fechadura de pinos: três pinos, DKIM, SPF e DMARC, alinhados na linha de corte; a chave está na frente e o botão lateral gira."
          className="min-[980px]:col-span-3"
          footer={
            <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 font-rl-mono text-rl-soft text-[12px]">
              {["relay._domainkey", "send", "_dmarc"].map((record) => (
                <span key={record}>
                  {record} <span className="text-rl-ok">ok</span>
                </span>
              ))}
            </div>
          }
          maxWidth="max-w-[520px]"
          src={isoDomain}
          title="Domínio verificado"
        >
          Três pinos, DKIM, SPF e DMARC. Quando os três alinham, o botão gira: o
          email sai do seu endereço e chega na caixa de entrada, não em
          promoções.
        </BentoIso>
        <BentoIso
          alt="Um seletor rotativo de três posições sobre uma placa; o ponteiro aponta para a primeira posição, Direto."
          className="[--rl-i:1] min-[980px]:col-span-3"
          maxWidth="max-w-[520px]"
          src={isoTone}
          title="Tom de voz"
        >
          Um seletor de três posições. Direto, caloroso ou técnico; você gira
          uma vez.
        </BentoIso>
        <BentoIso
          alt="Um temporizador de cames com sete ressaltos em linha, o quinto, a sexta-feira, mais alto e aceso; um seguidor com roldana apoia nele e toca um sino."
          className="min-[980px]:col-span-2"
          maxWidth="max-w-[340px]"
          src={isoCadence}
          title="Frequência"
        >
          Sete casas, uma marcada. A edição sai no dia escolhido; sem novidade,
          o sino não toca.
        </BentoIso>
        <div className={`${cell} [--rl-i:1] min-[980px]:col-span-2`}>
          <BentoCopy title="Inscritos">
            CSV, lista colada ou API no seu cadastro. Quem cria conta já entra;
            quem sai, sai sozinho.
          </BentoCopy>
          <pre className={pre}>
            relay.subscribers.
            <span className="text-rl-accent-light">add</span>
            {"({\n  email: "}
            <span className={green}>"ana@exemplo.com"</span>
            {"\n})"}
          </pre>
          <span className="text-[13px] text-rl-faint">
            Descadastros entram sozinhos. Nada de planilha.
          </span>
        </div>
        <div className={`${cell} [--rl-i:2] min-[980px]:col-span-2`}>
          <BentoCopy title="Sempre de fora">
            Suas regras, além do que a Relay já filtra. Por prefixo de commit ou
            por caminho no repositório.
          </BentoCopy>
          <div className="flex flex-wrap gap-1.5 font-rl-mono text-[12.5px]">
            {["chore:", "ci:", "test:", "/internal/**"].map((rule) => (
              <span className={chip} key={rule}>
                {rule}
              </span>
            ))}
            <span className="rounded-md border border-[#4A4D57] border-dashed px-[9px] py-[5px] text-rl-dim">
              + regra
            </span>
          </div>
          <span className="text-[13px] text-rl-faint">
            Aplicadas antes da triagem, em todo repositório conectado.
          </span>
        </div>
        <div className={`${cell} min-[980px]:col-span-6`}>
          <BentoCopy title="Feita para agentes">
            Um servidor MCP e uma CLI deixam o seu agente ler o repositório,
            rascunhar e aprovar edições de dentro do Claude Code, do Cursor ou
            do que você usar. A Relay cuida da IA, da marca e do envio.
          </BentoCopy>
          <pre className={pre}>
            <span className="text-rl-faint">// mcp.json</span>
            {"\n{ "}
            <span className={green}>"relay"</span>
            {": { "}
            <span className={green}>"command"</span>
            {": "}
            <span className={green}>"npx"</span>
            {", "}
            <span className={green}>"args"</span>
            {": ["}
            <span className={green}>"relay-mcp"</span>
            {"] } }\n\n"}
            <span className="text-rl-faint">&gt;</span>
            {" relay.draft_edition({ since: "}
            <span className={green}>"#13"</span>
            {" })\n"}
            <span className="text-rl-faint">&gt;</span>
            {" relay.approve({ edition: 14, send_at: "}
            <span className={green}>"fri 10:00"</span>
            {" })"}
          </pre>
          <div className="flex flex-wrap gap-1.5 font-rl-mono text-[12.5px]">
            {["MCP", "API", "CLI", "webhooks"].map((item) => (
              <span className={chip} key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SetupRow({
  mark,
  title,
  detail,
  meta,
  className,
  metaClassName = "text-rl-faint",
  titleClassName = "",
  detailClassName = "text-rl-dim",
}: {
  mark: ReactNode;
  title: string;
  detail: string;
  meta: string;
  className: string;
  metaClassName?: string;
  titleClassName?: string;
  detailClassName?: string;
}) {
  return (
    <li
      className={`grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3.5 ${className}`}
    >
      {mark}
      <span className="flex flex-col">
        <strong className={`text-[15px] ${titleClassName}`}>{title}</strong>
        <span className={`font-rl-mono text-[12.5px] ${detailClassName}`}>
          {detail}
        </span>
      </span>
      <span className={`font-rl-pixel text-[11px] uppercase ${metaClassName}`}>
        {meta}
      </span>
    </li>
  );
}

function GetStarted() {
  const circle =
    "box-border grid size-[26px] place-items-center rounded-full font-rl-pixel text-[11px]";

  return (
    <section className="mx-auto flex max-w-[1280px] flex-col gap-11 px-8 pt-[120px] pb-[60px]">
      <div className="rl-reveal flex max-w-[820px] flex-col gap-[18px]">
        <Eyebrow>04 · Começar</Eyebrow>
        <h2 className={`${h2} text-balance`}>
          Três conexões.{" "}
          <span className="font-extrabold">Depois, é com a Relay.</span>
        </h2>
        <p className="m-0 max-w-[560px] text-[18px] text-rl-soft">
          A primeira edição já aparece montada com o histórico recente do repo,
          antes mesmo de você adicionar os inscritos.
        </p>
      </div>
      <div className="rl-reveal flex flex-wrap overflow-hidden rounded-[20px] border border-rl-line bg-rl-card">
        <ol className="rl-stagger m-0 flex flex-[1_1_360px] list-none flex-col gap-2 border-rl-line p-5 md:border-r">
          <SetupRow
            className="bg-rl-raised"
            detail="tinta-app/tinta · main"
            mark={
              <span className="grid size-[26px] place-items-center rounded-full bg-[#16301F]">
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="13"
                  stroke="var(--color-rl-ok)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  width="13"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
            }
            meta="40 s"
            title="Repositório conectado"
          />
          <SetupRow
            className="border-[1.5px] border-rl-accent"
            detail="2 de 3 registros DNS ok"
            mark={
              <span
                className={`${circle} border-2 border-rl-accent text-rl-accent-light`}
              >
                2
              </span>
            }
            meta="agora"
            metaClassName="text-rl-accent-light"
            title="Verificar domínio"
          />
          <SetupRow
            className="border border-rl-edge border-dashed"
            detail="CSV · API · lista colada"
            detailClassName="text-rl-faint"
            mark={
              <span className={`${circle} border border-[#4A4D57] text-rl-dim`}>
                3
              </span>
            }
            meta="1 min"
            title="Adicionar inscritos"
            titleClassName="text-rl-soft"
          />
        </ol>
        <div className="flex flex-[1_1_320px] flex-col gap-3 bg-[#121318] p-5">
          <span className="font-rl-pixel text-[11.5px] text-rl-faint uppercase">
            Sua primeira edição · rascunho
          </span>
          <div className="flex flex-col gap-2.5 rounded-xl bg-white p-5 font-rl-mail text-[#16181D]">
            <div className="flex items-center gap-2">
              <span className="grid size-[22px] place-items-center rounded-md bg-[#3446E0] font-bold font-rl-serif text-white text-[12px]">
                T
              </span>
              <strong className="text-[14px]">Tinta</strong>
            </div>
            <strong className="text-[17px] leading-[1.25]">
              O que mudou na Tinta neste mês
            </strong>
            {[
              "Exporte notas em PDF, com capa",
              "Digite / para inserir qualquer bloco",
              "Suas notas voltam inteiras",
            ].map((item) => (
              <span className="text-[#3A3D44] text-[14px]" key={item}>
                {`→ ${item}`}
              </span>
            ))}
            <span className="text-[#6A6E76] text-[13px]">
              + mais 3 melhorias
            </span>
          </div>
          <span className="text-[13.5px] text-rl-dim">
            Montada com 4 semanas de histórico: 6 novidades, 41 commits internos
            de fora.
          </span>
        </div>
      </div>
    </section>
  );
}

function Questions() {
  return (
    <section
      className={`mx-auto flex max-w-[1280px] flex-col gap-11 px-8 pt-[120px] pb-[100px] ${anchor}`}
      id="perguntas"
    >
      <div className="rl-reveal flex max-w-[820px] flex-col gap-[18px]">
        <Eyebrow>Perguntas</Eyebrow>
        <h2 className={h2}>
          O que perguntam{" "}
          <span className="font-extrabold">antes de entrar.</span>
        </h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-start gap-x-4 gap-y-2.5">
        {FAQ.map(({ q, a }) => (
          <details
            className="rl-faq rounded-[14px] border border-rl-line bg-rl-card"
            key={q}
          >
            <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-4 px-[18px] py-4 font-semibold text-[15.5px] [&::-webkit-details-marker]:hidden">
              {q}
              <span
                aria-hidden="true"
                className="rl-faq-icon flex-none font-rl-mono text-rl-faint"
              >
                +
              </span>
            </summary>
            <p className="m-0 px-[18px] pb-[18px] text-[15px] text-rl-dim leading-[1.55]">
              {a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Closing({ joinedEmail, onJoined }: WaitlistProps) {
  return (
    <section className="px-3 pb-3">
      <div className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-[28px] bg-rl-accent">
        <SkyField />
        <div
          aria-hidden="true"
          className="rl-float absolute top-[60px] left-[6%] drop-shadow-[4px_4px_0_#00000033]"
        >
          <PixelArt cols={16} pixels={MASCOT} size={6} />
        </div>
        <div
          aria-hidden="true"
          className="rl-float absolute right-[8%] bottom-[70px] drop-shadow-[6px_6px_0_#00000033] [animation-delay:.6s] [animation-duration:3.8s]"
        >
          <PixelArt cols={16} pixels={MASCOT} size={9} />
        </div>
        <div className="relative z-2 box-border flex w-full max-w-[900px] flex-col items-center gap-[26px] px-8 py-20 text-center">
          <h2 className="m-0 font-light font-rl-display text-[clamp(44px,6vw,88px)] text-rl-sky-ink leading-[0.96] tracking-[-0.05em] text-balance">
            Guarde um lugar{" "}
            <span className="font-extrabold">para o seu produto.</span>
          </h2>
          <WaitlistForm
            joinedEmail={joinedEmail}
            onJoined={onJoined}
            source="closing"
          />
          {!joinedEmail && (
            <span className="rounded-full bg-white/85 px-3 py-1.5 text-rl-sky-ink text-[14px]">
              Só usamos o email para o convite.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const links = [
    ["#docs", "Docs"],
    ["#api", "API"],
    ["#status", "Status"],
  ];

  return (
    <footer className="border-rl-hairline border-t">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 p-8 text-rl-dim text-[14px]">
        <span className="flex items-center gap-2.5 font-extrabold font-rl-display text-[18px] text-rl-fg tracking-[-0.04em]">
          <Logo size={2} />
          relay
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {SHOW_FOOTER_LINKS &&
            links.map(([href, label]) => (
              <a
                className="rl-link text-rl-dim no-underline hover:text-white"
                href={href}
                key={href}
              >
                {label}
              </a>
            ))}
          <Link
            className="rl-link text-rl-dim no-underline hover:text-white"
            to="/privacidade"
          >
            Privacidade
          </Link>
        </div>
        <span>© 2026 Relay</span>
      </div>
    </footer>
  );
}

type WaitlistProps = {
  joinedEmail: string | null;
  onJoined: (email: string) => void;
};

export function LandingPage() {
  const [joinedEmail, onJoined] = useJoinedEmail();
  const ref = useReveal();

  return (
    <div
      className="rl-landing overflow-x-clip bg-rl-ink font-rl-body text-[17px] text-rl-fg leading-normal antialiased"
      ref={ref}
    >
      <Nav />
      <main>
        <Hero joinedEmail={joinedEmail} onJoined={onJoined} />
        {SHOW_PROOF && <Proof />}
        <HowItWorks />
        <EmailPreview />
        <Product />
        <GetStarted />
        <Questions />
        <Closing joinedEmail={joinedEmail} onJoined={onJoined} />
      </main>
      <Footer />
    </div>
  );
}
