import { API_BASE, getAccessToken } from "./client";
import type { NotificationResponse } from "./types";

/**
 * WebSockets — docs/API.md lists 6, but they are NOT symmetric:
 *
 *   /api/ws  (alias /api/chat/ws)  — accepts header OR `?token=`  ✅ browser
 *   /api/driver/socket             — header only                   ❌ browser
 *   /api/agent/socket              — header only                   ❌ browser
 *   /api/rides/{pid}/track         — header only                   ❌ browser
 *   /api/deliveries/{pid}/track    — header only                   ❌ browser
 *
 * A browser WebSocket cannot set an Authorization header, so only the chat
 * socket is reachable today. The other four need a server-side `?token=`
 * fallback mirroring chat_ws.rs — deferred (see README → Known limitations).
 */

export type SocketKind = "chat" | "driver" | "agent" | "ride_track" | "delivery_track";

/** Server→client chat/notification frames (chat_ws.rs). */
export type ServerFrame =
  | { type: "connected"; user_pid: string }
  | { type: "message_ack"; conversation_pid: string; [k: string]: unknown }
  | { type: "message"; conversation_pid: string; [k: string]: unknown }
  | { type: "typing"; conversation_pid: string; is_typing: boolean }
  | { type: "read"; conversation_pid: string }
  | { type: "read_ack"; conversation_pid: string }
  | { type: "notification"; notification: NotificationResponse }
  | { type: string; [k: string]: unknown };

export type ClientFrame =
  | { type: "message"; conversation_pid: string; body: string; attachment_key?: string }
  | { type: "typing"; conversation_pid: string; is_typing: boolean }
  | { type: "read"; conversation_pid: string };

export interface ChatSocketOptions {
  onFrame?: (frame: ServerFrame) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (ev: Event) => void;
  /** Exponential backoff reconnect; false disables it. */
  autoReconnect?: boolean;
}

function wsUrl(path: string): string {
  const origin = API_BASE || window.location.origin;
  const http = new URL(origin);
  http.protocol = http.protocol === "https:" ? "wss:" : "ws:";
  return `${http.origin}${path}`;
}

/**
 * The chat + notification socket. The ONLY one of the six a browser can open.
 * Auth via `?token=` because the browser can't send a WS header.
 */
export class ChatSocket {
  private ws: WebSocket | null = null;
  private closedByUser = false;
  private attempts = 0;
  private timer: number | null = null;

  constructor(private readonly opts: ChatSocketOptions = {}) {}

  connect(): void {
    const token = getAccessToken();
    if (!token) {
      this.opts.onError?.(new Event("no-token"));
      return;
    }
    this.closedByUser = false;

    const socket = new WebSocket(
      wsUrl(`/api/ws?token=${encodeURIComponent(token)}`),
    );
    this.ws = socket;

    socket.onopen = () => {
      this.attempts = 0;
      this.opts.onOpen?.();
    };
    socket.onmessage = (ev) => {
      if (typeof ev.data !== "string") return;
      try {
        this.opts.onFrame?.(JSON.parse(ev.data) as ServerFrame);
      } catch {
        /* ignore malformed frames */
      }
    };
    socket.onerror = (ev) => this.opts.onError?.(ev);
    socket.onclose = () => {
      this.opts.onClose?.();
      if (!this.closedByUser && this.opts.autoReconnect !== false) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * 2 ** this.attempts, 30_000);
    this.attempts += 1;
    this.timer = window.setTimeout(() => this.connect(), delay);
  }

  send(frame: ClientFrame): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(frame));
    return true;
  }

  sendRaw(payload: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  close(): void {
    this.closedByUser = true;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.ws?.close();
    this.ws = null;
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Placeholder for the four sockets that need the deferred `?token=` change.
 * Throws loudly rather than silently no-op'ing, so a half-wired tracking UI
 * can't pretend to be live.
 */
export function openBrowserIncompatibleSocket(kind: SocketKind, path: string): never {
  throw new Error(
    `WebSocket "${kind}" (${path}) cannot be opened from a browser: it accepts ` +
      `the token via Authorization header only, which browsers cannot set on a ` +
      `WebSocket. Requires a server-side ?token= fallback. See README → ` +
      `Known limitations.`,
  );
}
