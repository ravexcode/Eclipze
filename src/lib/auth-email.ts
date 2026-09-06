import "server-only";

import type { AuthCodePurpose } from "@/lib/auth";

const emailTheme = {
  background: "#010101",
  surface: "#060606",
  surfaceRaised: "#111111",
  textPrimary: "#fafafa",
  textSecondary: "#676767",
  accent: "#000bde",
  accentMuted: "#676767",
  statusPurple: "#cb30e0",
  statusCyan: "#00c0e8",
  statusGreen: "#34c759",
  alertRed: "#ff383c",
};

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const noReplyFrom = process.env.AUTH_EMAIL_NO_REPLY_FROM ?? process.env.AUTH_EMAIL_FROM;

  if (!apiKey || !noReplyFrom) {
    throw new Error("Email delivery is not configured. Add RESEND_API_KEY and AUTH_EMAIL_NO_REPLY_FROM to your environment.");
  }

  return {
    apiKey,
    from: noReplyFrom,
    replyTo: process.env.AUTH_EMAIL_REPLY_TO,
  };
}

function getEmailCopy(purpose: AuthCodePurpose) {
  if (purpose === "EMAIL_VERIFICATION") {
    return {
      subject: "Verify your Eclipse account",
      eyebrow: "Account setup",
      title: "Verify your email",
      body: "Use the verification code below to finish creating your Eclipse account and activate access to your workspace.",
      statusLabel: "Email verification pending",
      accentLabel: "Secure activation",
    };
  }

  return {
    subject: "Your Eclipse sign-in code",
    eyebrow: "Secure sign-in",
    title: "Confirm your sign-in",
    body: "Use the verification code below to complete your sign-in. This extra check protects your account with email-based 2FA.",
    statusLabel: "2FA confirmation required",
    accentLabel: "Protected access",
  };
}

function renderMiniGraph() {
  const bars = [
    { height: 18, color: emailTheme.accentMuted },
    { height: 30, color: emailTheme.accent },
    { height: 24, color: emailTheme.accentMuted },
    { height: 42, color: emailTheme.accent },
    { height: 28, color: emailTheme.accentMuted },
    { height: 50, color: emailTheme.accent },
    { height: 38, color: emailTheme.accentMuted },
    { height: 58, color: emailTheme.accent },
    { height: 32, color: emailTheme.accentMuted },
    { height: 46, color: emailTheme.accent },
    { height: 26, color: emailTheme.accentMuted },
    { height: 36, color: emailTheme.accent },
  ];

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
      <tr>
        ${bars.map((bar) => `
          <td valign="bottom" style="padding: 0 3px; height: 64px;">
            <div style="width: 12px; height: ${bar.height}px; border-radius: 3px; background: ${bar.color};"></div>
          </td>
        `).join("")}
      </tr>
    </table>
  `;
}

function renderStatusDots() {
  const dots = [emailTheme.statusPurple, emailTheme.statusCyan, emailTheme.statusGreen];

  return dots.map((color) => `
    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 999px; background: ${color}; margin-right: 8px;"></span>
  `).join("");
}

function renderAuthEmailTemplate(input: {
  title: string;
  eyebrow: string;
  body: string;
  code: string;
  statusLabel: string;
  accentLabel: string;
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${input.title}</title>
      </head>
      <body style="margin: 0; padding: 0; background: ${emailTheme.background}; color: ${emailTheme.textPrimary}; font-family: 'Roboto Flex', Inter, Arial, sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${emailTheme.background}; margin: 0; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 640px;">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${emailTheme.surface}; border: 1px solid ${emailTheme.surfaceRaised}; border-radius: 12px;">
                      <tr>
                        <td style="padding: 18px 22px; border-bottom: 1px solid ${emailTheme.surfaceRaised};">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td align="left">
                                <span style="display: inline-block; font-family: 'Roboto Mono', 'SFMono-Regular', Consolas, monospace; font-size: 12px; letter-spacing: 2px; color: ${emailTheme.textPrimary};">ECLIPSE</span>
                              </td>
                              <td align="right">
                                <span style="display: inline-block; padding: 6px 10px; border-radius: 999px; background: ${emailTheme.surfaceRaised}; color: ${emailTheme.textSecondary}; font-size: 11px;">${input.eyebrow}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 28px 22px 14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <div style="font-size: 12px; color: ${emailTheme.textSecondary}; letter-spacing: 0.4px; margin-bottom: 10px;">${input.statusLabel}</div>
                                <h1 style="margin: 0; font-size: 28px; line-height: 1.2; font-weight: 700; color: ${emailTheme.textPrimary};">${input.title}</h1>
                              </td>
                            </tr>
                            <tr>
                              <td style="font-size: 15px; line-height: 1.7; color: ${emailTheme.textSecondary}; padding-bottom: 22px;">
                                ${input.body}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 0 22px 22px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${emailTheme.surfaceRaised}; border: 1px solid ${emailTheme.accent}; border-radius: 12px;">
                            <tr>
                              <td style="padding: 20px 22px; text-align: center;">
                                <div style="font-size: 12px; color: ${emailTheme.textSecondary}; margin-bottom: 12px;">${input.accentLabel}</div>
                                <div style="font-family: 'Roboto Mono', 'SFMono-Regular', Consolas, monospace; font-size: 36px; line-height: 1; font-weight: 700; letter-spacing: 10px; color: ${emailTheme.textPrimary}; margin-bottom: 14px;">${input.code}</div>
                                <div style="font-size: 12px; color: ${emailTheme.textSecondary};">This code expires in 10 minutes.</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 0 22px 24px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${emailTheme.surfaceRaised}; border-radius: 12px;">
                            <tr>
                              <td style="padding: 20px 18px; text-align: center;">
                                <div style="font-size: 12px; color: ${emailTheme.textSecondary}; margin-bottom: 14px;">Workspace activity signal</div>
                                ${renderMiniGraph()}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 0 22px 22px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="50%" valign="top" style="padding-right: 8px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${emailTheme.surfaceRaised}; border-radius: 12px;">
                                  <tr>
                                    <td style="padding: 16px 18px;">
                                      <div style="font-size: 13px; color: ${emailTheme.textPrimary}; margin-bottom: 8px;">Security</div>
                                      <div style="font-size: 12px; line-height: 1.6; color: ${emailTheme.textSecondary};">
                                        • One-time code<br />
                                        • Expires in 10 minutes<br />
                                        • Ignore this email if you did not request it
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td width="50%" valign="top" style="padding-left: 8px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${emailTheme.surfaceRaised}; border: 1px solid ${emailTheme.alertRed}; border-radius: 12px;">
                                  <tr>
                                    <td style="padding: 16px 18px;">
                                      <div style="font-size: 13px; color: ${emailTheme.textPrimary}; margin-bottom: 8px;">Notice</div>
                                      <div style="font-size: 12px; line-height: 1.6; color: ${emailTheme.textSecondary}; margin-bottom: 10px;">
                                        This mailbox does not receive replies.
                                      </div>
                                      <div style="font-size: 12px; color: ${emailTheme.textPrimary};">
                                        ${renderStatusDots()}<span style="vertical-align: middle;">no-reply channel</span>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 4px 12px 0; text-align: center; font-size: 12px; line-height: 1.7; color: ${emailTheme.textSecondary};">
                    Sent by Eclipse security services.<br />
                    For your safety, never share this code with anyone.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function renderPlainTextEmail(input: {
  title: string;
  body: string;
  code: string;
}) {
  return [
    `ECLIPSE — ${input.title}`,
    "",
    input.body,
    "",
    `Verification code: ${input.code}`,
    "This code expires in 10 minutes.",
    "",
    "This mailbox does not receive replies.",
    "If you did not request this, you can safely ignore this email.",
  ].join("\n");
}

export async function sendAuthCodeEmail(input: {
  to: string;
  code: string;
  purpose: AuthCodePurpose;
}) {
  const config = getResendConfig();
  const copy = getEmailCopy(input.purpose);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      reply_to: config.replyTo,
      subject: copy.subject,
      html: renderAuthEmailTemplate({
        title: copy.title,
        eyebrow: copy.eyebrow,
        body: copy.body,
        code: input.code,
        statusLabel: copy.statusLabel,
        accentLabel: copy.accentLabel,
      }),
      text: renderPlainTextEmail({
        title: copy.title,
        body: copy.body,
        code: input.code,
      }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Resend request failed with ${response.status}: ${errorText}`);
  }
}
