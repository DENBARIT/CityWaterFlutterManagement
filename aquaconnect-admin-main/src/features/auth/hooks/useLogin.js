import { useState } from "react";
import { loginAdmin } from "../services/auth.service";
import { getRedirectPathFromToken } from "../utils/roleRouting";

export function useLogin() {
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const submitLogin = async (formData) => {
    setError("");
    setUnverifiedEmail("");

    try {
      const result = await loginAdmin(formData);
      const { role, redirectPath } = getRedirectPathFromToken(
        result?.accessToken,
      );

      if (typeof window !== "undefined") {
        if (result?.accessToken) {
          localStorage.setItem("accessToken", result.accessToken);
        }
        if (result?.refreshToken) {
          localStorage.setItem("refreshToken", result.refreshToken);
        }
      }

      return {
        ok: true,
        role,
        redirectPath,
      };
    } catch (err) {
      const message = err?.message || "Unable to sign in";
      setError(message);
      const payload = err?.payload || {};
      const requiresEmailVerification =
        payload?.requiresEmailVerification ||
        message.toLowerCase().includes("email not verified");
      const verifyEmail = payload?.email || formData?.email || "";

      if (requiresEmailVerification && verifyEmail) {
        setUnverifiedEmail(verifyEmail);
      }

      return {
        ok: false,
        error: message,
        requiresEmailVerification,
        email: verifyEmail,
      };
    }
  };

  return {
    error,
    unverifiedEmail,
    submitLogin,
  };
}
