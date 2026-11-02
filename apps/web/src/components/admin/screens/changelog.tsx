import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAdminSubtitle } from "@/components/admin/admin-shell";
import { count, shortDate } from "@/components/admin/format";
import { PixelArt } from "@/components/landing/pixel-art";
import { GLYPH, MASCOT } from "@/components/landing/pixels";
import { toast } from "sonner";
import { queryClient, trpc } from "@/utils/trpc";

const TYPES = ["novo", "melhoria", "correção"] as const;

const TYPE_COLOR = {
  novo: "#DC6F81",
  melhoria: "#6BD49A",
  correção: "#E0B341",
};

const STATE = {
  draft: { label: "rascunho", color: "#E0B341" },
  published: { label: "publicado", color: "#6BD49A" },
};

export function AdminChangelog() {
  const subtitle = useAdminSubtitle();
  const list = useQuery(trpc.admin.changelog.list.queryOptions());
  const entries = list.data ?? [];
  const published = entries.filter((entry) => entry.publishedAt).length;
  const [type, setType] = useState<(typeof TYPES)[number]>("novo");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pr, setPr] = useState("");

  const refresh = () =>
    queryClient.invalidateQueries(trpc.admin.changelog.list.queryFilter());
  const create = useMutation(
    trpc.admin.changelog.create.mutationOptions({
      onSuccess: () => {
        setTitle("");
        setBody("");
        setPr("");
        return refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const publish = useMutation(
    trpc.admin.changelog.publish.mutationOptions({
      onSuccess: refresh,
      onError: (error) => toast.error(error.message),
    }),
  );

  const canSave = !!title.trim() && !!body.trim() && !create.isPending;
  const save = (publishNow: boolean) =>
    create.mutate({
      type,
      title,
      body,
      pr: pr ? Number(pr) : undefined,
      publish: publishNow,
    });

  return (
    <main style={{ position: "relative", zIndex: "1", flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", padding: "18px 32px", borderBottom: "1px solid #1B1C22" }}>
        <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "11.5px", textTransform: "uppercase", color: "#868994", display: "inline-flex", alignItems: "center" }}>
          <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
          Changelog
        </span>
        <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
          {subtitle}
          <style>{".rl-changelog-field::placeholder { color: #5A5E68; opacity: 1; }"}</style>
        </span>
      </header>
      <div style={{ padding: "32px 32px 140px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontWeight: "300", fontSize: "clamp(32px, 3.4vw, 44px)", lineHeight: "1", letterSpacing: "-0.045em" }}>
              Changelog
            </h1>
            <p style={{ margin: "0", fontSize: "15px", color: "#A3A6B0" }}>
              O que publicamos — e a edição da Relay que a própria Relay escreve.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button type="button" disabled style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                <path d="M9 4H4v12h12v-5" />
                <path d="M11.5 3H17v5.5M17 3 9.5 10.5" />
              </svg>
              Ver página pública
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 640px", minWidth: "0", display: "flex", flexDirection: "column", gap: "20px", animation: "rl-rise-admin .4s var(--ease-rl-out) .06s both" }}>
            <section style={{ background: "#0F1014", border: "1.5px solid #C81E3A", borderRadius: "18px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 0 80px -40px #C81E3A" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "11px", textTransform: "uppercase", color: "#DC6F81" }}>
                  <span style={{ width: "7px", height: "7px", background: "#C81E3A", animation: "rl-blink 1.2s steps(1) infinite" }} />
                  edição da Relay · nenhuma ainda
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                  — · 0 inscritos
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <h2 style={{ margin: "0", fontFamily: "'Bricolage Grotesque', ui-sans-serif, sans-serif", fontSize: "24px", fontWeight: "700", letterSpacing: "-0.035em", lineHeight: "1.1" }}>
                  —
                </h2>
                <span style={{ fontSize: "14px", color: "#A3A6B0" }}>
                  Nenhuma edição foi gerada ainda.
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <a aria-disabled="true" style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#C81E3A", color: "#FFFFFF", textDecoration: "none", fontWeight: "700", fontSize: "14.5px", minHeight: "44px", padding: "0 18px", borderRadius: "10px" }}>
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#FFFFFF", flex: "none" }}>
                    <path d="m4 10.5 4 4L16.5 6" />
                  </svg>
                  <span style={{ display: "flex", flexDirection: "column", lineHeight: "1.15" }}>
                    Revisar e publicar
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "11.5px", fontWeight: "400", opacity: ".8" }}>
                      sai como changelog + email
                    </span>
                  </span>
                </a>
                <button type="button" disabled style={{ font: "inherit", fontSize: "14px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "42px", padding: "0 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                    <path d="M17 3 3 8.5l6 2.5 2.5 6z" />
                    <path d="M17 3 9 11" />
                  </svg>
                  Enviar teste
                </button>
                <span style={{ marginLeft: "auto", fontSize: "12.5px", color: "#6E717C" }}>
                  a página de Status ainda não existe
                </span>
              </div>
            </section>
            <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <h2 style={{ margin: "0", fontSize: "15px", fontWeight: "600", display: "inline-flex", alignItems: "center" }}>
                  <span style={{ marginRight: "10px" }}><PixelArt cols={4} pixels={GLYPH} size={4} gap={1} /></span>
                  Entradas
                </h2>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12px", color: "#868994" }}>
                  publicadas {count(published)} · rascunhos {count(entries.length - published)}
                </span>
              </div>
              <ul style={{ listStyle: "none", margin: "0", padding: "0", background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", overflow: "hidden" }}>
                <li style={{ display: "grid", gridTemplateColumns: "100px 90px minmax(0, 1fr) 110px 60px 30px", gap: "12px", padding: "10px 18px", borderBottom: "1px solid #24262E", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: "#6E717C", background: "#0C0C0E" }}>
                  <span>
                    data
                  </span>
                  <span>
                    tipo
                  </span>
                  <span>
                    título
                  </span>
                  <span>
                    estado
                  </span>
                  <span>
                    pr
                  </span>
                  <span />
                </li>
                {entries.length === 0 && (
                  <li style={{ padding: "11px 18px", fontSize: "13.5px", color: "#868994" }}>
                    Nenhuma entrada ainda.
                  </li>
                )}
                {entries.map((entry) => {
                  const state = entry.publishedAt ? STATE.published : STATE.draft;
                  return (
                  <li key={entry.id} style={{ display: "grid", gridTemplateColumns: "100px 90px minmax(0, 1fr) 110px 60px 30px", gap: "12px", alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #1B1C22", fontSize: "13.5px" }}>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                        {entry.publishedAt ? shortDate(entry.publishedAt) : "—"}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: TYPE_COLOR[entry.type], whiteSpace: "nowrap" }}>
                        <span style={{ width: "6px", height: "6px", background: TYPE_COLOR[entry.type], display: "inline-block" }} />
                        {entry.type}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ color: "#EEEFF2" }}>
                        {entry.title}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10px", textTransform: "uppercase", color: state.color, whiteSpace: "nowrap" }}>
                        <span style={{ width: "6px", height: "6px", background: state.color, display: "inline-block" }} />
                        {state.label}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#868994" }}>
                        {entry.pr ? `#${entry.pr}` : "—"}
                      </span>
                    </span>
                    <span style={{ minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <button type="button" aria-label="Publicar" title="Publicar" disabled={!!entry.publishedAt || publish.isPending} onClick={() => publish.mutate({ id: entry.id })} style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                          <path d="M3 5.5h14M3 10h14M3 14.5h14" />
                        </svg>
                      </button>
                    </span>
                  </li>
                  );
                })}
              </ul>
            </section>
          </div>
          <aside style={{ flex: "1 1 300px", maxWidth: "340px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px", animation: "rl-rise-admin .4s var(--ease-rl-out) .12s both" }}>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Nova entrada
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10.5px", textTransform: "uppercase", color: "#868994" }}>
                  Tipo
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {TYPES.map((value) => (
                  <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} style={{ font: "inherit", fontSize: "12.5px", padding: "5px 10px", borderRadius: "999px", border: type === value ? "1px solid #C81E3A" : "1px solid #2E3039", color: type === value ? "#EEEFF2" : "#A3A6B0", background: "transparent", cursor: "pointer" }}>
                    {value}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10.5px", textTransform: "uppercase", color: "#868994" }}>
                  Título
                </span>
              </div>
              <input className="rl-changelog-field" aria-label="Título" placeholder="O que mudou, em uma linha" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} style={{ background: "#0C0C0E", border: "1px solid #24262E", borderRadius: "11px", padding: "12px 14px", fontSize: "15px", fontWeight: "400", color: "#EEEFF2", lineHeight: "1.5", minHeight: "48px", boxSizing: "border-box", width: "100%", fontFamily: "inherit" }} />
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10.5px", textTransform: "uppercase", color: "#868994" }}>
                  Texto
                </span>
              </div>
              <textarea className="rl-changelog-field" aria-label="Texto" placeholder="Para quem usa, não para quem codou." maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} style={{ background: "#0C0C0E", border: "1px solid #24262E", borderRadius: "11px", padding: "12px 14px", fontSize: "15px", fontWeight: "400", color: "#EEEFF2", lineHeight: "1.5", minHeight: "96px", boxSizing: "border-box", width: "100%", resize: "none", fontFamily: "inherit" }} />
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontFamily: "'Silkscreen', ui-monospace, monospace", fontSize: "10.5px", textTransform: "uppercase", color: "#868994" }}>
                  PR
                </span>
                <span style={{ fontSize: "12.5px", color: "#6E717C" }}>
                  opcional
                </span>
              </div>
              <input className="rl-changelog-field" aria-label="PR" inputMode="numeric" placeholder="#" value={pr} onChange={(e) => setPr(e.target.value.replace(/\D/g, "").slice(0, 9))} style={{ background: "#0C0C0E", border: "1px solid #24262E", borderRadius: "11px", padding: "12px 14px", fontSize: "15px", fontWeight: "400", color: "#EEEFF2", lineHeight: "1.5", minHeight: "48px", boxSizing: "border-box", width: "100%", fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" disabled={!canSave} onClick={() => save(false)} style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  Salvar rascunho
                </button>
                <button type="button" disabled={!canSave} onClick={() => save(true)} style={{ font: "inherit", fontSize: "13px", color: "#EEEFF2", background: "transparent", border: "1px solid #2E3039", borderRadius: "9px", minHeight: "36px", padding: "0 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" style={{ color: "#EEEFF2", flex: "none" }}>
                    <path d="m4 10.5 4 4L16.5 6" />
                  </svg>
                  Publicar
                </button>
              </div>
            </div>
            <div style={{ background: "#0F1014", border: "1px solid #24262E", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  Assinantes do changelog
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "8px 14px", fontSize: "13px", color: "#868994", alignItems: "center" }}>
                <span>
                  Inscritos
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  0
                </span>
                <span>
                  Última edição
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  Cadência
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
                <span>
                  Fonte
                </span>
                <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: "12.5px", color: "#EEEFF2" }}>
                  —
                </span>
              </div>
              <a aria-disabled="true" style={{ fontSize: "13px", color: "#A3A6B0", textDecoration: "none" }}>
                Ver a página pública →
              </a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "1px dashed #2E3039", borderRadius: "14px" }}>
              <PixelArt cols={16} pixels={MASCOT} size={3} />
              <span style={{ fontSize: "13px", color: "#A3A6B0" }}>
                Sou cliente de mim mesmo: leio o nosso main, rascunho, e vocês aprovam. Se não funcionar para a gente, não funciona para ninguém.
              </span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
