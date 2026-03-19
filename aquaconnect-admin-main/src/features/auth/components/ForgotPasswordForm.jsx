"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { requestResetOtp } from "../services/auth.service";

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      await requestResetOtp({ email: data.email });
      setSent(true);
    } catch (err) {
      setError(err?.message || "Failed to request reset OTP");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.12)] rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.2)] flex items-center justify-center text-2xl mx-auto mb-6">
          ✉️
        </div>
        <h2 className="font-syne text-2xl font-extrabold tracking-tight mb-3">
          Check your inbox
        </h2>
        <p className="text-sm text-[rgba(232,244,240,0.4)] font-light leading-relaxed mb-8">
          We sent a password reset OTP to{" "}
          <span className="text-[#1D9E75]">{getValues("email")}</span>. It
          expires in 10 minutes.
        </p>
        <Link
          href="/reset-password"
          className="block w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3.5 rounded-xl
            hover:bg-[#5DCAA5] transition-all text-sm tracking-tight text-center"
        >
          Enter OTP
        </Link>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-xs text-[rgba(232,244,240,0.3)] hover:text-[rgba(232,244,240,0.6)] transition-colors"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#05141f] border border-[rgba(29,158,117,0.12)] rounded-2xl p-10">
      <div className="mb-8">
        <h1 className="font-syne text-3xl font-extrabold tracking-tight mb-2">
          Forgot password?
        </h1>
        <p className="text-sm text-[rgba(232,244,240,0.4)] font-light">
          Enter your email and we'll send you a reset OTP.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error ? (
          <p className="text-xs text-[#f09595] bg-[rgba(240,149,149,0.1)] border border-[rgba(240,149,149,0.35)] rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}
        <div>
          <label className="block text-xs text-[rgba(232,244,240,0.5)] font-medium mb-2 tracking-wide">
            Email address
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.2)] text-sm">
              ✉
            </span>
            <input
              type="email"
              placeholder="admin@aquaconnect.com"
              {...register("email", {
                required: "Email is required.",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Enter a valid email address.",
                },
              })}
              className={`w-full bg-[rgba(29,158,117,0.04)] border rounded-xl pl-10 pr-4 py-3.5 text-sm
                text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none transition-all
                ${
                  errors.email
                    ? "border-[rgba(240,149,149,0.5)] focus:border-[rgba(240,149,149,0.7)]"
                    : "border-[rgba(29,158,117,0.12)] focus:border-[rgba(29,158,117,0.5)] focus:bg-[rgba(29,158,117,0.07)]"
                }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-[#f09595] mt-1.5 pl-0.5">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3.5 rounded-xl
            hover:bg-[#5DCAA5] transition-all hover:-translate-y-0.5 active:translate-y-0
            disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-tight"
        >
          {loading ? "Sending OTP..." : "Send Reset OTP"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="text-xs text-[rgba(232,244,240,0.3)] hover:text-[#1D9E75] transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
