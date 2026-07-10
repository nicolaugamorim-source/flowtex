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

// Same family as the site (next/font/google Geist in app/layout.tsx).
// Email clients vary wildly in whether they'll fetch a @font-face — Gmail
// webmail and Apple Mail generally will, Outlook desktop won't — so this is
// a progressive enhancement on top of a system-font stack that already
// looks close to Geist, never a dependency for the email to render correctly.
const FONT_STACK = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

// Email clients can't load a relative path (no page context to resolve
// against) — the logo has to be an absolute URL pointing at the deployed
// site, same base URL templates.ts already uses for CTA links.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const LOGO_URL = `${APP_URL}/logo-email.png`;

export function emailLayout(bodyHtml: string, footerNote?: string): string {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&display=swap" rel="stylesheet" />
    <!--<![endif]-->
  </head>
  <body style="margin:0;padding:32px 16px;background:${BRAND.bg};font-family:${FONT_STACK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;">
            <tr>
              <td style="padding:32px 32px 8px;text-align:center;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                  <tr>
                    <td style="padding-right:12px;vertical-align:middle;">
                      <img src="${LOGO_URL}" alt="" width="72" height="72" style="display:block;width:72px;height:72px;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:26px;font-weight:700;letter-spacing:-0.01em;"><span style="color:#DFAA45;">Flow</span><span style="color:#F0D080;">tex</span></span>
                    </td>
                  </tr>
                </table>
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
          <p style="max-width:480px;margin:8px auto 0;color:${BRAND.muted};font-size:12px;line-height:1.5;">
            This is an automated message — replies to this address aren't monitored. Need help? Contact us at <a href="mailto:support@flowtex.xyz" style="color:${BRAND.muted};text-decoration:underline;">support@flowtex.xyz</a>.
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
