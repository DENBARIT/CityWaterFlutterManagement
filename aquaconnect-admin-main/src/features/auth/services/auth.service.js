import { apiRequest } from "@/services/apiClient";

export async function loginAdmin({ email, password }) {
  const payload = await apiRequest("/auth/login", {
    method: "POST",
    body: {
      emailOrPhone: email,
      password,
    },
  });

  return payload?.data || payload;
}

export async function requestResetOtp({ email }) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resendVerificationOtp({ email }) {
  return apiRequest("/auth/resend-otp", {
    method: "POST",
    body: { email },
  });
}

export async function verifyEmailOtp({ email, otp }) {
  return apiRequest("/auth/validate-otp", {
    method: "POST",
    body: { email, otp },
  });
}

export async function resetPassword({ email, otp, newPassword }) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: {
      email,
      otp,
      newPassword,
    },
  });
}
