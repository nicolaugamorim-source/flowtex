// Shared HTML shell for every product email — plain inline-styled HTML (no
// React Email/MJML) so there's no extra build step. Light, high-contrast
// palette on purpose: email client dark-mode support is inconsistent, so a
// light card with the brand gold as the one accent renders reliably everywhere.
const BRAND = {
  bg: "#F5F2EE",
  card: "#FFFFFF",
  border: "#D4CFC8",
  ink: "#1A1F28",
  muted: "#7A8190",
  accent: "#C9900A",
};

export function emailLayout(bodyHtml: string, footerNote?: string): string {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:${BRAND.bg};font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;">
            <tr>
              <td style="padding:32px 32px 8px;text-align:center;">
                <span style="display:block;margin-bottom:16px;font-size:28px;font-weight:700;color:${BRAND.accent};letter-spacing:-0.01em;">Flowtex</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;color:${BRAND.ink};font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="max-width:480px;margin:20px auto 0;color:${BRAND.muted};font-size:12px;line-height:1.5;">
            ${footerNote || "Flowtex — the AI that knows your business while you build it."}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:${BRAND.accent};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">${label}</a>`;
}

export const BRAND_COLORS = BRAND;
