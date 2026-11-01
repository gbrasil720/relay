import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PixelArt, StripField } from "./pixel-art";
import { GLYPH, MASCOT } from "./pixels";
import { CONTACT_EMAIL, SECTIONS, SUMMARY } from "./privacy-content";

const number = (i: number) => String(i + 1).padStart(2, "0");

function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "0px 0px -85% 0px" },
    );
    for (const { id } of SECTIONS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return active;
}

export function PrivacyPage() {
  const active = useActiveSection();

  return (
    <div className="rl-landing relative flex min-h-screen flex-col overflow-hidden bg-rl-ink font-rl-body text-[15px] text-rl-fg leading-normal antialiased">
      <header className="relative z-1 border-rl-hairline border-b">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center gap-9 px-8">
          <Link
            aria-label="Relay"
            className="flex items-center gap-2.5 font-extrabold font-rl-display text-[20px] text-rl-fg tracking-[-0.045em] no-underline"
            to="/"
          >
            <PixelArt cols={16} pixels={MASCOT} size={2} />
            relay
          </Link>
        </div>
      </header>

      <main className="relative z-1 flex-1">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-9 px-8 pt-14 pb-5">
          <header className="flex max-w-[760px] flex-col gap-3.5">
            <span className="inline-flex items-center gap-2.5 font-rl-pixel text-[11.5px] text-rl-faint uppercase">
              <PixelArt cols={4} gap={1} pixels={GLYPH} size={4} />
              Legal
            </span>
            <h1 className="m-0 font-light font-rl-display text-[52px] leading-none tracking-[-0.045em]">
              Política de <span className="font-extrabold">privacidade.</span>
            </h1>
            <p className="m-0 text-[17px] text-rl-dim leading-[1.55]">
              Escrita para ser lida, não para ser aceita sem ler. O resumo
              abaixo vale como o texto completo; o completo está logo depois.
            </p>
            <span className="font-rl-mono text-[#6E717C] text-[12.5px]">
              versão de 31 out 2026 · vigente
            </span>
          </header>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3">
            {SUMMARY.map(({ title, icon, items }) => (
              <div
                className="flex flex-col gap-3 rounded-2xl border border-rl-line bg-rl-card px-[22px] py-5"
                key={title}
              >
                <span className="grid size-9 place-items-center rounded-[10px] bg-rl-chip">
                  <svg
                    aria-hidden="true"
                    className="flex-none text-rl-fg"
                    fill="none"
                    height="17"
                    stroke="currentColor"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth="1.6"
                    viewBox="0 0 20 20"
                    width="17"
                  >
                    {icon}
                  </svg>
                </span>
                <h2 className="m-0 font-semibold text-[16px]">{title}</h2>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {items.map((item) => (
                    <li
                      className="flex items-start gap-2.5 text-[14px] text-rl-soft leading-normal"
                      key={item}
                    >
                      <span className="mt-[5px] h-[18.5px] flex-none pt-[2.5px]">
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
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 items-start gap-12 pt-3 md:grid-cols-[260px_minmax(0,1fr)]">
            <nav
              aria-label="Seções"
              className="sticky top-5 hidden flex-col gap-0.5 md:flex"
            >
              <span className="px-2.5 pb-2 font-rl-pixel text-[#6E717C] text-[10px] uppercase">
                Nesta política
              </span>
              {SECTIONS.map(({ id, title }, i) => (
                <a
                  className={`block rounded-[7px] px-2.5 py-1.5 text-[13.5px] no-underline hover:text-white ${id === active ? "bg-rl-chip text-rl-fg" : "text-rl-dim"}`}
                  href={`#${id}`}
                  key={id}
                >
                  <span className="mr-2 font-rl-mono text-[#6E717C] text-[11.5px]">
                    {number(i)}
                  </span>
                  {title}
                </a>
              ))}
            </nav>

            <article className="flex max-w-[720px] flex-col gap-2">
              {SECTIONS.map(({ id, title, body }, i) => (
                <section
                  className="flex flex-col gap-2.5 pt-7"
                  id={id}
                  key={id}
                >
                  <h2 className="m-0 flex items-baseline gap-3.5 font-bold font-rl-display text-[24px] tracking-[-0.03em]">
                    <span className="font-normal font-rl-mono text-[13px] text-rl-accent-light">
                      {number(i)}
                    </span>
                    {title}
                  </h2>
                  {body.map((paragraph, p) => (
                    <p
                      className="m-0 text-[15.5px] text-rl-soft leading-[1.65]"
                      // biome-ignore lint/suspicious/noArrayIndexKey: static text
                      key={p}
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
              <div className="mt-9 flex items-center gap-4 rounded-[14px] border border-rl-edge border-dashed px-5 py-[18px]">
                <span className="flex-none">
                  <PixelArt cols={16} pixels={MASCOT} size={3} />
                </span>
                <span className="text-[14px] text-rl-dim">
                  Ficou alguma dúvida? Responda qualquer email nosso ou escreva
                  para{" "}
                  <span className="font-rl-mono text-rl-soft [overflow-wrap:anywhere]">
                    {CONTACT_EMAIL}
                  </span>
                  . Uma pessoa responde.
                </span>
              </div>
            </article>
          </div>
        </div>
      </main>

      <StripField />
      <footer className="relative z-1 mt-[60px] border-rl-hairline border-t">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-7 gap-y-4 px-8 pt-6 pb-16 text-[13px] text-rl-faint">
          <PixelArt cols={16} pixels={MASCOT} size={1.5} />
          <span>© 2026 Relay</span>
          <Link className="text-rl-faint no-underline" to="/privacidade">
            Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}
