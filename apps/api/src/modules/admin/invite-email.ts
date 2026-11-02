import { CONTACT_EMAIL } from "../waitlist/email";

const INK = "#16181D";
const BODY = "#2E3138";
const FOOTER = "#8A8D96";
const LINE = "#E8E6E0";
const ACCENT = "#C81E3A";
const ACCENT_PALE = "#E69AA6";
const TITLE_FONT =
  "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif";
const BODY_FONT =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

const strip = Array.from(
  { length: 36 },
  (_, i) =>
    `<td height="5" style="height:5px;line-height:5px;font-size:0;background:${[ACCENT, ACCENT_PALE, LINE][i % 3]}">&nbsp;</td>`,
).join("");

const STEPS = [
  "Conecte o repositório. Só leitura; nunca escrevemos nele.",
  "Verifique o domínio e escolha o tom da marca.",
  "Revise a primeira edição — nada sai sem a sua aprovação.",
];

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function inviteEmail({
  inviteUrl,
  siteUrl,
  validityDays,
  message,
}: {
  inviteUrl: string;
  siteUrl: string;
  validityDays: number;
  /** Written by the admin for a single invite; goes above the body. */
  message?: string;
}) {
  const subject = "Seu convite chegou.";
  const utm =
    "utm_source=email&utm_medium=transactional&utm_campaign=invite";
  const validity = `${validityDays} ${validityDays === 1 ? "dia" : "dias"}`;
  const preheader = `O acesso antecipado abriu para você. O link vale por ${validity}.`;
  const note = message?.trim()
    ? `<p style="margin:18px 0 0;white-space:pre-line">${escapeHtml(message.trim())}</p>`
    : "";
  const steps = STEPS.map(
    (step, i) =>
      `<tr><td width="22" valign="top" style="font-family:ui-monospace,Menlo,monospace;font-size:13px;color:${ACCENT};padding-top:6px">${i + 1}</td><td style="padding-top:6px">${step}</td></tr>`,
  ).join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F3F1EC">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F1EC">
<tr><td align="center" style="padding:14px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:12px">
<tr><td style="padding:28px 30px;font-family:${BODY_FONT};font-size:15px;line-height:1.55;color:${BODY}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${TITLE_FONT};font-weight:800;font-size:19px;letter-spacing:-0.045em;color:${INK}"><img src="${siteUrl}/email-mascot.png" width="32" height="24" alt="" style="vertical-align:-5px;margin-right:10px;border:0">relay</td>
<td align="right" style="font-family:ui-monospace,Menlo,monospace;font-size:10px;text-transform:uppercase;color:#9A9DA6">userelay.site</td>
</tr></table>
<h1 style="margin:18px 0 0;font-family:${TITLE_FONT};font-weight:300;font-size:30px;line-height:1.05;letter-spacing:-0.04em;color:${INK}">${subject}</h1>
${note}
<p style="margin:18px 0 0">Chegou a sua vez. Crie a conta com este link — ele vale por <strong>${validity}</strong> e é só seu.</p>
<p style="margin:18px 0 0"><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:${INK};color:#FFFFFF;font-weight:700;font-size:15px;padding:13px 20px;border-radius:10px;text-decoration:none">Criar minha conta</a></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="2" border="0" style="margin-top:16px"><tr>${strip}</tr></table>
<p style="margin:16px 0 0">O que acontece depois:</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">${steps}</table>
<p style="margin:16px 0 0">O acesso antecipado vem com 500 créditos no primeiro mês, sem cartão.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px"><tr><td style="padding-top:16px;border-top:1px solid ${LINE};font-size:12px;line-height:1.5;color:${FOOTER}">
Você recebe porque estava na lista de espera. O convite é pessoal; se não for usar, responda este email e passamos adiante.<br>
Relay · Brasil · <a href="${siteUrl}/privacidade?${utm}" style="color:${FOOTER}">Privacidade</a> · <a href="mailto:${CONTACT_EMAIL}" style="color:${FOOTER}">Ajuda</a>
</td></tr></table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}
