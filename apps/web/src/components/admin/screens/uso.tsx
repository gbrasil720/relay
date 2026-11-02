import { useAdminSubtitle } from "@/components/admin/admin-shell";
import { shortDate } from "@/components/admin/format";
import { PixelArt } from "@/components/landing/pixel-art";
import { GLYPH } from "@/components/landing/pixels";

const DAY_MS = 24 * 60 * 60 * 1000;

/** No credit or usage table exists yet, so the consumption table has only its header. */
function exportCsv() {
  const header = "produto,análises,rascunhos,reescritas,envios,total";
  const link = document.createElement("a");
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${header}`)}`;
  link.download = "uso.csv";
  link.click();
}

export function AdminUso() {
  const subtitle = useAdminSubtitle();
  const now = new Date();
  const firstDay = new Date(now.getTime() - 29 * DAY_MS);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" }).format(now);
  return (
    <main style={{ position: "relative", zIndex: "1", flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", padding: "18px 32px", borderBottom: "1px solid #1B1C22" }}>
        <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "11.5px", textTransform: "uppercase", color: "#868994", display: "inline-flex", alignItems: "center" }}>
          <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
          Uso e créditos
        </span>
        <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
          {subtitle}
        </span>
      </header>
      <div style={{ padding: "32px 32px 140px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontWeight: "300", fontSize: "clamp(32px, 3.4vw, 44px)", lineHeight: "1", letterSpacing: "-0.045em" }}>
              Uso e créditos
            </h1>
            <p style={{ margin: "0", fontSize: "15px", color: "#A3A6B0" }}>
              Quanto a Relay gasta para entregar o que cobra — por cliente, por tipo, por dia.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button onClick={exportCsv} type="button" style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                <path d="M5 3h7l4 4v10H5z" />
                <path d="M12 3v4h4M7.5 11h5M7.5 14h5" />
              </svg>
              Exportar
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 640px", minWidth: "0", display: "flex", flexDirection: "column", gap: "20px", animation: "rl-rise-admin .4s var(--ease-rl-out) .06s both" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))", gap: "12px" }}>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  0
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  créditos consumidos · ciclo
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  —
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  custo real · IA — · envio —
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  US$ 0
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  receita · MRR
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  —
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  margem bruta
                </span>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Para onde vão os créditos
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  {month}
                </span>
              </div>
              <span aria-hidden="true" style={{ display: "flex", gap: "2px", height: "12px" }}>
                <span style={{ background: "#C81E3A", width: "0%" }} />
                <span style={{ background: "#E69AA6", width: "0%" }} />
                <span style={{ background: "#A3A6B0", width: "0%" }} />
                <span style={{ background: "#3A3D46", width: "0%" }} />
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#A3A6B0" }}>
                  <span style={{ width: "6px", height: "6px", background: "#C81E3A", display: "inline-block" }} />
                  {"Rascunhos "}
                  <span style={{ fontFamily: "'Geist Mono'. ui-monospace. monospace", color: "#6E717C" }}>
                    0
                  </span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#A3A6B0" }}>
                  <span style={{ width: "6px", height: "6px", background: "#E69AA6", display: "inline-block" }} />
                  {"Envios "}
                  <span style={{ fontFamily: "'Geist Mono'. ui-monospace. monospace", color: "#6E717C" }}>
                    0
                  </span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#A3A6B0" }}>
                  <span style={{ width: "6px", height: "6px", background: "#A3A6B0", display: "inline-block" }} />
                  {"Análises "}
                  <span style={{ fontFamily: "'Geist Mono'. ui-monospace. monospace", color: "#6E717C" }}>
                    0
                  </span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#A3A6B0" }}>
                  <span style={{ width: "6px", height: "6px", background: "#3A3D46", display: "inline-block" }} />
                  {"Reescritas "}
                  <span style={{ fontFamily: "'Geist Mono'. ui-monospace. monospace", color: "#6E717C" }}>
                    0
                  </span>
                </span>
              </div>
              <span style={{ fontSize: "12.5px", color: "#6E717C" }}>
                Rascunho e reescrita são IA; envio é infra.
              </span>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Consumo por dia · todos os clientes
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(30, minmax(0, 1fr))", gap: "3px", alignItems: "end", height: "64px" }}>
                {Array.from({ length: 30 }, (_, day) => (
                  <span key={day} style={{ height: "0px", background: "#E69AA6" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "11px", color: "#6E717C" }}>
                <span>
                  {shortDate(firstDay)}
                </span>
                <span>
                  picos = sextas de envio
                </span>
                <span>
                  hoje
                </span>
              </div>
            </div>
            <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <h2 style={{ margin: "0", fontSize: "15px", fontWeight: "600", display: "inline-flex", alignItems: "center" }}>
                  <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
                  Quem mais consome
                </h2>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  top 6 · ciclo atual
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0", background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", overflow: "hidden" }}>
                <li style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) 90px 90px 90px 90px 100px", gap: "12px", padding: "10px 18px", borderBottom: "1px solid #24262E", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: "#6E717C", background: "#0C0C0E" }}>
                  <span>
                    produto
                  </span>
                  <span>
                    análises
                  </span>
                  <span>
                    rascunhos
                  </span>
                  <span>
                    reescritas
                  </span>
                  <span>
                    envios
                  </span>
                  <span>
                    total
                  </span>
                </li>
                <li style={{ padding: "11px 18px", borderBottom: "1px solid #1B1C22", fontSize: "12px", color: "#6E717C" }}>
                  Nenhum consumo ainda.
                </li>
              </ul>
            </section>
          </div>
          <aside style={{ flex: "1 1 300px", maxWidth: "340px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px", animation: "rl-rise-admin .4s var(--ease-rl-out) .12s both" }}>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Economia do crédito
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  Cobrado
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  US$ 0,024 / crédito (Indie)
                </span>
                <span>
                  Custo médio
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  Rascunho (50 cr)
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  cobra 1,20 · custa —
                </span>
                <span>
                  Envio (5 cr / 100)
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  cobra 0,12 · custa —
                </span>
                <span>
                  Análise (5 cr)
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  cobra 0,12 · custa —
                </span>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Provedores
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  IA · rascunhos
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  nenhum conectado · —
                </span>
                <span>
                  Envio
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  MillionSend · —
                </span>
                <span>
                  Leituras GitHub
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  Próxima fatura
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Alertas
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0" }}>
                <li style={{ padding: "10px 0", fontSize: "12px", color: "#868994" }}>
                  Nenhum alerta.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
