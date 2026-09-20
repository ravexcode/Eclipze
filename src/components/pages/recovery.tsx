"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Form from "@/components/forms/auth/form";
import Input from "@/components/forms/auth/input";
import Button from "@/components/ui/button";
import { apiFetch } from "@/utils/api-fetch";

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-[360px]">
        <p className="mb-2 text-center font-heading text-[10px] uppercase tracking-[0.18em] text-foreground-off">
          Eclipze workspace
        </p>
        <h1 className="mb-5 text-center font-heading text-2xl font-normal tracking-[-0.04em]">{title}</h1>
        {children}
        <p className="mt-5 text-center text-xs text-foreground-off">
          <Link className="rounded-xs px-2 py-1 underline transition-colors hover:bg-background-focus hover:text-foreground" href="/auth/signin">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return message ? <p className="w-full rounded-xs border border-alert-red/40 bg-alert-red/10 px-3 py-2 text-xs leading-5 text-red-200">{message}</p> : null;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message); return; }
      setSent(true);
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Forgot your password?">
      {sent ? (
        <p className="text-center text-xs leading-5 text-foreground-off">
          If an eligible account exists, a reset code was sent. {" "}
          <Link className="underline text-foreground" href={`/auth/reset-password?email=${encodeURIComponent(email)}`}>Continue with code</Link>.
        </p>
      ) : (
        <Form onSubmit={submit} onError={(event) => { event.preventDefault(); setError("Please review the form fields and try again."); }}>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} label="Email" type="email" autoComplete="email" required />
          <FormError message={error} />
          <Button type="submit" disabled={busy} className="mt-3 w-full">{busy ? "Please wait..." : "Send reset code"}</Button>
        </Form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await apiFetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password, password_confirm: confirm }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message); return; }
      router.push(data.redirectTo ?? "/auth/signin");
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Reset your password">
      <Form onSubmit={submit} onError={(event) => { event.preventDefault(); setError("Please review the form fields and try again."); }}>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} label="Email" type="email" required />
        <Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} label="6-digit code" type="text" maxLength={6} required />
        <Input value={password} onChange={(event) => setPassword(event.target.value)} label="New password" type="password" minLength={8} required />
        <Input value={confirm} onChange={(event) => setConfirm(event.target.value)} label="Confirm password" type="password" minLength={8} required />
        <FormError message={error} />
        <Button type="submit" disabled={busy} className="mt-3 w-full">{busy ? "Please wait..." : "Reset password"}</Button>
      </Form>
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [code, setCode] = useState("");
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await apiFetch("/api/auth/verify-email", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message); return; }
      router.push(data.redirectTo ?? "/dashboard");
    } finally { setBusy(false); }
  };

  const resend = async () => {
    setBusy(true); setError("");
    try {
      const response = await apiFetch("/api/auth/resend-code", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, purpose: "EMAIL_VERIFICATION" }),
      });
      const data = await response.json(); setMessage(data.message); if (!response.ok) setError(data.message);
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Verify your email">
      <Form onSubmit={submit} onError={(event) => event.preventDefault()}>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} label="Email" type="email" required />
        <Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} label="6-digit code" type="text" maxLength={6} required />
        <FormError message={error} />
        {message && !error && <p className="w-full text-xs leading-5 text-foreground-off">{message}</p>}
        <Button type="submit" disabled={busy} className="mt-3 w-full">{busy ? "Please wait..." : "Verify email"}</Button>
        <button type="button" onClick={resend} disabled={busy} className="mt-2 text-xs text-foreground-off underline transition-colors hover:text-foreground">Resend code</button>
      </Form>
    </AuthShell>
  );
}
