import { request } from "./client";
import type { Application, ApplicationStatus, ReferralDashboard } from "./types";

/**
 * `/api/referrals` + job applications (G1).
 *
 * The referral code is issued LAZILY on the first read — a code passed to
 * /register that doesn't exist is silently ignored, so the user believes they
 * were referred when they weren't. Surface that in onboarding.
 * Referee identity is never exposed.
 */

export function dashboard(): Promise<ReferralDashboard> {
  return request<ReferralDashboard>("/api/referrals");
}

// ── Job applications ────────────────────────────────────────────────────────

/** Multipart: optional `cv` (pdf/doc/docx ≤ 5 MB) + optional `cover_note`.
 *  Job listings only, once per user per job (second → 400). */
export function apply(
  listingPid: string,
  opts: { cv?: File; coverNote?: string } = {},
): Promise<Application> {
  const fd = new FormData();
  if (opts.cv) fd.append("cv", opts.cv);
  if (opts.coverNote) fd.append("cover_note", opts.coverNote);
  return request<Application>(`/api/listings/${listingPid}/applications`, {
    method: "POST",
    formData: fd,
  });
}

/** Employer only — the one endpoint exposing applicant identity, by design. */
export function applicantsFor(listingPid: string): Promise<Application[]> {
  return request<Application[]>(`/api/listings/${listingPid}/applications/list`);
}

/** The candidate's own applications (their CV/note back). */
export function myApplications(): Promise<Application[]> {
  return request<Application[]>("/api/my/applications");
}

/** Employer only. FSM: applied→viewed/shortlisted/rejected · viewed→
 *  shortlisted/rejected · shortlisted→hired/rejected · terminal states stick. */
export function setStatus(applicationPid: string, status: ApplicationStatus) {
  return request<Application>(`/api/applications/${applicationPid}/status`, {
    method: "POST",
    body: { status },
  });
}
