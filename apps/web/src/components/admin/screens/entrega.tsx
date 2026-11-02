import { useQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { useAdminSubtitle } from "@/components/admin/admin-shell";
import { batchDate, clock, count } from "@/components/admin/format";
import { PixelArt } from "@/components/landing/pixel-art";
import { GLYPH } from "@/components/landing/pixels";
import { trpc } from "@/utils/trpc";

const DAY = 24 * 60 * 60 * 1000;

const PROVIDERS = [
  { key: "gmail", label: "Gmail", color: "#A3A6B0" },
  { key: "outlook", label: "Outlook", color: "#E69AA6" },
  { key: "icloud", label: "iCloud", color: "#3A3D46" },
  { key: "outros", label: "Outros", color: "#24262E" },
] as const;

const BAND: Record<string, string> = {
  excellent: "excelente",
  good: "boa",
  needs_attention: "pede atenção",
  at_risk: "em risco",
};

const GUARDRAIL: Record<string, string> = {
  ok: "envio ok",
  warning: "envio em alerta",
  paused: "envio pausado",
};

/** "99,4%", or "—" when there is nothing to divide by. */
function rate(part: number | undefined, total: number | undefined) {
  if (!total) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format((part ?? 0) / total);
}

function amount(value: number | undefined) {
  return value === undefined ? "—" : count(value);
}

function weekday(date: Date) {
  return batchDate(date).split(" ")[0];
}

function CheckMark({ ok }: { ok: boolean | null | undefined }) {
  if (ok) {
    return (
      <span style={{ color: "#6BD49A" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6BD49A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
    );
  }
  if (ok === false) {
    return (
      <span style={{ color: "#DC6F81" }}>
        ✕
      </span>
    );
  }
  return (
    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
      —
    </span>
  );
}

export function AdminEntrega() {
  const subtitle = useAdminSubtitle();
  const check = useQuery(
    trpc.admin.deliverability.check.queryOptions(undefined, {
      staleTime: 60_000,
    }),
  );
  const data = check.data;
  const stats = data?.stats ?? undefined;
  const records = data?.checks ?? [];
  const passed = (key: string) => records.find((r) => r.key === key)?.ok;
  const failing = records.filter((r) => r.ok !== true);
  const bounceHigh = !!stats?.sent && stats.bounced / stats.sent > 0.02;
  const domainState =
    !data || failing.length > 0
      ? { label: "pendente", color: "#E0B341" }
      : bounceHigh
        ? { label: "bounce alto", color: "#E0B341" }
        : { label: "ok", color: "#6BD49A" };
  const peak = Math.max(1, ...(stats?.days.map((day) => day.delivered) ?? []));
  const days = stats?.days ?? Array.from({ length: 7 }, () => ({ delivered: 0 }));
  const firstDay = weekday(new Date(Date.now() - 6 * DAY));
  const lastDay = weekday(new Date());
  const reputation = data?.reputation;

  return (
    <main style={{ position: "relative", zIndex: "1", flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", padding: "18px 32px", borderBottom: "1px solid #1B1C22" }}>
        <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "11.5px", textTransform: "uppercase", color: "#868994", display: "inline-flex", alignItems: "center" }}>
          <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
          Entregabilidade
        </span>
        <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
          {subtitle}
        </span>
      </header>
      <div style={{ padding: "32px 32px 140px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontWeight: "300", fontSize: "clamp(32px, 3.4vw, 44px)", lineHeight: "1", letterSpacing: "-0.045em" }}>
              Entregabilidade
            </h1>
            <p style={{ margin: "0", fontSize: "15px", color: "#A3A6B0" }}>
              Se o email não chega, nada do resto importa. Reputação, domínios e o que a Relay faz sozinha.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button type="button" disabled={check.isFetching} onClick={() => check.refetch()} style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                <path d="M11 3 5 11.5h4.5L9 17l6-8.5h-4.5z" />
              </svg>
              Checar tudo agora
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 640px", minWidth: "0", display: "flex", flexDirection: "column", gap: "20px", animation: "rl-rise-admin .4s var(--ease-rl-out) .06s both" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))", gap: "12px" }}>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  {rate(stats?.delivered, stats?.sent)}
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  entregues · 7 dias · {amount(stats?.sent)}
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  {rate(stats?.bounced, stats?.sent)}
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  bounces · {amount(stats?.bounced)} em 7 dias
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  {rate(stats?.complained, stats?.sent)}
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  reclamações · {amount(stats?.complained)} em {amount(stats?.sent)}
                </span>
              </div>
              <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
                  {amount(stats?.waiting)}
                </span>
                <span style={{ fontSize: "13px", color: "#868994" }}>
                  fila de envio · {amount(stats?.delayed)} atrasados
                </span>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Entregues × bounces · 7 dias
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "3px", alignItems: "end", height: "64px" }}>
                {days.map((day, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-day window
                  <span key={i} style={{ height: `${Math.round((day.delivered / peak) * 64)}px`, background: "#2E8B57" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "11px", color: "#6E717C" }}>
                <span>
                  {firstDay}
                </span>
                <span>
                  {amount(stats?.bounced)} bounces
                </span>
                <span>
                  {lastDay}
                </span>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Por provedor de email
                </span>
              </div>
              <span aria-hidden="true" style={{ display: "flex", gap: "2px", height: "12px" }}>
                {PROVIDERS.map((p) => (
                  <span key={p.key} style={{ background: p.color, width: stats?.sent ? `${(stats.providers[p.key].sent / stats.sent) * 100}%` : "0%" }} />
                ))}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                {PROVIDERS.map((p) => (
                  <span key={p.key} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#A3A6B0" }}>
                    <span style={{ width: "6px", height: "6px", background: p.color, display: "inline-block" }} />
                    {`${p.label} `}
                    <span style={{ fontFamily: "'Geist Mono'. ui-monospace. monospace", color: "#6E717C" }}>
                      {amount(stats?.providers[p.key].sent)}
                    </span>
                  </span>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                {PROVIDERS.slice(0, 3).map((p) => {
                  const by = stats?.providers[p.key];
                  return (
                    <Fragment key={p.key}>
                      <span>
                        {p.label}
                      </span>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                        {rate(by?.delivered, by?.sent)} · {amount(by?.bounced)} bounces
                      </span>
                    </Fragment>
                  );
                })}
              </div>
            </div>
            <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <h2 style={{ margin: "0", fontSize: "15px", fontWeight: "600", display: "inline-flex", alignItems: "center" }}>
                  <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
                  Domínios dos clientes
                </h2>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  1 · {data ? `checado ${clock(data.checkedAt)}` : "checando"}
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0", background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", overflow: "hidden" }}>
                <li style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) 60px 60px 60px 80px 80px 110px", gap: "12px", padding: "10px 18px", borderBottom: "1px solid #24262E", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: "#6E717C", background: "#0C0C0E" }}>
                  <span>
                    domínio
                  </span>
                  <span>
                    dkim
                  </span>
                  <span>
                    spf
                  </span>
                  <span>
                    dmarc
                  </span>
                  <span>
                    bounce
                  </span>
                  <span>
                    reclam.
                  </span>
                  <span>
                    estado
                  </span>
                </li>
                <li style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) 60px 60px 60px 80px 80px 110px", gap: "12px", alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #1B1C22", fontSize: "13.5px" }}>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ display: "flex", flexDirection: "column", lineHeight: "1.3", minWidth: "0" }}>
                      <span style={{ color: "#EEEFF2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {data?.domain ?? "userelay.site"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#6E717C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        nossos transacionais
                      </span>
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <CheckMark ok={passed("dkim")} />
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <CheckMark ok={passed("spf")} />
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <CheckMark ok={passed("dmarc")} />
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: bounceHigh ? "#DC6F81" : "#868994" }}>
                      {rate(stats?.bounced, stats?.sent)}
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                      {amount(stats?.complained)}
                    </span>
                  </span>
                  <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: domainState.color, whiteSpace: "nowrap" }}>
                      <span style={{ width: "6px", height: "6px", background: domainState.color, display: "inline-block" }} />
                      {domainState.label}
                    </span>
                  </span>
                </li>
              </ul>
            </section>
          </div>
          <aside style={{ flex: "1 1 300px", maxWidth: "340px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px", animation: "rl-rise-admin .4s var(--ease-rl-out) .12s both" }}>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Nossa reputação
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  userelay.site
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {reputation?.band ? `reputação ${BAND[reputation.band] ?? reputation.band} · ${GUARDRAIL[reputation.guardrail] ?? reputation.guardrail}` : "—"}
                </span>
                <span>
                  Blocklists
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  Google Postmaster
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  Aquecimento
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Regras automáticas
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  Bounce duro
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  Bounce suave
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  Reclamação
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  DMARC falhou
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  {"Bounce > 2% numa edição"}
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Agora
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0" }}>
                {failing.length === 0 && (
                  <li style={{ padding: "10px 0", fontSize: "12px", color: "#868994" }}>
                    {check.isError ? "Não deu para checar agora." : data ? "Nada falhando agora." : "Checando…"}
                  </li>
                )}
                {failing.map((record) => (
                  <li key={record.key} style={{ display: "grid", gridTemplateColumns: "8px minmax(0, 1fr) auto", gap: "12px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1B1C22" }}>
                    <span style={{ width: "8px", height: "8px", background: record.ok === false ? "#DC6F81" : "#E0B341" }} />
                    <span style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "0" }}>
                      <span style={{ fontSize: "13.5px" }}>
                        {data?.domain} · {record.label} {record.ok === false ? "falhando" : "sem resposta"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#868994" }}>
                        {record.ok === false ? `registro ${record.name} não encontrado` : "não deu para consultar o DNS agora"}
                      </span>
                    </span>
                    <a href={`https://dns.google/query?name=${record.name}&type=${record.type}`} target="_blank" rel="noreferrer" style={{ fontSize: "12.5px", color: "#A3A6B0", textDecoration: "none", whiteSpace: "nowrap" }}>
                      ver DNS
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
