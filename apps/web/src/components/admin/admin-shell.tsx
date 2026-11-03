import { useQuery } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { type ReactNode, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { PixelArt, StripField } from "../landing/pixel-art";
import { MASCOT } from "../landing/pixels";
import { batchDate, headerNow } from "./format";
import "./admin.css";

const link = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minHeight: "38px",
  padding: "0 10px",
  borderRadius: "9px",
  textDecoration: "none",
  fontSize: "14px",
} as const;

function NavItem({
  to,
  label,
  count,
  children,
}: {
  to: string;
  label: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Link
      activeOptions={{ exact: true }}
      activeProps={{
        "aria-current": "page",
        style: { ...link, background: "#16181F", color: "#EEEFF2" },
      }}
      inactiveProps={{ style: { ...link, color: "#A3A6B0" } }}
      to={to}
    >
      {children}
      {label}
      {count !== undefined && (
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "'Geist Mono', ui-monospace, monospace",
            fontSize: "11.5px",
            color: "#6E717C",
          }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

/** "sáb · 1 nov · 10:42 · lote planejado: sex 7 nov", shown in every screen header. */
export function useAdminSubtitle() {
  const shell = useQuery(trpc.admin.shell.queryOptions());
  const next = shell.data?.nextBatchAt;
  return `${headerNow()} · lote planejado: ${next ? batchDate(next) : "—"}`;
}

export function AdminShell() {
  const navigate = useNavigate();
  const pathname = useLocation({ select: (l) => l.pathname });
  const firstPath = useRef(pathname);
  const navigated = useRef(false);
  if (pathname !== firstPath.current) navigated.current = true;
  const session = authClient.useSession();
  const shell = useQuery(trpc.admin.shell.queryOptions());
  const name = session.data?.user.name || session.data?.user.email || "—";
  const initial = name.charAt(0).toUpperCase();
  const statusLine = `fila de envio: ${shell.data?.pendingInvites ?? 0} · leituras: 0 ok`;

  function signOut() {
    authClient.signOut({
      fetchOptions: { onSuccess: () => navigate({ to: "/login" }) },
    });
  }

  return (
    <div
      className="rl-admin"
      data-navigated={navigated.current || undefined}
      style={{
        background: "#0C0C0E",
        color: "#EEEFF2",
        fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
        fontSize: "15px",
        lineHeight: "1.5",
        WebkitFontSmoothing: "antialiased",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          height: "4px",
          background:
            "repeating-linear-gradient(90deg, #C81E3A 0 10px, #0C0C0E 10px 20px)",
        }}
      />
      <div
        className="rl-admin-body"
        style={{
          display: "flex",
          flex: "1",
          alignItems: "stretch",
          position: "relative",
        }}
      >
        <StripField className="opacity-50" />
        <nav aria-label="Painel interno" className="rl-admin-nav" style={{ position: "relative", zIndex: "1", flex: "0 0 248px", borderRight: "1px solid #FFFFFF0F", padding: "18px 14px 20px", display: "flex", flexDirection: "column", gap: "20px", boxSizing: "border-box", background: "linear-gradient(180deg, #0E0F13 0%, #0E0F13 72%, #0E0F13B3 100%)" }}>
          <Link to="/admin" aria-label="Relay interno" className="rl-admin-brand" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", padding: "4px 8px", fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontWeight: "800", fontSize: "20px", letterSpacing: "-0.045em" }}>
            <PixelArt cols={16} pixels={MASCOT} size={2} />
            relay
            <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", fontWeight: "400", textTransform: "uppercase", color: "#DC6F81", border: "1px solid #C81E3A66", borderRadius: "5px", padding: "3px 6px", letterSpacing: ".04em", marginLeft: "2px" }}>
              interno
            </span>
          </Link>
          <div className="rl-admin-links" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <NavItem label="Visão geral" to="/admin">
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ flex: "none" }}>
                <path d="M3.5 9.5 10 4l6.5 5.5V16.5h-13z" />
                <rect x="8.75" y="11.5" width="2.5" height="2.5" fill="currentColor" stroke="none" />
              </svg>
</NavItem>
            <NavItem count={shell.data?.queue} label="Waitlist" to="/admin/waitlist">
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ flex: "none" }}>
                <circle cx="8" cy="7" r="2.75" />
                <path d="M3 16.5a5 5 0 0 1 10 0" />
                <path d="M13.5 4.5a2.75 2.75 0 0 1 0 5.5M15 11.5a4.5 4.5 0 0 1 2.5 5" />
              </svg>
</NavItem>
            <NavItem count={shell.data?.invited} label="Convites" to="/admin/convites">
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ flex: "none" }}>
                <path d="M17 3 3 8.5l6 2.5 2.5 6z" />
                <path d="M17 3 9 11" />
              </svg>
</NavItem>
            <NavItem count={shell.data?.clients} label="Clientes" to="/admin/clientes">
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ flex: "none" }}>
                <path d="M3.5 3.5h6l7 7-6 6-7-7z" />
                <rect x="6" y="6" width="2" height="2" fill="currentColor" stroke="none" />
              </svg>
</NavItem>
            <NavItem label="Uso e créditos" to="/admin/uso">
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ flex: "none" }}>
                <path d="M11 3 5 11.5h4.5L9 17l6-8.5h-4.5z" />
              </svg>
</NavItem>
            <NavItem label="Entregabilidade" to="/admin/entrega">
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ flex: "none" }}>
                <path d="M2.5 10h3.5l2-4.5 3 9 2-4.5h4.5" />
              </svg>
</NavItem>
            <NavItem label="Changelog" to="/admin/changelog">
<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ flex: "none" }}>
                <path d="M5 3h7l4 4v10H5z" />
                <path d="M12 3v4h4M7.5 11h5M7.5 14h5" />
              </svg>
</NavItem>
          </div>
          <div className="rl-admin-landing" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: "#6E717C", padding: "0 10px" }}>
              Landing
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "12px", background: "#131419", border: "1px solid #24262E" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px" }}>
                <span style={{ flex: "1" }}>
                  Modo waitlist
                </span>
                <button type="button" role="switch" aria-checked="true" aria-label="Modo waitlist na landing" disabled style={{ width: "34px", height: "20px", borderRadius: "10px", border: "0", background: "#C81E3A", padding: "3px", display: "flex", cursor: "pointer", flex: "none" }}>
                  <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#FFFFFF", marginLeft: "auto" }} />
                </button>
              </label>
              <span style={{ fontSize: "12px", color: "#868994" }}>
                Preços escondidos · formulário de lista no hero e no fim.
              </span>
            </div>
          </div>
          <div className="rl-admin-foot" style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="rl-admin-status" style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "12px", borderRadius: "12px", background: "#0C0C0ECC", border: "1px solid #24262E" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10.5px", textTransform: "uppercase", color: "#6BD49A" }}>
                <span style={{ width: "6px", height: "6px", background: "#6BD49A" }} />
                tudo operando
              </span>
              <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#A3A6B0" }}>
                {statusLine}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", fontSize: "13.5px" }}>
              <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#24262E", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: "600" }}>
                {initial}
              </span>
              <span className="rl-admin-who" style={{ display: "flex", flexDirection: "column", lineHeight: "1.25", flex: "1" }}>
                <span>
                  {name}
                </span>
                <span style={{ fontSize: "12px", color: "#868994" }}>
                  admin · userelay.site
                </span>
              </span>
              <button aria-label="Sair" onClick={signOut} style={{ all: "unset", cursor: "pointer", display: "flex", minWidth: "44px", minHeight: "44px", alignItems: "center", justifyContent: "center" }} type="button">
<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#A3A6B0", flex: "none" }}>
                <path d="M8 3.5H4.5v13H8" />
                <path d="M11 6.5 14.5 10 11 13.5M7.5 10h7" />
              </svg>
</button>
            </div>
          </div>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
