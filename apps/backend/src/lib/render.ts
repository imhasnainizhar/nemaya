/** Tiny {{variable}} interpolation + branded HTML email layout. */

export function interpolate(tpl: string | undefined, vars: Record<string, unknown>): string {
  if (!tpl) return ""
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const v = key.split(".").reduce((acc: any, k: string) => (acc == null ? acc : acc[k]), vars)
    return v === undefined || v === null ? "" : String(v)
  })
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export function renderEmail(
  tpl: { subject: string; heading: string; body: string; cta_label?: string; cta_url?: string },
  vars: Record<string, unknown>
) {
  const subject = interpolate(tpl.subject, vars)
  const heading = interpolate(tpl.heading, vars)
  const body = interpolate(tpl.body, vars)
  const ctaUrl = interpolate(tpl.cta_url, vars)
  const ctaLabel = interpolate(tpl.cta_label, vars)
  const storeUrl = String(vars.store_url ?? "")

  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2A241D">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("")

  const button =
    ctaUrl && ctaLabel
      ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px"><tr><td style="border-radius:999px;background:#2A241D"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;color:#F4EFE6;text-decoration:none;border-radius:999px">${escapeHtml(ctaLabel)}</a></td></tr></table>`
      : ""

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4EFE6;font-family:Inter,Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4EFE6;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px">
<tr><td style="padding:0 8px 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:0.5px;color:#2A241D">nemaya<span style="color:#B5643C">.</span></td></tr>
<tr><td style="background:#FBF8F3;border-radius:24px;padding:40px 32px;border:1px solid #E8E0D2">
<h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:28px;line-height:1.2;color:#2A241D">${escapeHtml(heading)}</h1>
${paragraphs}${button}
</td></tr>
<tr><td style="padding:24px 8px;font-size:12px;line-height:1.6;color:#8A8072">Nemaya · Rooted in comfort.<br/>This is a portfolio demo store — no real orders are fulfilled.${
    storeUrl ? `<br/><a href="${escapeHtml(storeUrl)}/account/notifications" style="color:#8A8072">Notification settings</a>` : ""
  }</td></tr>
</table></td></tr></table></body></html>`

  const text = [heading, "", body, ctaUrl ? `\n${ctaLabel}: ${ctaUrl}` : ""].join("\n")
  return { subject, html, text }
}
