import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAdminSubtitle } from "@/components/admin/admin-shell";
import { count, percent, shortDate } from "@/components/admin/format";
import { PixelArt } from "@/components/landing/pixel-art";
import { GLYPH } from "@/components/landing/pixels";
import { trpc } from "@/utils/trpc";

const PAGE_SIZE = 9;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TABS = ["Todos", "Indie", "Maker", "Studio", "Com problema"] as const;
const AVATAR_COLORS = ["#3446E0", "#137A52", "#FF6B2C", "#7C3AED", "#A3264A", "#0E7490", "#B45309", "#4B5563", "#1D4ED8"];

type Client = ReturnType<typeof toClient>;

function toClient(user: { id: string; name: string; email: string; createdAt: string }) {
  const domain = user.email.split("@")[1] ?? "";
  const label = domain.split(".")[0] ?? "";
  const initial = label.charAt(0).toUpperCase();
  return {
    ...user,
    domain,
    initial,
    product: initial + label.slice(1),
    color: AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length] ?? "#4B5563",
  };
}

/** Quoted, with a leading ' on anything a spreadsheet would run as a formula. */
function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

function exportCsv(rows: Client[]) {
  const lines = [
    ["produto", "domínio", "dono", "nome", "desde"],
    ...rows.map((c) => [c.product, c.domain, c.email, c.name, c.createdAt]),
  ].map((row) => row.map(csvCell).join(","));
  const link = document.createElement("a");
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${lines.join("\n")}`)}`;
  link.download = "clientes.csv";
  link.click();
}

export function AdminClientes() {
  const subtitle = useAdminSubtitle();
  const list = useQuery(trpc.admin.clients.list.queryOptions());
  const [tab, setTab] = useState<(typeof TABS)[number]>("Todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const clients = (list.data ?? []).map(toClient);
  const weekAgo = Date.now() - WEEK_MS;
  const joinedThisWeek = clients.filter((c) => new Date(c.createdAt).getTime() >= weekAgo).length;
  const query = search.trim().toLowerCase();
  // No plans or delivery checks exist yet, so every tab but Todos is really empty.
  const matches = tab === "Todos" ? clients.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(query)) : [];
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, matches.length);
  const visible = matches.slice(start, end);
  const emptyMessage = list.isPending
    ? "Carregando…"
    : list.isError
      ? "Não foi possível carregar os clientes."
      : clients.length
        ? "Nenhum cliente neste filtro."
        : "Nenhum cliente ainda.";
  return (
    <main style={{ position: "relative", zIndex: "1", flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", padding: "18px 32px", borderBottom: "1px solid #1B1C22" }}>
        <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "11.5px", textTransform: "uppercase", color: "#868994", display: "inline-flex", alignItems: "center" }}>
          <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
          Clientes
        </span>
        <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
          {subtitle}
        </span>
      </header>
      <div style={{ padding: "32px 32px 140px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontWeight: "300", fontSize: "clamp(32px, 3.4vw, 44px)", lineHeight: "1", letterSpacing: "-0.045em" }}>
              Clientes
            </h1>
            <p style={{ margin: "0", fontSize: "15px", color: "#A3A6B0" }}>
              {count(clients.length)} {clients.length === 1 ? "produto" : "produtos"} usando a Relay. Quem está bem, quem precisa de um empurrão.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button onClick={() => exportCsv(matches)} type="button" style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                <path d="M5 3h7l4 4v10H5z" />
                <path d="M12 3v4h4M7.5 11h5M7.5 14h5" />
              </svg>
              Exportar
            </button>
            <button type="button" disabled style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                <path d="M2.5 10s3-5 7.5-5 7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5z" />
                <rect x="8.75" y="8.75" width="2.5" height="2.5" fill="currentColor" stroke="none" />
              </svg>
              Ver como cliente
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 640px", minWidth: "0", display: "flex", flexDirection: "column", gap: "20px", animation: "rl-rise-admin .4s var(--ease-rl-out) .06s both" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))", gap: "12px" }}>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  {count(clients.length)}
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  {"ativos · "}
                  <span style={{ color: "#6BD49A" }}>
                    +{count(joinedThisWeek)}
                  </span>
                  {" esta semana"}
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  US$ 0
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  MRR · ticket médio —
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  —
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  saíram · 30 dias
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  {percent(0, clients.length)}
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  enviaram nos últimos 14 d
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
              {TABS.map((name) => {
                const active = tab === name;
                return (
                  <button aria-pressed={active} key={name} onClick={() => { setTab(name); setPage(0); }} type="button" style={{ font: "inherit", fontSize: "13px", border: "1px solid", borderRadius: "999px", padding: "6px 12px", cursor: "pointer", display: "inline-flex", gap: "8px", alignItems: "center", background: active ? "#16181F" : "transparent", color: active ? "#EEEFF2" : "#A3A6B0", borderColor: active ? "#2E3039" : "#24262E" }}>
                    {name}
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "11.5px", color: "#6E717C" }}>
                      {count(name === "Todos" ? clients.length : 0)}
                    </span>
                  </button>
                );
              })}
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "8px", background: "#0C0C0E", border: "1px solid #24262E", borderRadius: "9px", padding: "0 12px", minHeight: "36px", fontSize: "13.5px", color: "#5A5E68", minWidth: "220px" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#6E717C", flex: "none" }}>
                  <circle cx="9" cy="9" r="5" />
                  <path d="M12.7 12.7 17 17" />
                </svg>
                <input aria-label="Buscar clientes" className="placeholder:text-[#5A5E68]" onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="produto, domínio ou dono" type="search" value={search} style={{ font: "inherit", color: "#EEEFF2", background: "transparent", border: "0", outline: "0", padding: "0", flex: "1", minWidth: "0" }} />
              </span>
            </div>
            <ul style={{ listStyle: "none", margin: "0", padding: "0", background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", overflow: "hidden" }}>
              <li style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1.4fr) 70px 120px 80px 100px 110px 30px", gap: "12px", padding: "10px 18px", borderBottom: "1px solid #24262E", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: "#6E717C", background: "#0C0C0E" }}>
                <span />
                <span>
                  produto · dono
                </span>
                <span>
                  plano
                </span>
                <span>
                  créditos
                </span>
                <span>
                  inscritos
                </span>
                <span>
                  última ed.
                </span>
                <span>
                  domínio
                </span>
                <span />
              </li>
              {visible.map((client) => (
                <li key={client.id} style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1.4fr) 70px 120px 80px 100px 110px 30px", gap: "12px", alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #1B1C22", fontSize: "13.5px" }}>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ width: "26px", height: "26px", borderRadius: "7px", background: client.color, color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: "700", fontSize: "12px", fontFamily: "Georgia, serif" }}>
                      {client.initial}
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ display: "flex", flexDirection: "column", lineHeight: "1.3", minWidth: "0" }}>
                      <span style={{ color: "#EEEFF2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {client.product} · {client.domain}
                      </span>
                      <span style={{ fontSize: "12px", color: "#6E717C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {client.email} · desde {shortDate(client.createdAt)}
                      </span>
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#BEC1CA" }}>
                      —
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                        —
                      </span>
                      <span aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "2px", height: "4px" }}>
                        <span style={{ background: "#24262E" }} />
                        <span style={{ background: "#24262E" }} />
                        <span style={{ background: "#24262E" }} />
                        <span style={{ background: "#24262E" }} />
                        <span style={{ background: "#24262E" }} />
                        <span style={{ background: "#24262E" }} />
                        <span style={{ background: "#24262E" }} />
                        <span style={{ background: "#24262E" }} />
                        <span style={{ background: "#24262E" }} />
                        <span style={{ background: "#24262E" }} />
                      </span>
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                      0
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                      —
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                      —
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <button type="button" disabled aria-label={`Ações de ${client.product}`} style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                        <path d="M3 5.5h14M3 10h14M3 14.5h14" />
                      </svg>
                    </button>
                  </span>
                </li>
              ))}
              {!visible.length && (
                <li style={{ padding: "11px 18px", borderBottom: "1px solid #1B1C22", fontSize: "12px", color: "#6E717C" }}>
                  {emptyMessage}
                </li>
              )}
            </ul>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", fontSize: "13px", color: "#868994" }}>
              <span>
                {matches.length ? `${count(start + 1)}–${count(end)} de ${count(matches.length)}` : "0 de 0"}
              </span>
              <span style={{ display: "inline-flex", gap: "6px" }}>
                <button disabled={page === 0} onClick={() => setPage(page - 1)} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  Anterior
                </button>
                <button disabled={end >= matches.length} onClick={() => setPage(page + 1)} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  Próxima
                </button>
              </span>
            </div>
          </div>
          <aside style={{ flex: "1 1 300px", maxWidth: "340px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px", animation: "rl-rise-admin .4s var(--ease-rl-out) .12s both" }}>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Por plano
                </span>
              </div>
              <span aria-hidden="true" style={{ display: "flex", gap: "2px", height: "12px" }}>
                <span style={{ background: "#A3A6B0", width: "0%" }} />
                <span style={{ background: "#E69AA6", width: "0%" }} />
                <span style={{ background: "#C81E3A", width: "0%" }} />
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#A3A6B0" }}>
                  <span style={{ width: "6px", height: "6px", background: "#A3A6B0", display: "inline-block" }} />
                  {"Indie "}
                  <span style={{ fontFamily: "'Geist Mono'. ui-monospace. monospace", color: "#6E717C" }}>
                    0
                  </span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#A3A6B0" }}>
                  <span style={{ width: "6px", height: "6px", background: "#E69AA6", display: "inline-block" }} />
                  {"Maker "}
                  <span style={{ fontFamily: "'Geist Mono'. ui-monospace. monospace", color: "#6E717C" }}>
                    0
                  </span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#A3A6B0" }}>
                  <span style={{ width: "6px", height: "6px", background: "#C81E3A", display: "inline-block" }} />
                  {"Studio "}
                  <span style={{ fontFamily: "'Geist Mono'. ui-monospace. monospace", color: "#6E717C" }}>
                    0
                  </span>
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  Indie
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  0 × US$ 12 = US$ 0
                </span>
                <span>
                  Maker
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  0 × US$ 29 = US$ 0
                </span>
                <span>
                  Studio
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  0 × US$ 79 = US$ 0
                </span>
                <span>
                  Acesso antecipado
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Atenção
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  0
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0" }}>
                <li style={{ padding: "10px 0", fontSize: "12px", color: "#868994" }}>
                  Nada pedindo atenção.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
