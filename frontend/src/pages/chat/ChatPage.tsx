import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { ApiError, ChatSocket, conversations } from "@/api";
import type { MessageResponse, ServerFrame } from "@/api";
import {
  Card,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  PageHeader,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui/primitives";

function describe(e: unknown): string {
  if (e instanceof ApiError) return e.description;
  if (e instanceof Error) return e.message;
  return "Request failed";
}

function frameMessage(frame: Extract<ServerFrame, { type: string }>): MessageResponse | null {
  const rec = frame as unknown as Record<string, unknown>;
  const msg = rec["message"] as Record<string, unknown> | undefined;
  const src = msg ?? rec;
  if (typeof src["id"] !== "number" || typeof src["body"] !== "string") return null;
  return {
    id: src["id"] as number,
    pid: typeof src["pid"] === "string" ? src["pid"] : "",
    sender_pid: typeof src["sender_pid"] === "string" ? src["sender_pid"] : "",
    body: src["body"] as string,
    attachment_key:
      typeof src["attachment_key"] === "string" ? src["attachment_key"] : null,
    attachment_url:
      typeof src["attachment_url"] === "string" ? src["attachment_url"] : null,
    created_at: typeof src["created_at"] === "string" ? src["created_at"] : "",
  };
}

export default function ChatPage() {
  const qc = useQueryClient();
  const [activePid, setActivePid] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerReadUpTo, setPeerReadUpTo] = useState(false);
  const [socketUp, setSocketUp] = useState(false);
  const [newPeerPid, setNewPeerPid] = useState("");
  const typingTimer = useRef<number | null>(null);
  const socketRef = useRef<ChatSocket | null>(null);

  const listQ = useQuery({ queryKey: ["chat", "list"], queryFn: conversations.list });
  const detailQ = useQuery({
    queryKey: ["chat", "detail", activePid],
    queryFn: () => conversations.get(activePid ?? ""),
    enabled: activePid !== null,
  });
  const msgsQ = useQuery({
    queryKey: ["chat", "messages", activePid],
    queryFn: () => conversations.messages(activePid ?? "", { limit: 30 }),
    enabled: activePid !== null,
  });

  const active = activePid;
  const refreshThread = useCallback(
    (pid: string) => {
      void qc.invalidateQueries({ queryKey: ["chat", "messages", pid] });
      void qc.invalidateQueries({ queryKey: ["chat", "list"] });
    },
    [qc],
  );

  // Live updates: connect once on mount, close on unmount.
  useEffect(() => {
    const socket = new ChatSocket({
      onOpen: () => setSocketUp(true),
      onClose: () => setSocketUp(false),
      onError: () => setSocketUp(false),
      onFrame: (frame: ServerFrame) => {
        const f = frame as { type: string; conversation_pid?: string };
        if (f.type === "notification") return; // surfaced by the notifications page
        const pid = typeof f.conversation_pid === "string" ? f.conversation_pid : null;
        if (f.type === "message" || f.type === "message_ack") {
          const msg = frameMessage(frame);
          if (msg && pid) {
            qc.setQueryData<MessageResponse[]>(["chat", "messages", pid], (old) => {
              if (!old) return [msg];
              if (old.some((m) => m.id === msg.id)) return old;
              return [...old, msg];
            });
          }
          if (pid) void qc.invalidateQueries({ queryKey: ["chat", "list"] });
          return;
        }
        if (f.type === "typing" && pid === activePid) {
          const rec = frame as unknown as Record<string, unknown>;
          setPeerTyping(rec["is_typing"] === true);
          if (typingTimer.current !== null) window.clearTimeout(typingTimer.current);
          typingTimer.current = window.setTimeout(() => setPeerTyping(false), 4000);
          return;
        }
        if ((f.type === "read" || f.type === "read_ack") && pid === activePid) {
          setPeerReadUpTo(true);
        }
      },
    });
    socketRef.current = socket;
    socket.connect();
    return () => {
      socket.close();
      socketRef.current = null;
      if (typingTimer.current !== null) window.clearTimeout(typingTimer.current);
    };
  }, [qc, activePid]);

  // Mark the open thread read whenever fresh messages land.
  useEffect(() => {
    if (active && msgsQ.data && msgsQ.data.length > 0) {
      conversations.markRead(active).catch(() => undefined);
    }
  }, [active, msgsQ.data]);

  const sendM = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("Pick a conversation first.");
      const body = draft.trim();
      if (!body && !file) throw new Error("Write a message or attach a file.");
      let key: string | undefined;
      if (file) {
        const up = await conversations.uploadAttachment(active, file);
        key = up.attachment_key;
      }
      // REST send is authoritative; the WS also pushes to the peer live.
      return conversations.send(active, body || "(attachment)", key);
    },
    onSuccess: (msg) => {
      setDraft("");
      setFile(null);
      setPeerReadUpTo(false);
      if (active) {
        qc.setQueryData<MessageResponse[]>(["chat", "messages", active], (old) =>
          old && old.some((m) => m.id === msg.id) ? old : [...(old ?? []), msg],
        );
        refreshThread(active);
      }
    },
    onError: (e) => toast.error(describe(e)),
  });

  const olderM = useMutation({
    mutationFn: () => {
      if (!active || !msgsQ.data) throw new Error("No thread open.");
      return conversations.olderMessages(active, msgsQ.data);
    },
    onSuccess: (older) => {
      if (older.length === 0) {
        toast.info("No older messages.");
        return;
      }
      if (active) {
        qc.setQueryData<MessageResponse[]>(["chat", "messages", active], (old) => [
          ...older.filter((m) => !old?.some((o) => o.id === m.id)),
          ...(old ?? []),
        ]);
      }
    },
    onError: (e) => toast.error(describe(e)),
  });

  const newConvM = useMutation({
    mutationFn: () => conversations.getOrCreate(newPeerPid.trim()),
    onSuccess: (conv) => {
      setNewPeerPid("");
      setActivePid(conv.pid);
      toast.success("Conversation opened.");
      void qc.invalidateQueries({ queryKey: ["chat", "list"] });
    },
    onError: (e) => toast.error(describe(e)),
  });

  const sendTyping = (isTyping: boolean) => {
    if (active) socketRef.current?.send({ type: "typing", conversation_pid: active, is_typing: isTyping });
  };

  const messages = msgsQ.data ?? [];
  const lastOwn = [...messages].reverse().find(() => true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat"
        subtitle="Message counterparties. Live delivery over the chat socket; history is keyset-paginated REST."
        actions={
          <span
            className={`rounded px-2 py-0.5 text-xs ${socketUp ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}
          >
            {socketUp ? "live" : "offline — REST only"}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Conversation list */}
        <Card title="Conversations">
          <form
            className="mb-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newPeerPid.trim()) {
                toast.error("Enter the other user's pid.");
                return;
              }
              newConvM.mutate();
            }}
          >
            <input
              className={inputClass}
              placeholder="New: recipient user pid"
              value={newPeerPid}
              onChange={(e) => setNewPeerPid(e.target.value)}
            />
            <button type="submit" className={secondaryButtonClass} disabled={newConvM.isPending}>
              {newConvM.isPending ? "…" : "Start"}
            </button>
          </form>
          {newConvM.error && <ErrorState error={newConvM.error} />}
          {listQ.isLoading && <Loading label="Loading conversations…" />}
          {listQ.error && <ErrorState error={listQ.error} />}
          {listQ.data && listQ.data.length === 0 && (
            <EmptyState title="No conversations" hint="Start one with a user pid above." />
          )}
          <ul className="space-y-1">
            {listQ.data?.map((c) => (
              <li key={c.pid}>
                <button
                  type="button"
                  onClick={() => {
                    setActivePid(c.pid);
                    setPeerTyping(false);
                    setPeerReadUpTo(false);
                  }}
                  className={`w-full rounded-lg border p-3 text-left ${
                    c.pid === activePid ? "border-foreground" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{c.other_user_name}</span>
                    {c.unread_count > 0 && (
                      <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  {c.last_message && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {c.last_message}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Thread */}
        <div className="space-y-3 lg:col-span-2">
          {!active && (
            <EmptyState title="Pick a conversation" hint="History, typing, and read receipts appear here." />
          )}
          {active && detailQ.error && <ErrorState error={detailQ.error} />}
          {active && msgsQ.error && <ErrorState error={msgsQ.error} />}
          {active && msgsQ.isLoading && <Loading label="Loading messages…" />}

          {active && messages.length > 0 && (
            <Card title={detailQ.data ? `With ${detailQ.data.other_user_name}` : "Thread"}>
              <button
                type="button"
                className={secondaryButtonClass}
                disabled={olderM.isPending}
                onClick={() => olderM.mutate()}
              >
                {olderM.isPending ? "Loading…" : "Load older"}
              </button>
              <ul className="mt-3 space-y-2">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-border bg-muted/20 p-2 text-sm"
                  >
                    <p>{m.body}</p>
                    {m.attachment_url && (
                      <a
                        href={m.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-xs underline"
                      >
                        Attachment
                      </a>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">{m.created_at}</p>
                  </li>
                ))}
              </ul>
              {peerTyping && (
                <p className="mt-2 text-xs italic text-muted-foreground">typing…</p>
              )}
              {peerReadUpTo && lastOwn && (
                <p className="mt-1 text-[11px] text-muted-foreground">Seen</p>
              )}
            </Card>
          )}

          {active && (
            <Card title="Send">
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendM.mutate();
                }}
              >
                <Field label="Message">
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      sendTyping(e.target.value.length > 0);
                    }}
                    onBlur={() => sendTyping(false)}
                    placeholder="Write a message…"
                  />
                </Field>
                <Field label="Attachment" hint="jpg/png/webp/pdf, max 5 MB">
                  <input
                    type="file"
                    className="text-sm"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setFile(f ?? null);
                    }}
                  />
                </Field>
                {sendM.error && <ErrorState error={sendM.error} />}
                <button type="submit" className={buttonClass} disabled={sendM.isPending}>
                  <span className="inline-flex items-center gap-1">
                    <Send className="h-4 w-4" />
                    {sendM.isPending
                      ? file
                        ? "Uploading & sending…"
                        : "Sending…"
                      : "Send"}
                  </span>
                </button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
