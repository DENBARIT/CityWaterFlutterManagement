const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
const REQUEST_TIMEOUT_MS = 12000;
const GET_CACHE_TTL_MS = 15000;
const responseCache = new Map();
let refreshTokenPromise = null;

function getAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("accessToken") || "";
}

function getRefreshToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("refreshToken") || "";
}

function clearStoredTokens() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

function storeTokens({ accessToken = "", refreshToken = "" } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
  }

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

async function refreshAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return "";
  }

  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.message || "Unable to refresh session.");
    }

    const access = payload?.accessToken || payload?.data?.accessToken || "";
    const nextRefresh =
      payload?.refreshToken || payload?.data?.refreshToken || "";

    if (!access) {
      throw new Error("Session refresh did not return a valid access token.");
    }

    storeTokens({ accessToken: access, refreshToken: nextRefresh });
    return access;
  })().finally(() => {
    refreshTokenPromise = null;
  });

  return refreshTokenPromise;
}

function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    query,
    body,
    useAuth = false,
    token,
    timeoutMs = REQUEST_TIMEOUT_MS,
    retries,
    skipAuthRetry = false,
  } = options;
  const normalizedMethod = String(method).toUpperCase();

  const headers = {
    "Content-Type": "application/json",
  };

  const requestUrl = buildUrl(path, query);

  // Cache only unauthenticated GET requests for a short period.
  const canUseCache = normalizedMethod === "GET" && !useAuth && !token;
  if (canUseCache) {
    const cached = responseCache.get(requestUrl);
    if (cached && cached.expiresAt > Date.now()) {
      return JSON.parse(JSON.stringify(cached.payload));
    }
    if (cached) {
      responseCache.delete(requestUrl);
    }
  }

  if (useAuth) {
    const authToken = token || getAccessToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
  }

  const retryCount =
    typeof retries === "number"
      ? Math.max(0, retries)
      : normalizedMethod === "GET"
        ? 1
        : 0;
  const connectionIssueMessage =
    "Unable to connect to AquaConnect services right now. This may be due to internet instability or a temporary database connection issue. Please check your connection and try again.";

  let response;
  let lastError = null;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      response = await fetch(requestUrl, {
        method: normalizedMethod,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < retryCount) {
        continue;
      }

      if (error?.name === "AbortError") {
        throw new Error(
          "Request timed out while contacting AquaConnect services. Please check your internet connection and try again.",
        );
      }

      const wrappedError = new Error(connectionIssueMessage);
      wrappedError.cause = error;
      throw wrappedError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (!response) {
    const wrappedError = new Error(connectionIssueMessage);
    wrappedError.cause = lastError;
    throw wrappedError;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const rawMessage = payload?.message || payload?.error || "Request failed";

    if (
      response.status === 401 &&
      useAuth &&
      !token &&
      !skipAuthRetry &&
      /invalid token|unauthorized|jwt|expired/i.test(String(rawMessage))
    ) {
      try {
        const refreshedAccessToken = await refreshAccessToken();
        if (refreshedAccessToken) {
          return apiRequest(path, {
            ...options,
            token: refreshedAccessToken,
            skipAuthRetry: true,
          });
        }
      } catch (_refreshError) {
        clearStoredTokens();
      }
    }

    const isLikelyDbConnectivityIssue =
      response.status >= 500 &&
      /database|db|connect|connection|timeout|econn|network/i.test(
        String(rawMessage),
      );
    const message = isLikelyDbConnectivityIssue
      ? connectionIssueMessage
      : rawMessage;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (canUseCache) {
    responseCache.set(requestUrl, {
      payload,
      expiresAt: Date.now() + GET_CACHE_TTL_MS,
    });
  }

  return payload;
}

export function getJwtPayload() {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  try {
    const payloadPart = token.split(".")[1] || "";
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
}
