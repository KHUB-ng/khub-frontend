import type { ApiErrorBody, LoginResponse } from "./types";

/**
 * The single HTTP entry point for every KHUB route.
 *
 * Three backend behaviours drive the design here:
 *
 * 1. Access tokens are 15-minute JWTs; refresh tokens ROTATE, and replaying
 *    an already-consumed refresh token revokes the entire family (theft
 *    detection). So refreshes MUST be single-flight — two concurrent 401s
 *    would burn every session on the account. `refreshPromise` guarantees one
 *    in-flight refresh at a time.
 * 2. Auth is header-only (`Authorization: Bearer`) — no cookies, so no
 *    `withCredentials`, no CSRF surface.
 * 3. Errors are loco's `{error, description}` envelope; 503 means "provider
 *    unconfigured" (fail-closed), not a client bug.
 */

const rawBase = import.meta.env.VITE_API_BASE_URL ?? "";
/** "" in dev (same-origin → Vite proxy), "https://api.khub.com.ng" in prod. */
export const API_BASE = rawBase.replace(/\/+$/, "");

const ACCESS_KEY = "khub.access_token";
const REFRESH_KEY = "khub.refresh_token";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

/** Restore from storage on boot (called once by the auth context). */
export function loadTokens(): { access: string | null; refresh: string | null } {
  accessToken = accessToken ?? localStorage.getItem(ACCESS_KEY);
  refreshToken = refreshToken ?? localStorage.getItem(REFRESH_KEY);
  return { access: accessToken, refresh: refreshToken };
}

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** Fired on logout/expiry so the app can drop to a signed-out state. */
type SessionExpiredListener = () => void;
const expiredListeners = new Set<SessionExpiredListener>();
export function onSessionExpired(fn: SessionExpiredListener): () => void {
  expiredListeners.add(fn);
  return () => expiredListeners.delete(fn);
}
function emitSessionExpired(): void {
  expiredListeners.forEach((fn) => fn());
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly description: string;

  constructor(status: number, body: ApiErrorBody | string) {
    const code = typeof body === "string" ? "unknown" : body.error;
    const description =
      typeof body === "string" ? body : body.description || body.error;
    super(`[${status}] ${code}: ${description}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.description = description;
  }

  /** Provider (Flutterwave/Google) not configured — show a real message. */
  get isUnconfigured(): boolean {
    return this.status === 503;
  }
  get isAuth(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON body — money fields must already be naira strings. */
  body?: unknown;
  /** Multipart upload; when set, `body` is ignored. */
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  /** Send the bearer token (default true for JWT routes). */
  auth?: boolean;
  signal?: AbortSignal;
  /** Set false for endpoints whose 401 must surface instead of refreshing. */
  retryOn401?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${API_BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | string;
  try {
    const text = await res.text();
    body = text ? (JSON.parse(text) as ApiErrorBody) : res.statusText;
  } catch {
    body = res.statusText || `HTTP ${res.status}`;
  }
  return new ApiError(res.status, body);
}

/**
 * Single-flight refresh: every caller awaiting a 401 shares ONE network
 * round-trip. Concurrent refreshes would trip the backend's family-reuse
 * detection and log the user out of all devices.
 */
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  const current = refreshToken;
  if (!current) {
    clearTokens();
    emitSessionExpired();
    throw new ApiError(401, { error: "unauthenticated", description: "No session." });
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(buildUrl("/api/auth/refresh"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh_token: current }),
      });
      if (!res.ok) {
        // Rotated token was replayed or expired — the family is burned.
        clearTokens();
        emitSessionExpired();
        throw await parseError(res);
      }
      const data = (await res.json()) as LoginResponse;
      setTokens(data.token, data.refresh_token);
      return data.token;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, query, headers = {}, auth = true } = opts;

  const send = async (token: string | null): Promise<Response> => {
    const finalHeaders: Record<string, string> = { ...headers };
    if (token) finalHeaders.authorization = `Bearer ${token}`;

    let payload: BodyInit | undefined;
    if (formData) {
      payload = formData; // browser sets the multipart boundary
    } else if (body !== undefined) {
      finalHeaders["content-type"] = "application/json";
      payload = JSON.stringify(body);
    }

    return fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: payload,
      signal: opts.signal,
    });
  };

  let token = auth ? accessToken : null;
  let res = await send(token);

  if (res.status === 401 && auth && opts.retryOn401 !== false && refreshToken) {
    try {
      token = await refreshAccessToken();
      res = await send(token);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw await parseError(res);
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Multipart helper — the backend reads specific field names (see API.md). */
export async function upload<T>(
  path: string,
  formData: FormData,
  opts: Omit<RequestOptions, "formData" | "body"> = {},
): Promise<T> {
  return request<T>(path, { ...opts, method: "POST", formData });
}

/** Base origin for absolute URLs (media, hosted checkout links). */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
