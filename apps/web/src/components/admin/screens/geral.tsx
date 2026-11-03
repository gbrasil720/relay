import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAdminSubtitle } from "@/components/admin/admin-shell";
import { batchDate, clock, headerNow, percent, shortDate } from "@/components/admin/format";
import { PixelArt } from "@/components/landing/pixel-art";
import { GLYPH, MASCOT } from "@/components/landing/pixels";
import { trpc } from "@/utils/trpc";
import { barHeight, download, inviteActions } from "./waitlist";

export function AdminGeral() {
  const subtitle = useAdminSubtitle();
  const navigate = useNavigate();
  const { data: d } = useQuery(trpc.admin.overview.summary.queryOptions());
  const resend = useMutation(trpc.admin.invites.resendExpired.mutationOptions(inviteActions));
  const days = d?.entriesByDay ?? [];
  const peak = Math.max(0, ...days.map((day) => day.count));
  const peakDay = days.find((day) => day.count === peak);
  const entries30 = days.reduce((sum, day) => sum + day.count, 0);
  const rate = d ? percent(d.counts.redeemed, d.counts.invited) : "—";
  const weekLine = d
    ? `Esta semana: ${d.newClients} ${d.newClients === 1 ? "conta nova" : "contas novas"}, ${d.newEntries} ${d.newEntries === 1 ? "entrada" : "entradas"} na waitlist. Taxa de convite: ${rate}.`
    : "";

  function report() {
    if (!d) return;
    download(
      "relay-relatorio-semana.txt",
      [
        `Relay · ${headerNow()}`,
        weekLine,
        `Clientes: ${d.clients}`,
        `Na fila: ${d.counts.queued}`,
        `Convidados: ${d.counts.invited}`,
        `Criaram conta: ${d.counts.redeemed}`,
        `Lote planejado: ${batchDate(d.nextBatchAt)} · ${d.rulesSize}`,
      ].join("\n"),
    );
  }

  return (
    <main style={{ position: "relative", zIndex: "1", flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", padding: "18px 32px", borderBottom: "1px solid #1B1C22" }}>
        <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "11.5px", textTransform: "uppercase", color: "#868994", display: "inline-flex", alignItems: "center" }}>
          <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
          Visão geral
        </span>
        <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
          {subtitle}
        </span>
      </header>
      <div style={{ padding: "32px 32px 140px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontWeight: "300", fontSize: "clamp(32px, 3.4vw, 44px)", lineHeight: "1", letterSpacing: "-0.045em" }}>
              Visão geral
            </h1>
            <p style={{ margin: "0", fontSize: "15px", color: "#A3A6B0" }}>
              O que aconteceu, o que precisa de você, e onde a Relay está no lançamento.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button onClick={report} type="button" style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                <path d="M5 3h7l4 4v10H5z" />
                <path d="M12 3v4h4M7.5 11h5M7.5 14h5" />
              </svg>
              Relatório da semana
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 640px", minWidth: "0", display: "flex", flexDirection: "column", gap: "20px", animation: "rl-rise-admin .4s var(--ease-rl-out) .06s both" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "12px" }}>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  {d?.clients ?? "—"}
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  {"clientes ativos · "}
                  <span style={{ color: "#6BD49A" }}>
                    +{d?.newClients ?? 0}
                  </span>
                  {" esta semana"}
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  US$ 0
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  MRR · 0 Indie · 0 Maker · 0 Studio
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  0
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  edições enviadas · sexta
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  —
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  emails entregues · 30 d
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  {d?.counts.queued ?? "—"}
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  {"na waitlist · lote planejado "}
                  {d ? batchDate(d.nextBatchAt).split(" ")[0] : "—"}
                </span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "600" }}>
                    Entradas na waitlist
                  </span>
                  <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                    30 dias · {entries30}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(30, minmax(0, 1fr))", gap: "3px", alignItems: "end", height: "72px" }}>
                  {days.map((day) => (
                    <span key={String(day.at)} style={{ height: barHeight(day.count, peak, 72), background: "#C81E3A" }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "11px", color: "#6E717C" }}>
                  <span>
                    {days[0] ? shortDate(days[0].at) : "—"}
                  </span>
                  {peak > 0 && peakDay && (
                    <span>
                      ↑ {peak} em {shortDate(peakDay.at)}
                    </span>
                  )}
                  <span>
                    hoje
                  </span>
                </div>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "600" }}>
                    Edições enviadas
                  </span>
                  <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                    30 dias · 0
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(30, minmax(0, 1fr))", gap: "3px", alignItems: "end", height: "72px" }}>
                  {Array.from({ length: 30 }, (_, day) => (
                    <span key={day} style={{ height: "2px", background: "#E69AA6" }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "11px", color: "#6E717C" }}>
                  <span>
                    {days[0] ? shortDate(days[0].at) : "—"}
                  </span>

                  <span>
                    hoje
                  </span>
                </div>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Hoje
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  {headerNow().split(" · ").slice(0, 2).join(" · ")}
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0" }}>
                {d && d.activity.length === 0 && (
                  <li style={{ padding: "9px 0", fontSize: "13.5px", color: "#868994" }}>
                    Nada aconteceu hoje ainda.
                  </li>
                )}
                {d?.activity.map((item) => (
                  <li key={`${item.text}${item.at}`} style={{ display: "grid", gridTemplateColumns: "8px minmax(0, 1fr) auto", gap: "12px", alignItems: "start", padding: "9px 0", borderBottom: "1px solid #1B1C22", fontSize: "13.5px" }}>
                    <span style={{ width: "8px", height: "8px", background: item.color, marginTop: "6px" }} />
                    <span style={{ color: "#BEC1CA" }}>
                      {"strong" in item && (
                        <strong style={{ fontWeight: "600", color: "#EEEFF2" }}>
                          {item.strong}
                        </strong>
                      )}
                      {item.text}
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#6E717C" }}>
                      {clock(item.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <aside style={{ flex: "1 1 300px", maxWidth: "340px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px", animation: "rl-rise-admin .4s var(--ease-rl-out) .12s both" }}>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Precisa de atenção
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  {d?.attention.length ?? 0}
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0" }}>
                {d && d.attention.length === 0 && (
                  <li style={{ padding: "10px 0", fontSize: "13.5px", color: "#868994" }}>
                    Nada por aqui ainda.
                  </li>
                )}
                {d?.attention.map((item) => (
                  <li key={item.title} style={{ display: "grid", gridTemplateColumns: "8px minmax(0, 1fr) auto", gap: "12px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1B1C22" }}>
                    <span style={{ width: "8px", height: "8px", background: "#E0B341" }} />
                    <span style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "0" }}>
                      <span style={{ fontSize: "13.5px" }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: "12px", color: "#868994" }}>
                        {item.detail}
                      </span>
                    </span>
                    {item.action === "reenviar" ? (
                      <a
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (window.confirm(`${item.title}. Reenviar agora?`)) resend.mutate();
                        }}
                        style={{ fontSize: "12.5px", color: "#A3A6B0", textDecoration: "none", whiteSpace: "nowrap" }}
                      >
                        reenviar
                      </a>
                    ) : (
                      <Link to="/admin/convites" style={{ fontSize: "12.5px", color: "#A3A6B0", textDecoration: "none", whiteSpace: "nowrap" }}>
                        ver
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Lançamento
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  Modo
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  waitlist · landing
                </span>
                <span>
                  Lote planejado
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {d ? `${batchDate(d.nextBatchAt)} · ${d.rulesSize}` : "—"}
                </span>
                <span>
                  Taxa convite → conta
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {rate}
                </span>
                <span>
                  Abrir para todos
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
              </div>
              <button onClick={() => navigate({ to: "/admin/convites" })} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                  <path d="M3.5 10h13M11 4.5 16.5 10 11 15.5" />
                </svg>
                Ver plano de abertura
              </button>
            </div>
            {weekLine && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "1px dashed #2E3039", borderRadius: "14px" }}>
                <PixelArt cols={16} pixels={MASCOT} size={3} />
                <span style={{ fontSize: "13px", color: "#A3A6B0" }}>
                  {weekLine}
                </span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
