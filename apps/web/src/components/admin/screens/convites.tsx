import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type MouseEvent, useState } from "react";
import { useAdminSubtitle } from "@/components/admin/admin-shell";
import { clock, percent, shortDate } from "@/components/admin/format";
import { PixelArt } from "@/components/landing/pixel-art";
import { GLYPH } from "@/components/landing/pixels";
import { trpc } from "@/utils/trpc";
import { adminActions, batchDay, downloadCsv, inviteActions, previewInvite, rankRange } from "./waitlist";

const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const BATCH_STATUS = {
  planned: { label: "planejado", color: "#DC6F81" },
  open: { label: "em aberto", color: "#E0B341" },
  closed: { label: "fechado", color: "#6E717C" },
};

const ruleInput = { all: "unset", width: "100%", fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2", borderBottom: "1px solid #2E3039" } as const;

/** "Sexta, 31 out" */
function longDate(date: Date | string) {
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" }).format(new Date(date));
  const name = weekday.split("-")[0] ?? weekday;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}, ${shortDate(date)}`;
}

function invites(total: number) {
  return `${total} ${total === 1 ? "convite" : "convites"}`;
}

type Rules = { size: number; weekday: number; time: string; validityDays: number; reminderDay: number };

export function AdminConvites() {
  const subtitle = useAdminSubtitle();
  const navigate = useNavigate();
  const { data: s } = useQuery(trpc.admin.invites.summary.queryOptions());
  const [draft, setDraft] = useState<Rules | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const next = useMutation(trpc.admin.invites.sendNext.mutationOptions(inviteActions));
  const updateRules = useMutation(
    trpc.admin.invites.updateRules.mutationOptions({
      ...adminActions,
      onSuccess: () => {
        setDraft(null);
        adminActions.onSuccess();
      },
    }),
  );
  const sendOne = useMutation(
    trpc.admin.invites.sendOne.mutationOptions({
      ...inviteActions,
      onSuccess: (result) => {
        setEmail("");
        setMessage("");
        inviteActions.onSuccess(result);
      },
    }),
  );
  const r = s?.rules;
  const sent = s?.counts.invited ?? 0;
  const funnel = [
    ["Enviados", sent],
    ["Abriram o email", s?.counts.opened ?? 0],
    ["Criaram conta", s?.counts.redeemed ?? 0],
    ["Conectaram repositório", 0],
    ["Primeira edição enviada", 0],
  ] as const;
  const batches = [
    ...(s
      ? [
          {
            number: (s.batches[0]?.number ?? 0) + 1,
            when: `${longDate(s.next.at)} · ${clock(s.next.at)}`,
            detail: `${invites(s.next.count)} · ${rankRange(s.next.from, s.next.to)} · ${s.next.priorities} ${s.next.priorities === 1 ? "prioridade" : "prioridades"}`,
            sent: "—",
            opened: "—",
            accounts: "—",
            status: BATCH_STATUS.planned,
          },
        ]
      : []),
    ...(s?.batches ?? []).map((batch) => ({
      number: batch.number,
      when: longDate(batch.at),
      detail: `${invites(batch.size)} · ${rankRange(batch.from, batch.to)}`,
      sent: String(batch.size),
      opened: String(batch.opened),
      accounts: `${batch.redeemed} · ${percent(batch.redeemed, batch.size)}`,
      status: BATCH_STATUS[batch.status],
    })),
  ];

  function inviteNext(event: MouseEvent) {
    event.preventDefault();
    if (window.confirm(`Enviar ${invites(s?.next.count ?? 0)} agora?`)) next.mutate();
  }
  function saveRules() {
    if (draft) updateRules.mutate(draft);
    else if (r) setDraft(r);
  }
  function sendSingle(event: MouseEvent) {
    event.preventDefault();
    sendOne.mutate({ email, message: message || undefined });
  }
  const numberRule = (key: "size" | "validityDays" | "reminderDay", label: string) =>
    draft && (
      <input
        aria-label={label}
        min={1}
        onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })}
        style={ruleInput}
        type="number"
        value={draft[key]}
      />
    );

  return (
    <main style={{ position: "relative", zIndex: "1", flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", padding: "18px 32px", borderBottom: "1px solid #1B1C22" }}>
        <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "11.5px", textTransform: "uppercase", color: "#868994", display: "inline-flex", alignItems: "center" }}>
          <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
          Convites
        </span>
        <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
          {subtitle}
        </span>
      </header>
      <div style={{ padding: "32px 32px 140px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontWeight: "300", fontSize: "clamp(32px, 3.4vw, 44px)", lineHeight: "1", letterSpacing: "-0.045em" }}>
              Convites
            </h1>
            <p style={{ margin: "0", fontSize: "15px", color: "#A3A6B0" }}>
              {sent} enviados, {s?.counts.redeemed ?? 0} viraram conta. Lote a lote, sempre enviado à mão, com segunda chance.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button onClick={() => downloadCsv("relay-convites.csv", true).catch(adminActions.onError)} type="button" style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                <path d="M5 3h7l4 4v10H5z" />
                <path d="M12 3v4h4M7.5 11h5M7.5 14h5" />
              </svg>
              Exportar
            </button>
            <a href="#" onClick={inviteNext} style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#C81E3A", color: "#FFFFFF", textDecoration: "none", fontWeight: "700", fontSize: "14.5px", minHeight: "44px", padding: "0 18px", borderRadius: "10px" }}>
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#FFFFFF", flex: "none" }}>
                <path d="M17 3 3 8.5l6 2.5 2.5 6z" />
                <path d="M17 3 9 11" />
              </svg>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: "1.15" }}>
                Convidar próximos {s?.next.count ?? "—"}
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "11.5px", fontWeight: "400", opacity: ".8" }}>
                  {s ? `planejado ${batchDay(s.next.at)}` : "—"}
                </span>
              </span>
            </a>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 640px", minWidth: "0", display: "flex", flexDirection: "column", gap: "20px", animation: "rl-rise-admin .4s var(--ease-rl-out) .06s both" }}>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Funil dos convites
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  {s?.since ? `desde ${shortDate(s.since)}` : "—"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {funnel.map(([label, total]) => (
                  <div key={label} style={{ display: "grid", gridTemplateColumns: "150px minmax(0, 1fr) 60px 60px", gap: "12px", alignItems: "center", fontSize: "13.5px" }}>
                    <span style={{ color: "#BEC1CA" }}>
                      {label}
                    </span>
                    <span aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(40, 1fr)", gap: "2px", height: "14px" }}>
                      {Array.from({ length: 40 }, (_, slot) => (
                        <span key={slot} style={{ background: slot < Math.round((40 * total) / (sent || 1)) ? "#C81E3A" : "#1E2027" }} />
                      ))}
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "13px", textAlign: "right" }}>
                      {total}
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#6E717C", textAlign: "right" }}>
                      {percent(total, sent)}
                    </span>
                  </div>
                ))}
              </div>

            </div>
            <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <h2 style={{ margin: "0", fontSize: "15px", fontWeight: "600", display: "inline-flex", alignItems: "center" }}>
                  <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
                  Lotes
                </h2>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  {batches.length} · {r?.size ?? "—"} por lote
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0", background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", overflow: "hidden" }}>
                <li style={{ display: "grid", gridTemplateColumns: "70px minmax(0, 1fr) 90px 90px 90px 110px 30px", gap: "12px", padding: "10px 18px", borderBottom: "1px solid #24262E", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: "#6E717C", background: "#0C0C0E" }}>
                  <span>
                    lote
                  </span>
                  <span>
                    quando
                  </span>
                  <span>
                    enviados
                  </span>
                  <span>
                    abertos
                  </span>
                  <span>
                    contas
                  </span>
                  <span>
                    status
                  </span>
                  <span />
                </li>
                {batches.map((batch, index) => (
                  <li key={batch.number} style={{ display: "grid", gridTemplateColumns: "70px minmax(0, 1fr) 90px 90px 90px 110px 30px", gap: "12px", alignItems: "center", padding: "11px 18px", borderBottom: index < batches.length - 1 ? "1px solid #1B1C22" : undefined, background: index === 0 ? "#C81E3A24" : undefined, fontSize: "13.5px" }}>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                        #{batch.number}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ display: "flex", flexDirection: "column", lineHeight: "1.3", minWidth: "0" }}>
                        <span style={{ color: "#EEEFF2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {batch.when}
                        </span>
                        <span style={{ fontSize: "12px", color: "#6E717C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {batch.detail}
                        </span>
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                        {batch.sent}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                        {batch.opened}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                        {batch.accounts}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: batch.status.color, whiteSpace: "nowrap" }}>
                        <span style={{ width: "6px", height: "6px", background: batch.status.color, display: "inline-block" }} />
                        {batch.status.label}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <button aria-label="Ver na waitlist" onClick={() => navigate({ to: "/admin/waitlist" })} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                          <path d="M3 5.5h14M3 10h14M3 14.5h14" />
                        </svg>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside style={{ flex: "1 1 300px", maxWidth: "340px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px", animation: "rl-rise-admin .4s var(--ease-rl-out) .12s both" }}>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Regras do lote
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  Tamanho
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {draft ? numberRule("size", "Tamanho do lote") : `${r?.size ?? "—"} por lote`}
                </span>
                <span>
                  Planejado
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {draft ? (
                    <span style={{ display: "flex", gap: "8px" }}>
                      <select aria-label="Dia do lote" onChange={(event) => setDraft({ ...draft, weekday: Number(event.target.value) })} style={ruleInput} value={draft.weekday}>
                        {WEEKDAYS.map((day, index) => (
                          <option key={day} style={{ background: "#0F1014" }} value={index}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <input aria-label="Horário do lote" onChange={(event) => setDraft({ ...draft, time: event.target.value })} style={ruleInput} type="time" value={draft.time} />
                    </span>
                  ) : r ? (
                    `${WEEKDAYS[r.weekday]} · ${r.time}`
                  ) : (
                    "—"
                  )}
                </span>
                <span>
                  Ordem
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  prioridade → chegada
                </span>
                <span>
                  Validade
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {draft ? numberRule("validityDays", "Validade em dias") : `${r?.validityDays ?? "—"} dias`}
                </span>
                <span>
                  Alerta
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {draft ? numberRule("reminderDay", "Dia do lembrete") : `${r?.reminderDay ?? "—"}º dia sem abrir, no painel`}
                </span>
                <span>
                  Expirou
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  volta para a fila com prioridade
                </span>
              </div>
              <span style={{ fontSize: "12.5px", color: "#868994" }}>
                Nada sai sozinho: o lote só é enviado quando você clica em Convidar.
              </span>
              <button onClick={saveRules} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                  <path d="M3 6h14M3 10h14M3 14h14" />
                  <rect x="6" y="4.75" width="2.5" height="2.5" fill="currentColor" stroke="none" />
                  <rect x="11.5" y="8.75" width="2.5" height="2.5" fill="currentColor" stroke="none" />
                  <rect x="8" y="12.75" width="2.5" height="2.5" fill="currentColor" stroke="none" />
                </svg>
                {draft ? "Salvar regras" : "Editar regras"}
              </button>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Convite avulso
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10.5px", textTransform: "uppercase", color: "#868994" }}>
                  Email
                </span>
              </div>
              <style>{".rl-admin-field::placeholder { color: #5A5E68; opacity: 1; }"}</style>
              <input
                aria-label="Email"
                className="rl-admin-field"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alguem@produto.com"
                style={{ font: "inherit", width: "100%", outline: "none", background: "#0C0C0E", border: "1px solid #24262E", borderRadius: "11px", padding: "12px 14px", fontSize: "15px", fontWeight: "400", color: "#EEEFF2", lineHeight: "1.5", minHeight: "48px", boxSizing: "border-box" }}
                type="email"
                value={email}
              />
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10.5px", textTransform: "uppercase", color: "#868994" }}>
                  Mensagem
                </span>
                <span style={{ fontSize: "12.5px", color: "#6E717C" }}>
                  opcional · vai no topo do email
                </span>
              </div>
              <textarea
                aria-label="Mensagem"
                className="rl-admin-field"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Oi! A gente conversou no evento…"
                rows={1}
                style={{ font: "inherit", display: "block", width: "100%", outline: "none", resize: "vertical", background: "#0C0C0E", border: "1px solid #24262E", borderRadius: "11px", padding: "12px 14px", fontSize: "15px", fontWeight: "400", color: "#EEEFF2", lineHeight: "1.5", minHeight: "48px", boxSizing: "border-box" }}
                value={message}
              />
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <a href="#" onClick={sendSingle} style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#C81E3A", color: "#FFFFFF", textDecoration: "none", fontWeight: "700", fontSize: "14.5px", minHeight: "44px", padding: "0 18px", borderRadius: "10px" }}>
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#FFFFFF", flex: "none" }}>
                    <path d="M17 3 3 8.5l6 2.5 2.5 6z" />
                    <path d="M17 3 9 11" />
                  </svg>
                  <span style={{ display: "flex", flexDirection: "column", lineHeight: "1.15" }}>
                    Enviar convite
                  </span>
                </a>
                <span style={{ fontSize: "12px", color: "#6E717C" }}>
                  fura a fila · fica registrado
                </span>
              </div>
            </div>
            <a href="#" onClick={previewInvite} style={{ fontSize: "13px", color: "#A3A6B0", textDecoration: "none", padding: "0 4px" }}>
              {"Email \"Seu convite chegou\" →"}
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}
