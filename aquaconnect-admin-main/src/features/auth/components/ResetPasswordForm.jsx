"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { resetPassword } from "../services/auth.service";

export default function ResetPasswordForm({ initialEmail = "" }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [draftPassword, setDraftPassword] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: initialEmail,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (initialEmail) {
      setValue("email", initialEmail, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [initialEmail, setValue]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.sessionStorage.getItem("pendingPasswordChange");
    if (!raw) {
      return;
    }

    try {
      const draft = JSON.parse(raw);
      if (draft?.email && initialEmail && draft.email !== initialEmail) {
        return;
      }

      if (draft?.email) {
        setValue("email", draft.email, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }

      if (draft?.newPassword) {
        setDraftPassword(draft.newPassword);
        setValue("newPassword", draft.newPassword, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
        setValue("confirmPassword", draft.newPassword, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    } catch (_error) {
      setDraftPassword("");
    }
  }, [initialEmail, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      await resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("pendingPasswordChange");
      }
      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.12)] rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.2)] flex items-center justify-center text-2xl mx-auto mb-6">
          ✅
        </div>
        <h2 className="font-syne text-2xl font-extrabold tracking-tight mb-3">
          Password reset!
        </h2>
        <p className="text-sm text-[rgba(232,244,240,0.4)] font-light leading-relaxed mb-8">
          Your password has been updated successfully. You can now sign in with
          your new password.
        </p>
        <Link
          href="/login"
          className="block w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3.5 rounded-xl
            hover:bg-[#5DCAA5] transition-all text-sm tracking-tight text-center"
        >
          Back to Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#05141f] border border-[rgba(29,158,117,0.12)] rounded-2xl p-10">
      <div className="mb-8">
        <h1 className="font-syne text-3xl font-extrabold tracking-tight mb-2">
          Reset password
        </h1>
        <p className="text-sm text-[rgba(232,244,240,0.4)] font-light">
          Enter the OTP sent to your email and set a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error ? (
          <p className="text-xs text-[#f09595] bg-[rgba(240,149,149,0.1)] border border-[rgba(240,149,149,0.35)] rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}

        {draftPassword ? (
          <p className="text-xs text-[#9be5c9] bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.25)] rounded-lg px-3 py-2">
            Your new password was captured from the sidebar flow. Enter the OTP
            to finish the confirmation.
          </p>
        ) : null}

        {/* Email */}
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
                  message: "Enter a valid email.",
                },
              })}
              className={`w-full bg-[rgba(29,158,117,0.04)] border rounded-xl pl-10 pr-4 py-3.5 text-sm
                text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none transition-all
                ${
                  errors.email
                    ? "border-[rgba(240,149,149,0.5)]"
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

        {/* OTP */}
        <div>
          <label className="block text-xs text-[rgba(232,244,240,0.5)] font-medium mb-2 tracking-wide">
            OTP code
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.2)] text-sm">
              🔑
            </span>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              {...register("otp", {
                required: "OTP is required.",
                minLength: { value: 6, message: "OTP must be 6 digits." },
                maxLength: { value: 6, message: "OTP must be 6 digits." },
              })}
              className={`w-full bg-[rgba(29,158,117,0.04)] border rounded-xl pl-10 pr-4 py-3.5 text-sm
                text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none transition-all tracking-widest
                ${
                  errors.otp
                    ? "border-[rgba(240,149,149,0.5)]"
                    : "border-[rgba(29,158,117,0.12)] focus:border-[rgba(29,158,117,0.5)] focus:bg-[rgba(29,158,117,0.07)]"
                }`}
            />
          </div>
          {errors.otp && (
            <p className="text-xs text-[#f09595] mt-1.5 pl-0.5">
              {errors.otp.message}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs text-[rgba(232,244,240,0.5)] font-medium mb-2 tracking-wide">
            New password
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.2)] text-sm">
              🔒
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 characters"
              {...register("newPassword", {
                required: "New password is required.",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters.",
                },
                validate: {
                  hasUpper: (v) =>
                    /[A-Z]/.test(v) || "Must contain an uppercase letter.",
                  hasLower: (v) =>
                    /[a-z]/.test(v) || "Must contain a lowercase letter.",
                  hasNumber: (v) => /[0-9]/.test(v) || "Must contain a number.",
                  hasSpecial: (v) =>
                    /[!@#$%^&*]/.test(v) || "Must contain a special character.",
                },
              })}
              className={`w-full bg-[rgba(29,158,117,0.04)] border rounded-xl pl-10 pr-12 py-3.5 text-sm
                text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none transition-all
                ${
                  errors.newPassword
                    ? "border-[rgba(240,149,149,0.5)]"
                    : "border-[rgba(29,158,117,0.12)] focus:border-[rgba(29,158,117,0.5)] focus:bg-[rgba(29,158,117,0.07)]"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.25)] hover:text-[rgba(232,244,240,0.6)] transition-colors text-sm"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-[#f09595] mt-1.5 pl-0.5">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs text-[rgba(232,244,240,0.5)] font-medium mb-2 tracking-wide">
            Confirm new password
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.2)] text-sm">
              🔒
            </span>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your new password"
              {...register("confirmPassword", {
                required: "Please confirm your password.",
                validate: (v) =>
                  v === watch("newPassword") || "Passwords do not match.",
              })}
              className={`w-full bg-[rgba(29,158,117,0.04)] border rounded-xl pl-10 pr-12 py-3.5 text-sm
                text-[#e8f4f0] placeholder-[rgba(232,244,240,0.2)] outline-none transition-all
                ${
                  errors.confirmPassword
                    ? "border-[rgba(240,149,149,0.5)]"
                    : "border-[rgba(29,158,117,0.12)] focus:border-[rgba(29,158,117,0.5)] focus:bg-[rgba(29,158,117,0.07)]"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(232,244,240,0.25)] hover:text-[rgba(232,244,240,0.6)] transition-colors text-sm"
            >
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-[#f09595] mt-1.5 pl-0.5">
              {errors.confirmPassword.message}
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
          {loading ? "Resetting..." : "Reset Password"}
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
