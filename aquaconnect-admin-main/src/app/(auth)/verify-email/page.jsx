"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  resendVerificationOtp,
  verifyEmailOtp,
} from "@/features/auth/services/auth.service";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: initialEmail,
      otp: "",
    },
  });

  const emailValue = watch("email");

  useEffect(() => {
    if (!initialEmail) {
      return;
    }

    setValue("email", initialEmail, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [initialEmail, setValue]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const onSubmit = async (values) => {
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await verifyEmailOtp({
        email: values.email,
        otp: values.otp,
      });

      setStatus({
        type: "success",
        message: "Email verified.",
      });

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          window.location.href = "/login?verified=1";
        }, 1200);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Verification failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (cooldownSeconds > 0) {
      return;
    }

    if (!emailValue) {
      setStatus({
        type: "error",
        message: "Enter your email first.",
      });
      return;
    }

    setResending(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await resendVerificationOtp({ email: emailValue });
      const nextCooldown = Number(response?.cooldownSeconds || 0);
      if (nextCooldown > 0) {
        setCooldownSeconds(nextCooldown);
      }
      setStatus({
        type: "success",
        message: response?.message || "OTP sent to your email.",
      });
    } catch (error) {
      const retryAfter = Number(error?.payload?.retryAfterSeconds || 0);
      if (retryAfter > 0) {
        setCooldownSeconds(retryAfter);
      }
      setStatus({
        type: "error",
        message: error?.message || "Unable to resend OTP",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020f1a] text-[#e8f4f0] flex items-center justify-center px-4 py-6 sm:p-8">
      <div className="w-full max-w-md bg-[#05141f] border border-[rgba(29,158,117,0.12)] rounded-2xl p-5 sm:p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h1 className="font-syne text-2xl font-extrabold tracking-tight mb-2">
          Verify Email
        </h1>
        <p className="text-sm text-[rgba(232,244,240,0.45)] mb-6">
          Enter the OTP sent to your email address to complete sign-in.
        </p>

        {status.message ? (
          <p
            className={`mb-4 text-xs rounded-lg px-3 py-2 border ${
              status.type === "success"
                ? "text-[#9be5c9] bg-[rgba(29,158,117,0.12)] border-[rgba(29,158,117,0.35)]"
                : "text-[#f09595] bg-[rgba(240,149,149,0.1)] border-[rgba(240,149,149,0.35)]"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="hidden"
              {...register("email", {
                required: "Email is required.",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Enter a valid email.",
                },
              })}
            />
            <label className="block text-xs text-[rgba(232,244,240,0.5)] mb-2">
              Registered email
            </label>
            <div className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.12)] rounded-xl px-4 py-3 text-sm text-[#e8f4f0] break-all">
              {initialEmail || "No email was provided."}
            </div>
            {errors.email ? (
              <p className="text-xs text-[#f09595] mt-1">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs text-[rgba(232,244,240,0.5)] mb-2">
              OTP code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              {...register("otp", {
                required: "OTP is required.",
                minLength: {
                  value: 6,
                  message: "OTP must be 6 digits.",
                },
              })}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.12)] rounded-xl px-4 py-3 text-sm tracking-widest outline-none focus:border-[rgba(29,158,117,0.5)]"
            />
            {errors.otp ? (
              <p className="text-xs text-[#f09595] mt-1">
                {errors.otp.message}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <button
          type="button"
          onClick={onResend}
          disabled={resending || cooldownSeconds > 0}
          className="w-full mt-3 border border-[rgba(29,158,117,0.22)] text-[#1D9E75] rounded-xl py-3 text-sm hover:border-[rgba(29,158,117,0.45)] hover:text-[#5DCAA5] transition-all disabled:opacity-60"
        >
          {resending
            ? "Sending..."
            : cooldownSeconds > 0
              ? `Resend OTP in ${cooldownSeconds}s`
              : "Resend OTP"}
        </button>

        <div className="mt-5 text-center">
          <Link
            href="/login"
            className="text-xs text-[rgba(232,244,240,0.5)] hover:text-[#e8f4f0] transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
