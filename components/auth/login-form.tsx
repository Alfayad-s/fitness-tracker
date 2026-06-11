"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { OtpInput } from "@/components/auth/otp-input";
import { signInWithOAuthProvider } from "@/lib/auth/oauth";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";
import {
  type LoginEmailValues,
  type LoginOtpValues,
  loginEmailSchema,
  loginOtpSchema,
} from "@/types/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  next?: string;
  /** Light text + glass-friendly styles for video login background */
  overlay?: boolean;
};

type LoginStep = "email" | "otp";
type LoadingProvider = "email" | "otp" | "google" | "apple" | null;

const RESEND_COOLDOWN_SEC = 60;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function LoginForm({ next, overlay = false }: LoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState<LoadingProvider>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const emailForm = useForm<LoginEmailValues>({
    resolver: zodResolver(loginEmailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<LoginOtpValues>({
    resolver: zodResolver(loginOtpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function sendEmailOtp(email: string, showSentMessage = true) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (showSentMessage) {
      setFeedback({
        type: "success",
        message: `We sent a 6-digit code to ${email}.`,
      });
    }
  }

  async function onEmailSubmit({ email }: LoginEmailValues) {
    setLoading("email");
    setFeedback(null);

    try {
      await sendEmailOtp(email);
      setPendingEmail(email);
      setStep("otp");
      otpForm.reset({ otp: "" });
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Could not send the code.",
      });
    } finally {
      setLoading(null);
    }
  }

  async function onOtpSubmit({ otp }: LoginOtpValues) {
    setLoading("otp");
    setFeedback(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: otp,
      type: "email",
    });

    setLoading(null);

    if (error) {
      setFeedback({
        type: "error",
        message:
          error.message === "Token has expired or is invalid"
            ? "Invalid or expired code. Try again or request a new one."
            : error.message,
      });
      return;
    }

    router.push(sanitizeNextPath(next));
    router.refresh();
  }

  async function handleResendCode() {
    if (resendCooldown > 0 || !pendingEmail) return;

    setLoading("email");
    setFeedback(null);

    try {
      await sendEmailOtp(pendingEmail, false);
      setFeedback({
        type: "success",
        message: "A new code has been sent.",
      });
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Could not resend the code.",
      });
    } finally {
      setLoading(null);
    }
  }

  function handleChangeEmail() {
    setStep("email");
    setPendingEmail("");
    setFeedback(null);
    otpForm.reset({ otp: "" });
    setResendCooldown(0);
  }

  async function handleOAuth(provider: "google" | "apple") {
    setLoading(provider);
    setFeedback(null);

    try {
      await signInWithOAuthProvider(provider, next);
    } catch (error) {
      setLoading(null);
      const message =
        error instanceof Error
          ? error.message
          : "Could not start sign-in. Try again.";
      setFeedback({ type: "error", message });
    }
  }

  const actionButtonClass =
    "h-14 min-h-14 w-full gap-3 rounded-xl px-4 text-base font-semibold [&_svg]:size-6";

  const labelClass = overlay ? "text-base font-medium text-white" : "text-base font-medium";
  const mutedClass = overlay ? "text-white/70" : "text-muted-foreground";
  const foregroundClass = overlay ? "text-white" : "text-foreground";
  const dividerBg = overlay ? "bg-black/40" : "bg-background";
  const oauthOutlineClass = overlay
    ? "border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"
    : undefined;

  const busy = loading !== null;

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          role="alert"
          className={
            feedback.type === "success"
              ? overlay
                ? "rounded-xl border border-emerald-400/40 bg-emerald-950/50 px-4 py-3.5 text-center text-base leading-snug text-emerald-100"
                : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-center text-base leading-snug text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
              : overlay
                ? "rounded-xl border border-red-400/40 bg-red-950/50 px-4 py-3.5 text-center text-base leading-snug text-red-100"
                : "rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-center text-base leading-snug text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          }
        >
          {feedback.message}
        </p>
      )}

      {step === "email" ? (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
          <div className="space-y-2.5">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <Input
              id="email"
              size="lg"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(emailForm.formState.errors.email)}
              disabled={busy}
              className={
                overlay
                  ? "border-white/20 bg-white/10 text-white placeholder:text-white/45"
                  : undefined
              }
              {...emailForm.register("email")}
            />
            {emailForm.formState.errors.email && (
              <p className="text-base text-destructive">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className={actionButtonClass} disabled={busy}>
            {loading === "email" ? (
              <>
                <Loader2 className="size-6 animate-spin" />
                Sending code…
              </>
            ) : (
              "Continue with Email"
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <p className={`text-base font-medium ${foregroundClass}`}>
              Enter verification code
            </p>
            <p className={`text-sm ${mutedClass}`}>
              Sent to{" "}
              <span className={`font-medium ${foregroundClass}`}>
                {pendingEmail}
              </span>
            </p>
            <button
              type="button"
              onClick={handleChangeEmail}
              disabled={busy}
              className={`text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50 ${overlay ? "text-white" : "text-primary"}`}
            >
              Use a different email
            </button>
          </div>

          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
            <div className="space-y-2.5">
              <label htmlFor="otp" className="sr-only">
                6-digit verification code
              </label>
              <OtpInput
                id="otp"
                value={otpForm.watch("otp")}
                onChange={(value) =>
                  otpForm.setValue("otp", value, { shouldValidate: true })
                }
                disabled={busy}
                aria-invalid={Boolean(otpForm.formState.errors.otp)}
                className={
                  overlay
                    ? "border-white/20 bg-white/10 text-white placeholder:text-white/35"
                    : undefined
                }
              />
              {otpForm.formState.errors.otp && (
                <p className="text-center text-base text-destructive">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className={actionButtonClass}
              disabled={busy || otpForm.watch("otp").length < 6}
            >
              {loading === "otp" ? (
                <>
                  <Loader2 className="size-6 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify & sign in"
              )}
            </Button>
          </form>

          <p className={`text-center text-sm ${mutedClass}`}>
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={busy || resendCooldown > 0}
              className={`font-medium underline-offset-4 hover:underline disabled:opacity-50 ${overlay ? "text-white" : "text-primary"}`}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
            </button>
          </p>
        </div>
      )}

      {step === "email" && (
        <>
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span
                className={`w-full border-t ${overlay ? "border-white/20" : "border-border"}`}
              />
            </div>
            <div className="relative flex justify-center text-sm uppercase tracking-wide">
              <span className={`${dividerBg} px-3 ${mutedClass}`}>or</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              className={overlay ? `${actionButtonClass} ${oauthOutlineClass}` : actionButtonClass}
              disabled={busy}
              onClick={() => handleOAuth("google")}
            >
              {loading === "google" ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <GoogleIcon className="size-6 shrink-0" />
              )}
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className={overlay ? `${actionButtonClass} ${oauthOutlineClass}` : actionButtonClass}
              disabled={busy}
              onClick={() => handleOAuth("apple")}
            >
              {loading === "apple" ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <AppleIcon className="size-6 shrink-0" />
              )}
              Continue with Apple
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
