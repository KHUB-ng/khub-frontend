import { request, upload } from "./client";
import { keysetQuery, nextCursor } from "./pagination";
import type {
  AttachmentUpload,
  ConversationResponse,
  KeysetQuery,
  MessageResponse,
} from "./types";

/**
 * `/api/conversations` — 7 routes, participant-gated (non-party → 403/404).
 *
 * History is KEYSET paginated (`?after=&limit=`), newest first — not `Page`.
 * Real-time delivery happens on the chat WebSocket; REST history is the
 * fallback for offline recipients (WS does not replay).
 */

export function getOrCreate(recipientPid: string, ref?: { table?: string; pid?: string }) {
  return request<ConversationResponse>("/api/conversations", {
    method: "POST",
    body: {
      recipient_pid: recipientPid,
      ref_table: ref?.table,
      ref_pid: ref?.pid,
    },
  });
}

export function list(): Promise<ConversationResponse[]> {
  return request<ConversationResponse[]>("/api/conversations");
}

export function get(pid: string): Promise<ConversationResponse> {
  return request<ConversationResponse>(`/api/conversations/${pid}`);
}

export function messages(
  pid: string,
  q: KeysetQuery = {},
): Promise<MessageResponse[]> {
  return request<MessageResponse[]>(`/api/conversations/${pid}/messages`, {
    query: keysetQuery(q),
  });
}

/** Cursor for infinite scroll back through history. */
export function olderMessages(pid: string, known: MessageResponse[]) {
  const cursor = nextCursor(known);
  return messages(pid, cursor === undefined ? {} : { after: cursor });
}

/** Also pushes the message live over the chat WS when the peer is online. */
export function send(pid: string, body: string, attachmentKey?: string) {
  return request<MessageResponse>(`/api/conversations/${pid}/messages`, {
    method: "POST",
    body: { body, attachment_key: attachmentKey },
  });
}

/** → `{"ok":true}` and a `read` receipt to the other party. */
export function markRead(pid: string): Promise<unknown> {
  return request<unknown>(`/api/conversations/${pid}/read`, { method: "POST" });
}

/** Multipart field name is `file`; jpg/png/webp/pdf ≤ 5 MB.
 *  Reference the returned key on the next `send`. */
export function uploadAttachment(pid: string, file: File): Promise<AttachmentUpload> {
  const fd = new FormData();
  fd.append("file", file);
  return upload<AttachmentUpload>(`/api/conversations/${pid}/attachments`, fd);
}
