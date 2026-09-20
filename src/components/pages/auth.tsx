"use client";

import { useMemo, useState } from "react";

import type {
  AuthApiResponse,
  AuthCodePurpose,
  AuthStep,
  UserCredentials,
} from "@/types/user";

import Form from "@/components/forms/auth/form";
import Input from "@/components/forms/auth/input";
import Button from "@/components/ui/button";
import { useAnnouncements } from "@/components/announcements/announcement-provider";
import { apiFetch } from "@/utils/api-fetch";
import { invalidateSessionUser } from "@/utils/session";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

export default function AuthPage(
  { type }:
  { type: "in" | "up" }
) {
  const router = useRouter();
  const { announce } = useAnnouncements();
  const defaultUser = type === "in"
    ? { email: "", password: "" }
    : { email: "", username: "", password: "", password_confirm: "" };

  const [user, setUser] = useState<UserCredentials>(defaultUser);
  const [step, setStep] = useState<AuthStep>("credentials");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAction, setErrorAction] = useState<{ href: string; label: string } | null>(null);

  const greeting = useMemo(() => {
    if (step === "verify_email") {
      return "Verify your email";
    }

    return type === "in" ? "Welcome back!" : "Get started!";
  }, [step, type]);

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setErrorAction(null);
    setIsSubmitting(true);

    try {
      if (step === "credentials") {
        if (type === "up" && !acceptedTerms) {
          setError("You must accept the terms and privacy policy to create an account.");
          return;
        }

        const endpoint = type === "in" ? "/api/auth/signin" : "/api/auth/signup";
        const response = await apiFetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        });

        const data = await response.json() as AuthApiResponse;

        if (!response.ok) {
          setError(data.message);
          if (data.actionHref && data.actionLabel) setErrorAction({ href: data.actionHref, label: data.actionLabel });
          return;
        }

        if (type === "in") {
          announce({ message: "Login successful!", variant: "success" });
          invalidateSessionUser();
          router.push(data.redirectTo ?? "/dashboard");
          router.refresh();
          return;
        }

        setPendingEmail(data.email ?? user.email);
        setStep(data.nextStep ?? "credentials");
        setVerificationCode("");
        announce({ message: data.message, variant: "info" });
        return;
      }

      const response = await apiFetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: pendingEmail || user.email,
          code: verificationCode,
        }),
      });

      const data = await response.json() as AuthApiResponse;

      if (!response.ok) {
        setError(data.message);
        return;
      }

      invalidateSessionUser();
      announce({ message: "Email verified. You are now signed in.", variant: "success" });
      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("Please review the form fields and try again.");
  };

  const resendCode = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiFetch("/api/auth/resend-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: pendingEmail || user.email,
          purpose: "EMAIL_VERIFICATION" as AuthCodePurpose,
        }),
      });

      const data = await response.json() as AuthApiResponse;

      if (!response.ok) {
        setError(data.message);
        return;
      }

      announce({ message: data.message, variant: "success" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative flex min-h-dvh w-full items-center justify-center px-5 py-16 sm:px-8">
      <Link
        className="absolute left-5 top-5 flex items-center justify-center gap-1 rounded-xs px-2 py-1 text-xs text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent sm:left-8 sm:top-8"
        href="/">
        <IconArrowLeft
          size={15} />
        <p>
          Go back
        </p>
      </Link>

      <Form
        onSubmit={onSubmit}
        onError={onError}>

        <div className="mb-5 w-full text-center">
          <p className="mb-2 font-heading text-[10px] uppercase tracking-[0.18em] text-foreground-off">
            Eclipze workspace
          </p>
          <h1 className="font-heading text-2xl font-normal tracking-[-0.04em]">{greeting}</h1>
        </div>

        {
          step === "credentials" ? (
            type === "in" ? <>
              <Input
                value={user.email}
                onChange={(e) => {
                  setUser(
                    prev => prev ? {
                      ...prev,
                      email: e.target.value,
                    } : prev,
                  );
                }}
                label="Insert your email"
                type="email"
                placeholder="eclipze@mail.com"
                autoComplete="email"
                required
              />

              <Input
                value={user.password}
                onChange={(e) => {
                  setUser(
                    prev => prev ? {
                      ...prev,
                      password: e.target.value,
                    } : prev,
                  );
                }}
                label="Insert your password"
                type="password"
                placeholder="••••••••••"
                autoComplete="current-password"
                minLength={8}
                required
              />

            </> : <>
              <Input
                value={user.username!}
                onChange={(e) => {
                  setUser(
                    prev => prev ? {
                      ...prev,
                      username: e.target.value,
                    } : prev,
                  );
                }}
                label="Create a username"
                type="text"
                placeholder="Eclipze"
                autoComplete="username"
                minLength={3}
                maxLength={24}
                required
              />

              <Input
                value={user.email}
                onChange={(e) => {
                  setUser(
                    prev => prev ? {
                      ...prev,
                      email: e.target.value,
                    } : prev,
                  );
                }}
                label="Insert your email"
                type="email"
                placeholder="eclipze@mail.com"
                autoComplete="email"
                required
              />

              <Input
                value={user.password}
                onChange={(e) => {
                  setUser(
                    prev => prev ? {
                      ...prev,
                      password: e.target.value,
                    } : prev,
                  );
                }}
                label="Insert your password"
                type="password"
                placeholder="••••••••••"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <Input
                value={user.password_confirm!}
                onChange={(e) => {
                  setUser(
                    prev => prev ? {
                      ...prev,
                      password_confirm: e.target.value,
                    } : prev,
                  );
                }}
                label="Confirm your password"
                type="password"
                placeholder="••••••••••"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </>
          ) : (
            <>
              <p className="mb-2 text-center text-xs leading-5 text-foreground-off">
                {step === "verify_email"
                  ? "Enter the 6-digit code we sent to verify your email address."
                  : "Enter the 6-digit code we sent to finish signing you in."}
                <br />
                <span className="text-foreground">{pendingEmail || user.email}</span>
              </p>

              <Input
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                }}
                label="Verification code"
                type="text"
                placeholder="123456"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </>
          )
        }

        {
          error &&
          <p className="w-full rounded-xs border border-alert-red/40 bg-alert-red/10 px-3 py-2 text-xs leading-5 text-red-200">
            {error}
            {errorAction && <Link className="ml-2 underline" href={errorAction.href}>{errorAction.label}</Link>}
          </p>
        }

        <Button
          type="submit"
          variant="main"
          disabled={isSubmitting}
          className="mt-3 w-full cursor-pointer">
          {isSubmitting ? "Please wait..." : step === "credentials" ? "Continue" : "Verify code"}
        </Button>

        {
          step !== "credentials" &&
          <div className="flex w-full items-center justify-between gap-3 text-xs text-foreground-off">
            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setVerificationCode("");
                setError(null);
              }}
              className="underline hover:text-accent duration-300 cursor-pointer">
              Go back
            </button>

            <button
              type="button"
              onClick={resendCode}
              disabled={isSubmitting}
              className="underline hover:text-accent duration-300 cursor-pointer disabled:opacity-50">
              Resend code
            </button>
          </div>
        }

        {
          step === "credentials" && type === "in" &&
          <Link href="/auth/forgot-password" className="text-sm text-foreground-off underline hover:text-accent duration-300">Forgot your password?</Link>
        }

        {
          step === "credentials" && type === "in" &&
          <p
            className="mb-2 w-full text-center text-xs leading-5 text-foreground-off">
            By signin in you accept our <Link
              href="/legal/tos"
              className="hover:text-accent duration-300 underline">
              Terms of service
            </Link> and <Link
              href="/legal/privacy"
              className="hover:text-accent duration-300 underline">
              Privacy policy
            </Link>
          </p>
        }

        {
          step === "credentials" && type === "up" &&
          <label
            className="mb-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 text-center text-xs text-foreground-off">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="outline-none" />

            <span>
              I accept the <Link
                href="/legal/tos"
                className="hover:text-accent duration-300 underline">
                Terms of service
              </Link> and <Link
                href="/legal/privacy"
                className="hover:text-accent duration-300 underline">
                Privacy policy
              </Link>
            </span>
          </label>
        }

        {
          step === "credentials" &&
          <p
            className="w-full text-center text-xs text-foreground-off">
            { type === "in" ? "Don't have an account?" : "Already have an account?" } <Link
              href={ type === "in" ? "/auth/signup" : "/auth/signin" }
              className="hover:text-accent duration-300 underline">
                {type === "in" ? "Sign up" : "Sign in"}
            </Link>
          </p>
        }
      </Form>
    </div>
  );
}
