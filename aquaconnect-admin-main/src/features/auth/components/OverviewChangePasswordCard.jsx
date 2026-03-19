"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import { apiRequest } from "@/services/apiClient";
import { requestResetOtp } from "@/features/auth/services/auth.service";

export default function OverviewChangePasswordCard() {
  const router = useRouter();
  const [accountEmail, setAccountEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const result = await apiRequest("/auth/me", { useAuth: true });
        const email = result?.data?.email || "";
        if (mounted) {
          setAccountEmail(email);
        }
      } catch (_error) {
        if (mounted) {
          setAccountEmail("");
        }
      }
    };

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!accountEmail) {
      setStatus({
        type: "error",
        message:
          "We could not load your account email. Please refresh and try again.",
      });
      return;
    }

    const trimmedPassword = String(newPassword || "").trim();

    if (trimmedPassword.length < 8) {
      setStatus({
        type: "error",
        message: "Password must be at least 8 characters.",
      });
      return;
    }

    if (trimmedPassword !== String(confirmPassword || "")) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    setLoading(true);

    try {
      await requestResetOtp({ email: accountEmail });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "pendingPasswordChange",
          JSON.stringify({
            email: accountEmail,
            newPassword: trimmedPassword,
            savedAt: Date.now(),
          }),
        );
      }

      setStatus({
        type: "success",
        message:
          "OTP sent to your email. Continue to reset and confirm your password change.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Unable to request password reset OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-syne font-bold text-sm tracking-tight">
          Change Password
        </h3>
        {status.type === "success" ? (
          <button
            type="button"
            onClick={() =>
              router.push(
                `/reset-password?email=${encodeURIComponent(accountEmail)}`,
              )
            }
            className="text-[10px] px-3 py-1.5 rounded-lg bg-[rgba(29,158,117,0.15)] text-[#5DCAA5] hover:bg-[rgba(29,158,117,0.25)] transition-colors"
          >
            Continue to reset
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {status.message ? (
          <p
            className={`text-xs rounded-lg px-3 py-2 border ${
              status.type === "error"
                ? "text-[#f09595] bg-[rgba(240,149,149,0.1)] border-[rgba(240,149,149,0.35)]"
                : "text-[#9be5c9] bg-[rgba(29,158,117,0.1)] border-[rgba(29,158,117,0.3)]"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <div>
          <label className="block text-xs text-[rgba(232,244,240,0.5)] mb-2">
            Account email
          </label>
          <Input value={accountEmail || "Loading..."} readOnly />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[rgba(232,244,240,0.5)] mb-2">
              New password
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="block text-xs text-[rgba(232,244,240,0.5)] mb-2">
              Confirm password
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#1D9E75] text-[#020f1a] text-xs font-syne font-bold hover:bg-[#5DCAA5] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Sending OTP..." : "Send OTP for password change"}
          </button>
        </div>
      </form>
    </div>
  );
}
