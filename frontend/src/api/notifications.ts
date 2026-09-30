import { request } from "./client";
import { keysetQuery, nextCursor } from "./pagination";
import type { KeysetQuery, NotificationResponse } from "./types";

/**
 * `/api/notifications` — 4 routes, keyset paginated (`?limit=&after=`).
 *
 * Rows land whether or not the user is online; the WS push only fires while
 * connected. Email goes out only for key event kinds (never message bodies),
 * and is skipped entirely once the daily budget (300) is reached.
 */

export function list(q: KeysetQuery = {}): Promise<NotificationResponse[]> {
  return request<NotificationResponse[]>("/api/notifications", { query: keysetQuery(q) });
}

export function older(known: NotificationResponse[]) {
  const cursor = nextCursor(known);
  return list(cursor === undefined ? {} : { after: cursor });
}

export function unreadCount(): Promise<{ unread_count: number }> {
  return request<{ unread_count: number }>("/api/notifications/unread_count");
}

/** 404 when the notification isn't yours. */
export function markRead(pid: string): Promise<NotificationResponse> {
  return request<NotificationResponse>(`/api/notifications/${pid}/read`, {
    method: "POST",
  });
}

export function markAllRead(): Promise<{ marked_read: number }> {
  return request<{ marked_read: number }>("/api/notifications/read_all", {
    method: "POST",
  });
}
