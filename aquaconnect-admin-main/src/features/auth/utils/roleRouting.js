export function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase();
}

export function getRedirectPathByRole(role) {
  switch (normalizeRole(role)) {
    case "SUPER_ADMIN":
      return "/dashboard";
    case "SUBCITY_ADMIN":
      return "/subcity";
    case "WOREDA_ADMINS":
    case "WOREDA_ADMIN":
      return "/woreda";
    case "SUBCITY_BILLING_OFFICER":
    case "WOREDA_BILLING_OFFICER":
      return "/billing";
    case "SUBCITY_COMPLAINT_OFFICER":
    case "WOREDA_COMPLAINT_OFFICER":
      return "/complaint";
    case "FIELD_OFFICER":
    case "MANUAL_METER_READER":
      return "/login";
    default:
      return "/login";
  }
}

export function decodeJwtPayload(token) {
  try {
    const payloadPart = String(token || "").split(".")[1] || "";
    if (!payloadPart) {
      return null;
    }
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
}

export function getRedirectPathFromToken(token) {
  const payload = decodeJwtPayload(token);
  return {
    role: payload?.role || null,
    redirectPath: getRedirectPathByRole(payload?.role),
  };
}

export function isRoleAllowed(role, allowedRoles = []) {
  const normalizedRole = normalizeRole(role);
  return allowedRoles.some(
    (allowedRole) => normalizeRole(allowedRole) === normalizedRole,
  );
}
