"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJwtPayload } from "@/services/apiClient";
import {
  getRedirectPathByRole,
  isRoleAllowed,
  normalizeRole,
} from "@/features/auth/utils/roleRouting";

export default function RoleGuard({ allowedRoles = [], children }) {
  const router = useRouter();
  const normalizedAllowedRolesKey = allowedRoles
    .map((role) => normalizeRole(role))
    .sort()
    .join("|");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const normalizedAllowedRoles = normalizedAllowedRolesKey
      ? normalizedAllowedRolesKey.split("|")
      : [];

    const token = localStorage.getItem("accessToken") || "";
    if (!token) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.replace("/login");
      return;
    }

    const payload = getJwtPayload();
    const role = payload?.role;

    if (!role) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.replace("/login");
      return;
    }

    if (!isRoleAllowed(role, normalizedAllowedRoles)) {
      const fallbackPath = getRedirectPathByRole(role);
      router.replace(fallbackPath || "/login");
    }
  }, [normalizedAllowedRolesKey, router]);

  return children;
}
