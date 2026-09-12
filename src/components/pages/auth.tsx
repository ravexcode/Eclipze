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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

export default function AuthPage(
  { type }:
  { type: "in" | "up" }
) {
  const router = useRouter();
  const defaultUser = type === "in"
    ? { email: "", password: "" }
    : { email: "", username: "", password: "", password_confirm: "" };

  const [user, setUser] = useState<UserCredentials>(defaultUser);
  const [step, setStep] = useState<AuthStep>("credentials");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (step === "credentials") {
        if (type === "up" && !acceptedTerms) {
          setError("You must accept the terms and privacy policy to create an account.");
          return;
        }

        const endpoint = type === "in" ? "/api/auth/signin" : "/api/auth/signup";
        const response = await fetch(endpoint, {
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

        setPendingEmail(data.email ?? user.email);
        setStep(data.nextStep ?? "credentials");
        setVerificationCode("");
        setMessage(data.message);
        return;
      }

      const response = await fetch("/api/auth/verify-email", {
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
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/resend-code", {
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

      setMessage(data.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full flex items-center justify-center p-10 min-h-dvh">
      <Link
        className="fixed top-6 left-6 flex gap-1 text-sm items-center justify-center text-center"
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

        <h1 className="font-heading text-2xl mb-2"> {greeting} </h1>

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
                placeholder="eclipse@mail.com"
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
                placeholder="Eclipse"
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
                placeholder="eclipse@mail.com"
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
              <p className="text-sm text-foreground-off text-center mb-2">
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
          <p className="w-full rounded-sm border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
            {errorAction && <Link className="ml-2 underline" href={errorAction.href}>{errorAction.label}</Link>}
          </p>
        }

        {
          message &&
          <p className="w-full rounded-sm border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-foreground">
            {message}
          </p>
        }

        <Button
          type="submit"
          variant="main"
          disabled={isSubmitting}
          className="w-full mt-5 cursor-pointer">
          {isSubmitting ? "Please wait..." : step === "credentials" ? "Continue" : "Verify code"}
        </Button>

        {
          step !== "credentials" &&
          <div className="w-full flex items-center justify-between gap-3 text-sm text-foreground-off">
            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setVerificationCode("");
                setError(null);
                setMessage(null);
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
            className="text-sm text-foreground-off w-full text-center mb-2">
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
            className="w-full inline-flex gap-2 text-sm text-foreground-off justify-center items-center text-center mb-2 cursor-pointer">
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
            className="text-sm text-foreground-off w-full text-center">
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
