/**
 * KHUB API client — one module per backend route group.
 *
 * Build against `khub-backend/docs/API.md` (code-verified, 138 routes), never
 * against memory. `docs/API_COVERAGE.md` tracks which routes are wired.
 */

export * from "./types";
export {
  ApiError,
  API_BASE,
  absoluteUrl,
  clearTokens,
  getAccessToken,
  loadTokens,
  onSessionExpired,
  request,
  setTokens,
  upload,
} from "./client";
export type { RequestOptions } from "./client";
export * from "./money";
export * from "./pagination";
export * as auth from "./auth";
export * as user from "./user";
export * as wallet from "./wallet";
export * as listings from "./listings";
export * as orders from "./orders";
export * as rides from "./rides";
export * as deliveries from "./deliveries";
export * as driver from "./driver";
export * as agent from "./agent";
export * as conversations from "./conversations";
export * as notifications from "./notifications";
export * as referrals from "./referrals";
export * as admin from "./admin";
export {
  ChatSocket,
  openBrowserIncompatibleSocket,
} from "./ws";
export type {
  ChatSocketOptions,
  ClientFrame,
  ServerFrame,
  SocketKind,
} from "./ws";
export { COVERAGE, totals } from "./coverage";
export type { CoverageTotals, RouteEntry, RouteGroup, RouteStatus } from "./coverage";
export { SPECS, resolvePath, specFor } from "./registry";
export type { FieldSpec, RouteSpec } from "./registry";
