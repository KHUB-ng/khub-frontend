import { request, upload } from "./client";
import type { KycStatus, User } from "./types";

/**
 * `/api/user` — 4 routes.
 *
 * `GET /profile` excludes verification status; `GET /api/auth/current`
 * includes it. Call both on boot if the UI needs either.
 * PATCH treats an empty string as "clear this field".
 */

export function profile(): Promise<User> {
  return request<User>("/api/user/profile");
}

export interface ProfilePatch {
  name?: string;
  phone?: string;
  address?: string;
  location?: string;
  avatar_url?: string;
}

/** 422 on name < 2 chars or phone > 20 chars. */
export function updateProfile(patch: ProfilePatch): Promise<User> {
  return request<User>("/api/user/profile", { method: "PATCH", body: patch });
}

/** Derived status across all submitted documents. */
export function kycStatus(): Promise<KycStatus> {
  return request<KycStatus>("/api/user/kyc");
}

/** Multipart field names are fixed: `doc_type` (text) + `document` (file).
 *  jpg/jpeg/png/webp/pdf, 5 MB cap. Re-submitting replaces the document. */
export function submitKyc(
  docType: string,
  file: File,
): Promise<{ id: number | string; doc_type: string; status: string }> {
  const fd = new FormData();
  fd.append("doc_type", docType);
  fd.append("document", file);
  return upload("/api/user/kyc", fd);
}
