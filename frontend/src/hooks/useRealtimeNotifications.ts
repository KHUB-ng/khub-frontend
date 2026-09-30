import { useCallback, useEffect, useRef, useState } from "react";
import { ChatSocket, notifications } from "@/api";
import type { NotificationResponse, ServerFrame } from "@/api";
import { toast } from "sonner";

export interface Notification {
  id: string;
  pid: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const toUi = (n: NotificationResponse): Notification => ({
  id: String(n.id),
  pid: n.pid,
  title: n.title,
  message: n.body,
  type: n.kind,
  is_read: n.read_at !== null && n.read_at !== undefined,
  link: null,
  created_at: n.created_at,
});

const frameToUi = (n: NotificationResponse): Notification => toUi(n);

/**
 * Notifications against the REST backend (`GET /api/notifications`,
 * `/unread_count`, `POST /{pid}/read`, `/read_all`).
 *
 * Supabase realtime channels do not exist. Delivery is: poll every 20s
 * plus the chat socket (`new ChatSocket({ onFrame })`, auth via `?token=`)
 * for live `notification` frames. Exported signature is unchanged so
 * `NotificationBell` and other consumers keep working.
 */
export const useRealtimeNotifications = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenPids = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const [rows, count] = await Promise.all([
        notifications.list({ limit: 50 }),
        notifications.unreadCount().catch(() => null),
      ]);
      setItems(rows.map(toUi));
      seenPids.current = new Set(rows.map((r) => r.pid));
      if (count) setUnreadCount(count.unread_count);
      else setUnreadCount(rows.filter((r) => !r.read_at).length);
    } catch {
      /* keep last-known list on screen */
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();

    const handleFrame = (frame: ServerFrame) => {
      if (frame.type === "notification") {
        const incoming = frame.notification as NotificationResponse;
        if (!incoming || seenPids.current.has(incoming.pid)) return;
        seenPids.current.add(incoming.pid);
        const ui = frameToUi(incoming);
        setItems((prev) => [ui, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast(ui.title, { description: ui.message });
      }
    };

    const socket = new ChatSocket({ onFrame: handleFrame, autoReconnect: true });
    socket.connect();

    const timer = window.setInterval(() => {
      void fetchNotifications();
    }, 20_000);

    return () => {
      window.clearInterval(timer);
      socket.close();
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    const target = items.find((n) => n.id === id);
    if (!target) return;
    try {
      await notifications.markRead(target.pid);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* leave unread on failure */
    }
  };

  const markAllRead = async () => {
    try {
      await notifications.markAllRead();
    } catch {
      return;
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { notifications: items, unreadCount, markAsRead, markAllRead };
};
