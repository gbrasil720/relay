import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type MouseEvent, useState } from "react";
import { toast } from "sonner";
import { useAdminSubtitle } from "@/components/admin/admin-shell";
import { batchDate, clock, percent, shortDate } from "@/components/admin/format";
import { PixelArt } from "@/components/landing/pixel-art";
import { GLYPH, MASCOT } from "@/components/landing/pixels";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";

const refresh = () =>
  queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() });

/** zod failures reach the client as a JSON list of issues. */
function showError(error: { message: string }) {
  let message = error.message;
  try {
    message = JSON.parse(message)[0].message;
  } catch {}
  toast.error(message);
}

export const adminActions = { onError: showError, onSuccess: refresh };

export const inviteActions = {
  onError: showError,
  onSuccess: ({ sent, failed }: { sent: number; failed: number }) => {
    toast.success(`${sent} ${sent === 1 ? "convite enviado" : "convites enviados"}.`);
    if (failed) toast.error(`${failed} não saíram e voltaram para a fila.`);
    refresh();
  },
};

export function barHeight(value: number, max: number, height: number) {
  return `${Math.max(2, Math.round((height * value) / (max || 1)))}px`;
}

export function download(name: string, text: string, type = "text/plain") {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function downloadCsv(name: string, invitedOnly = false) {
  const rows = await trpcClient.admin.waitlist.export.query();
  // Leading =+-@ would run as a formula in a spreadsheet; referrers and notes aren't trusted.
  const cell = (value: string | number) =>
    `"${String(value).replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"', '""')}"`;
  const lines = rows
    .filter((row) => !invitedOnly || row.invitedDays !== null)
    .map((row) =>
      [row.rank, row.email, row.origin, row.subscribedAt, statusLabel(row), row.priority ? "sim" : "não", row.note ?? ""]
        .map(cell)
        .join(","),
    );
  download(name, ["#,email,origem,entrou,status,prioridade,nota", ...lines].join("\n"), "text/csv");
}

/** Opens the real invite email; the tab comes first so the popup blocker lets it through. */
export async function previewInvite(event: MouseEvent) {
  event.preventDefault();
  const tab = window.open();
  const { html } = await trpcClient.admin.invites.emailPreview.query();
  tab?.document.write(html);
  tab?.document.close();
}

/** "#1 → #25" */
export function rankRange(from: number | null, to: number | null) {
  return from === null ? "—" : `#${from} → #${to}`;
}

/** "sex · 6 nov" */
export function batchDay(date: Date | string) {
  return batchDate(date).replace(" ", " · ");
}

const WEEKDAYS_PLURAL = ["domingos", "segundas", "terças", "quartas", "quintas", "sextas", "sábados"];

const ORIGIN_COLOR: Record<string, string> = {
  "X / post": "#E0B341",
  indicação: "#6BD49A",
  "Product Hunt": "#FF6B2C",
};

const STATUS = {
  queued: { label: "na fila", color: "#A3A6B0" },
  invited: { label: "convidado", color: "#DC6F81" },
  redeemed: { label: "criou conta", color: "#6BD49A" },
  expired: { label: "convite expirou", color: "#E0B341" },
  skipped: { label: "pulado", color: "#6E717C" },
};

function statusLabel(row: { status: keyof typeof STATUS; invitedDays: number | null }) {
  const { label } = STATUS[row.status];
  return row.status === "invited" ? `${label} · ${row.invitedDays} d` : label;
}

const TABS = [
  ["all", "Todos"],
  ["queued", "Na fila"],
  ["invited", "Convidados"],
  ["redeemed", "Criaram conta"],
  ["skipped", "Pulados"],
] as const;

const ORDERS = [
  ["rank", "ordem"],
  ["recent", "recentes"],
  ["priority", "prioridade"],
] as const;

type Tab = (typeof TABS)[number][0];
type Order = (typeof ORDERS)[number][0];

export function AdminWaitlist() {
  const subtitle = useAdminSubtitle();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");
  const [order, setOrder] = useState<Order>("rank");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const ids = [...selected];

  const { data: s } = useQuery(trpc.admin.waitlist.summary.queryOptions());
  const { data: list } = useQuery(
    trpc.admin.waitlist.list.queryOptions(
      { tab, order, q, page },
      { placeholderData: keepPreviousData },
    ),
  );
  const rows = list?.rows ?? [];
  const pageSize = s?.pageSize ?? 11;
  const hasNext = (list?.start ?? 0) + pageSize < (list?.total ?? 0);
  const peak = Math.max(0, ...(s?.lastDays ?? []).map((day) => day.count));
  const nextDay = s ? batchDay(s.next.at) : "—";
  const sourceTotal = s?.counts.all ?? 0;
  const share = (total: number) => `${Math.round((total / (sourceTotal || 1)) * 100)}%`;

  const clearSelection = (event?: MouseEvent) => {
    event?.preventDefault();
    setSelected(new Set());
  };
  const onDone = () => {
    clearSelection();
    refresh();
  };
  const add = useMutation(
    trpc.admin.waitlist.add.mutationOptions({
      onError: showError,
      onSuccess: ({ added }) => {
        toast[added ? "success" : "error"](added ? "Adicionado à fila." : "Esse email já está na lista.");
        refresh();
      },
    }),
  );
  const priority = useMutation(trpc.admin.waitlist.togglePriority.mutationOptions({ ...adminActions, onSuccess: onDone }));
  const skip = useMutation(trpc.admin.waitlist.toggleSkip.mutationOptions({ ...adminActions, onSuccess: onDone }));
  const note = useMutation(trpc.admin.waitlist.setNote.mutationOptions({ ...adminActions, onSuccess: onDone }));
  const invite = useMutation(
    trpc.admin.invites.send.mutationOptions({
      ...inviteActions,
      onSuccess: (result) => {
        clearSelection();
        inviteActions.onSuccess(result);
      },
    }),
  );
  const next = useMutation(trpc.admin.invites.sendNext.mutationOptions(inviteActions));
  const resend = useMutation(trpc.admin.invites.resendExpired.mutationOptions(inviteActions));

  function exportCsv() {
    downloadCsv("relay-waitlist.csv").catch(showError);
  }
  function addByHand() {
    const email = window.prompt("Email para adicionar à fila");
    if (email) add.mutate({ email });
  }
  function editNote() {
    const current = rows.find((row) => selected.has(row.id))?.note ?? "";
    const text = window.prompt("Nota", current);
    if (text !== null) note.mutate({ ids, note: text });
  }
  function inviteNext(event: MouseEvent) {
    event.preventDefault();
    if (window.confirm(`Enviar ${s?.next.count ?? 0} convites agora?`)) next.mutate();
  }
  function resendExpired() {
    if (window.confirm(`Reenviar ${s?.counts.expired ?? 0} convites expirados?`)) resend.mutate();
  }
  function seeNext() {
    setTab("queued");
    setOrder("priority");
    setPage(1);
    setSelected(new Set(s?.next.ids));
  }
  function toggle(id: string) {
    const nextSelected = new Set(selected);
    if (!nextSelected.delete(id)) nextSelected.add(id);
    setSelected(nextSelected);
  }

  return (
    <main style={{ position: "relative", zIndex: "1", flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", padding: "18px 32px", borderBottom: "1px solid #1B1C22" }}>
        <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "11.5px", textTransform: "uppercase", color: "#868994", display: "inline-flex", alignItems: "center" }}>
          <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
          Waitlist
        </span>
        <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
          {subtitle}
        </span>
      </header>
      <div style={{ padding: "32px 32px 140px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontWeight: "300", fontSize: "clamp(32px, 3.4vw, 44px)", lineHeight: "1", letterSpacing: "-0.045em" }}>
              Waitlist
            </h1>
            <p style={{ margin: "0", fontSize: "15px", color: "#A3A6B0" }}>
              {s ? `${s.counts.queued} ${s.counts.queued === 1 ? "pessoa" : "pessoas"} na fila. Convidamos em ordem de chegada, prioridade na frente — ${s.rules.size} por lote, enviado à mão às ${WEEKDAYS_PLURAL[s.rules.weekday]}.` : "—"}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button onClick={exportCsv} type="button" style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                <path d="M5 3h7l4 4v10H5z" />
                <path d="M12 3v4h4M7.5 11h5M7.5 14h5" />
              </svg>
              Exportar CSV
            </button>
            <button onClick={addByHand} type="button" style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                <path d="M10 4v12M4 10h12" />
              </svg>
              Adicionar à mão
            </button>
            <a href="#" onClick={inviteNext} style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#C81E3A", color: "#FFFFFF", textDecoration: "none", fontWeight: "700", fontSize: "14.5px", minHeight: "44px", padding: "0 18px", borderRadius: "10px" }}>
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#FFFFFF", flex: "none" }}>
                <path d="M17 3 3 8.5l6 2.5 2.5 6z" />
                <path d="M17 3 9 11" />
              </svg>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: "1.15" }}>
                Convidar próximos {s?.next.count ?? "—"}
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "11.5px", fontWeight: "400", opacity: ".8" }}>
                  planejado {nextDay}
                </span>
              </span>
            </a>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: "12px", animation: "rl-rise-admin .4s var(--ease-rl-out) both" }}>
          <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
              {s?.counts.queued ?? "—"}
            </span>
            <span style={{ fontSize: "13px", color: "#868994" }}>
              {"na fila · "}
              <span style={{ color: "#6BD49A" }}>
                +{s?.newThisWeek ?? 0}
              </span>
              {" esta semana"}
            </span>
            <span aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: "2px", alignItems: "end", height: "26px", marginTop: "6px" }}>
              {s?.lastDays.map((day, index) => (
                <span key={String(day.at)} style={{ height: barHeight(day.count, peak, 26), background: index === s.lastDays.length - 1 ? "#C81E3A" : "#3A3D46" }} />
              ))}
            </span>
          </div>
          <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
              {s?.counts.invited ?? "—"}
            </span>
            <span style={{ fontSize: "13px", color: "#868994" }}>
              convidados · {s?.counts.notOpened ?? 0} ainda não abriram
            </span>
          </div>
          <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
              {s ? percent(s.counts.redeemed, s.counts.invited) : "—"}
            </span>
            <span style={{ fontSize: "13px", color: "#868994" }}>
              viraram conta · {s?.counts.redeemed ?? 0} de {s?.counts.invited ?? 0}
            </span>
          </div>
          <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.04em" }}>
              {s?.avgWaitDays != null ? `${s.avgWaitDays} d` : "—"}
            </span>
            <span style={{ fontSize: "13px", color: "#868994" }}>
              tempo médio na fila
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
          <section style={{ flex: "999 1 640px", minWidth: "0", display: "flex", flexDirection: "column", gap: "10px", animation: "rl-rise-admin .4s var(--ease-rl-out) .06s both" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
              {TABS.map(([value, label]) => {
                const active = value === tab;
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setTab(value);
                      setPage(1);
                    }}
                    type="button"
                    style={{ font: "inherit", fontSize: "13px", border: "1px solid", borderRadius: "999px", padding: "6px 12px", cursor: "pointer", display: "inline-flex", gap: "8px", alignItems: "center", background: active ? "#16181F" : "transparent", color: active ? "#EEEFF2" : "#A3A6B0", borderColor: active ? "#2E3039" : "#24262E" }}
                  >
                    {label}
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "11.5px", color: "#6E717C" }}>
                      {s?.counts[value] ?? "—"}
                    </span>
                  </button>
                );
              })}
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "8px", background: "#0C0C0E", border: "1px solid #24262E", borderRadius: "9px", padding: "0 12px", minHeight: "36px", fontSize: "13.5px", color: "#5A5E68", minWidth: "220px" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#6E717C", flex: "none" }}>
                  <circle cx="9" cy="9" r="5" />
                  <path d="M12.7 12.7 17 17" />
                </svg>
                <input
                  aria-label="Buscar por email, domínio ou nota"
                  className="rl-admin-q"
                  onChange={(event) => {
                    setQ(event.target.value);
                    setPage(1);
                  }}
                  placeholder="email, domínio ou nota"
                  style={{ all: "unset", flex: "1", minWidth: "0", color: "#EEEFF2" }}
                  value={q}
                />
                <style>{".rl-admin-q::placeholder { color: #5A5E68; opacity: 1; }"}</style>
              </span>
              <span style={{ display: "inline-flex", background: "#0C0C0E", border: "1px solid #24262E", borderRadius: "9px", padding: "2px" }}>
                {ORDERS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setOrder(value);
                      setPage(1);
                    }}
                    type="button"
                    style={{ font: "inherit", border: "0", cursor: "pointer", fontSize: "12.5px", padding: "5px 10px", borderRadius: "6px", background: value === order ? "#1C1E26" : "transparent", color: value === order ? "#EEEFF2" : "#868994" }}
                  >
                    {label}
                  </button>
                ))}
              </span>
            </div>
            {ids.length > 0 && (
            <div className="rl-admin-bar" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px", padding: "10px 14px", background: "#131419", border: "1px solid #C81E3A66", borderRadius: "12px", fontSize: "13.5px" }}>
              <span style={{ fontWeight: "600" }}>
                {ids.length} {ids.length === 1 ? "selecionado" : "selecionados"}
              </span>
              <span style={{ width: "1px", height: "18px", background: "#2E3039" }} />
              <button onClick={() => invite.mutate({ ids })} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                  <path d="M17 3 3 8.5l6 2.5 2.5 6z" />
                  <path d="M17 3 9 11" />
                </svg>
                Convidar agora
              </button>
              <button onClick={() => priority.mutate({ ids })} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                  <path d="M11 3 5 11.5h4.5L9 17l6-8.5h-4.5z" />
                </svg>
                Prioridade
              </button>
              <button onClick={() => skip.mutate({ ids })} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                  <rect x="5.5" y="4.5" width="3" height="11" />
                  <rect x="11.5" y="4.5" width="3" height="11" />
                </svg>
                Pular
              </button>
              <button onClick={editNote} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                  <path d="m4 16 .8-3.6L13.6 3.6l2.8 2.8L7.6 15.2z" />
                  <path d="m11.5 5.7 2.8 2.8" />
                </svg>
                Nota
              </button>
              <a href="#" onClick={clearSelection} style={{ marginLeft: "auto", fontSize: "13px", color: "#A3A6B0", textDecoration: "none" }}>
                limpar seleção
              </a>
            </div>
            )}
            <ul style={{ listStyle: "none", margin: "0", padding: "0", background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", overflow: "hidden" }}>
              <li style={{ display: "grid", gridTemplateColumns: "18px 44px 14px minmax(0, 1fr) 120px 80px 150px 30px", gap: "12px", padding: "10px 18px", borderBottom: "1px solid #24262E", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: "#6E717C", background: "#0C0C0E" }}>
                <span />
                <span>
                  #
                </span>
                <span />
                <span>
                  email · domínio · nota
                </span>
                <span>
                  origem
                </span>
                <span>
                  entrou
                </span>
                <span>
                  status
                </span>
                <span />
              </li>
              {list && rows.length === 0 && (
                <li style={{ padding: "11px 18px", fontSize: "13.5px", color: "#868994" }}>
                  Nada por aqui ainda.
                </li>
              )}
              {rows.map((row, index) => (
              <li key={row.id} style={{ display: "grid", gridTemplateColumns: "18px 44px 14px minmax(0, 1fr) 120px 80px 150px 30px", gap: "12px", alignItems: "center", padding: "11px 18px", borderBottom: index < rows.length - 1 ? "1px solid #1B1C22" : undefined, background: selected.has(row.id) ? "#C81E3A24" : undefined, fontSize: "13.5px" }}>
                {" "}
                <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label={`Selecionar ${row.email}`} style={{ width: "14px", height: "14px", margin: "0", accentColor: "#C81E3A" }} />
                {" "}
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#6E717C" }}>
                  #{row.rank}
                </span>
                {" "}
                {row.priority ? (
                <span title="prioridade" style={{ color: "#DC6F81" }}>
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#C81E3A", flex: "none" }}>
                    <path d="M11 3 5 11.5h4.5L9 17l6-8.5h-4.5z" />
                  </svg>
                </span>
                ) : (
                  <span style={{ width: "13px" }} />
                )}
                {" "}
                <span style={{ display: "flex", flexDirection: "column", minWidth: "0", lineHeight: "1.3" }}>
                  <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "13px", color: "#EEEFF2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.email}
                  </span>
                  <span style={{ fontSize: "12px", color: "#6E717C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.note ? `${row.domain} · ${row.note}` : row.domain}
                  </span>
                </span>
                {" "}
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#A3A6B0" }}>
                  <span style={{ width: "6px", height: "6px", background: ORIGIN_COLOR[row.origin] ?? "#A3A6B0" }} />
                  {row.origin}
                </span>
                {" "}
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                  {shortDate(row.subscribedAt)}
                </span>
                {" "}
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: STATUS[row.status].color, whiteSpace: "nowrap" }}>
                  <span style={{ width: "6px", height: "6px", background: STATUS[row.status].color }} />
                  {statusLabel(row)}
                </span>
                {" "}
                <button onClick={() => setSelected(new Set([row.id]))} type="button" aria-label="Mais" style={{ font: "inherit", width: "28px", height: "28px", borderRadius: "7px", border: "1px solid #2E3039", background: "transparent", display: "grid", placeItems: "center", cursor: "pointer" }}>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#A3A6B0", flex: "none" }}>
                    <path d="M3 5.5h14M3 10h14M3 14.5h14" />
                  </svg>
                </button>
                {" "}
              </li>
              ))}
            </ul>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", fontSize: "13px", color: "#868994" }}>
              <span>
                {rows.length ? `${(list?.start ?? 0) + 1}–${(list?.start ?? 0) + rows.length} de ${list?.total}` : "0 de 0"}
              </span>
              <span style={{ display: "inline-flex", gap: "6px" }}>
                <button disabled={page === 1} onClick={() => setPage(page - 1)} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  Anterior
                </button>
                <button disabled={!hasNext} onClick={() => setPage(page + 1)} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  Próxima
                </button>
              </span>
            </div>
          </section>
          <aside style={{ flex: "1 1 300px", maxWidth: "340px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px", animation: "rl-rise-admin .4s var(--ease-rl-out) .12s both" }}>
            <div style={{ background: "#0F1014", border: "1.5px solid #C81E3A", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 0 80px -40px #C81E3A" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Próximo lote
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: "#DC6F81" }}>
                  {s ? `planejado ${nextDay} · ${clock(s.next.at)}` : "—"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  Tamanho
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {s?.rules.size ?? "—"} convites
                </span>
                <span>
                  Regra
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  prioridade → ordem de chegada
                </span>
                <span>
                  Vai para
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {s ? `${rankRange(s.next.from, s.next.to)} (${s.next.priorities} ${s.next.priorities === 1 ? "prioridade" : "prioridades"})` : "—"}
                </span>
                <span>
                  Validade
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {s ? `${s.rules.validityDays} dias · alerta no ${s.rules.reminderDay}º` : "—"}
                </span>
              </div>
              <span aria-hidden="true" style={{ display: "grid", gridTemplateColumns: `repeat(${s?.rules.size ?? 25}, minmax(0, 1fr))`, gap: "2px", height: "8px" }}>
                {Array.from({ length: s?.rules.size ?? 25 }, (_, slot) => (
                  <span key={slot} style={{ background: slot < (s?.next.priorities ?? 0) ? "#C81E3A" : slot < (s?.next.count ?? 0) ? "#3A3D46" : "#1E2027" }} />
                ))}
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={seeNext} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                    <path d="M2.5 10s3-5 7.5-5 7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5z" />
                    <rect x="8.75" y="8.75" width="2.5" height="2.5" fill="currentColor" stroke="none" />
                  </svg>
                  Ver os {s?.next.count ?? "—"}
                </button>
                <button onClick={() => navigate({ to: "/admin/convites" })} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                    <path d="M3 6h14M3 10h14M3 14h14" />
                    <rect x="6" y="4.75" width="2.5" height="2.5" fill="currentColor" stroke="none" />
                    <rect x="11.5" y="8.75" width="2.5" height="2.5" fill="currentColor" stroke="none" />
                    <rect x="8" y="12.75" width="2.5" height="2.5" fill="currentColor" stroke="none" />
                  </svg>
                  Mudar regra
                </button>
              </div>
              <a href="#" onClick={previewInvite} style={{ fontSize: "12.5px", color: "#A3A6B0", textDecoration: "none" }}>
                {"Email do convite: \"Seu convite chegou.\" →"}
              </a>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Convites em aberto
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  {s?.counts.open ?? 0} de {s?.counts.invited ?? 0}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  Não abriram
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {s?.counts.notOpened ?? 0} · alerta no painel no {s?.rules.reminderDay ?? "—"}º dia
                </span>
                <span>
                  Abriram, não criaram
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  {(s?.counts.open ?? 0) - (s?.counts.notOpened ?? 0)}
                </span>
                <span>
                  Expiraram
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#E0B341" }}>
                  {s?.counts.expired ?? 0} · voltam para a fila com prioridade
                </span>
              </div>
              <button onClick={resendExpired} type="button" style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                  <path d="M17 3 3 8.5l6 2.5 2.5 6z" />
                  <path d="M17 3 9 11" />
                </svg>
                Reenviar os {s?.counts.expired ?? 0} expirados
              </button>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "15px", fontWeight: "600" }}>
                De onde vêm
              </span>
              <span aria-hidden="true" style={{ display: "flex", gap: "2px", height: "10px" }}>
                {s?.sources.map((source) => (
                  <span key={source.label} style={{ background: ORIGIN_COLOR[source.label] ?? "#A3A6B0", width: share(source.total) }} />
                ))}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: "12.5px", color: "#A3A6B0" }}>
                {s?.sources.length === 0 && (
                  <span style={{ color: "#868994" }}>
                    Nada por aqui ainda.
                  </span>
                )}
                {s?.sources.map((source) => (
                  <span key={source.label} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "7px", height: "7px", background: ORIGIN_COLOR[source.label] ?? "#A3A6B0" }} />
                    {`${source.label} `}
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", color: "#6E717C" }}>
                      {share(source.total)}
                    </span>
                  </span>
                ))}
              </div>
              <span style={{ fontSize: "12.5px", color: "#6E717C" }}>
                UTM e referrer do formulário; indicação = link pessoal de um cliente.
              </span>
            </div>
            {s && s.counts.queued > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "1px dashed #2E3039", borderRadius: "14px" }}>
                <PixelArt cols={16} pixels={MASCOT} size={3} />
                <span style={{ fontSize: "13px", color: "#A3A6B0" }}>
                  {s.ownDomain} de {s.counts.queued} na fila têm domínio próprio.
                </span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
