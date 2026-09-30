import { request, setTokens, clearTokens } from "./client";
import type { LoginResponse, Session, User } from "./types";

/**
 * `/api/auth` — 14 routes.
 *
 * Anti-enumeration traps the UI must respect:
 *   · register / forgot / reset / magic-link / resend-verification ALWAYS
 *     return 200 with an identical body, even for unknown emails. Never show
 *     "email already taken".
 *   · login's 401 covers BOTH bad credentials and unverified email with one
 *     generic message; the only recovery is resend-verification-mail.
 */

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  referral_code?: string;
}

/** Always resolves — duplicate emails look identical to new ones. */
export function register(input: RegisterInput): Promise<null> {
  return request<null>("/api/auth/register", { method: "POST", body: input, auth: false });
}

/** 401 on bad creds OR unverified email (same generic message). */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
    retryOn401: false,
  });
  setTokens(res.token, res.refresh_token);
  return res;
}

export async function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  const res = await request<LoginResponse>("/api/auth/google", {
    method: "POST",
    body: { id_token: idToken },
    auth: false,
    retryOn401: false,
  });
  setTokens(res.token, res.refresh_token);
  return res;
}

/** `refresh_token` rotates; replaying a consumed one burns the family. */
export async function refresh(refresh_token: string): Promise<LoginResponse> {
  const res = await request<LoginResponse>("/api/auth/refresh", {
    method: "POST",
    body: { refresh_token },
    auth: false,
    retryOn401: false,
  });
  setTokens(res.token, res.refresh_token);
  return res;
}

export async function logout(refresh_token: string): Promise<void> {
  try {
    await request<unknown>("/api/auth/logout", {
      method: "POST",
      body: { refresh_token },
      retryOn401: false,
    });
  } finally {
    clearTokens();
  }
}

export function verifyEmail(token: string): Promise<unknown> {
  return request<unknown>(`/api/auth/verify/${encodeURIComponent(token)}`, { auth: false });
}

export function forgotPassword(email: string): Promise<unknown> {
  return request<unknown>("/api/auth/forgot", { method: "POST", body: { email }, auth: false });
}

export function resetPassword(token: string, password: string): Promise<unknown> {
  return request<unknown>("/api/auth/reset", {
    method: "POST",
    body: { token, password },
    auth: false,
  });
}

export function magicLink(email: string): Promise<unknown> {
  return request<unknown>("/api/auth/magic-link", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export function redeemMagicLink(token: string): Promise<LoginResponse> {
  return request<LoginResponse>(`/api/auth/magic-link/${encodeURIComponent(token)}`, {
    auth: false,
    retryOn401: false,
  });
}

export function resendVerification(email: string): Promise<unknown> {
  return request<unknown>("/api/auth/resend-verification-mail", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

/** Profile incl. role + verification status — call once on boot. */
export function currentUser(): Promise<User> {
  return request<User>("/api/auth/current");
}

export function sessions(): Promise<Session[]> {
  return request<Session[]>("/api/auth/sessions");
}

export function revokeSession(sessionId: string | number): Promise<unknown> {
  return request<unknown>(`/api/auth/sessions/${sessionId}`, { method: "DELETE" });
}
