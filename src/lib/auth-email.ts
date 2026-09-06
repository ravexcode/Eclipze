import "server-only";

import type { AuthCodePurpose } from "@/lib/auth";

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

function getEmailCopy(purpose: AuthCodePurpose, code: string) {
  if (purpose === "EMAIL_VERIFICATION") {
    return {
      subject: "Verify your Eclipse account",
      title: "Verify your email",
      body: "Use this code to finish creating your Eclipse account.",
    };
  }

  return {
    subject: "Your Eclipse sign-in code",
    title: "Confirm your sign-in",
    body: "Use this code to complete your sign-in to Eclipse.",
  };
}

export async function sendAuthCodeEmail(input: {
  to: string;
  code: string;
  purpose: AuthCodePurpose;
}) {
  const config = getResendConfig();
  const copy = getEmailCopy(input.purpose, input.code);

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
      html: `
        <div style="font-family: Inter, Arial, sans-serif; padding: 24px; color: #111827;">
          <p style="font-size: 14px; margin: 0 0 12px;">Eclipse</p>
          <h1 style="font-size: 24px; margin: 0 0 12px;">${copy.title}</h1>
          <p style="font-size: 14px; margin: 0 0 24px; line-height: 1.6;">${copy.body}</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 0 0 24px;">${input.code}</div>
          <p style="font-size: 13px; margin: 0; color: #6b7280;">This code expires in 10 minutes.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Resend request failed with ${response.status}: ${errorText}`);
  }
}
