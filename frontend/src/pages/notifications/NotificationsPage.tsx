import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { nextCursor, notifications } from "@/api";
import type { NotificationResponse } from "@/api";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  buttonClass,
  secondaryButtonClass,
  statusTone,
} from "@/components/ui/primitives";

const PAGE_LIMIT = 20;

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function NotificationRow({
  n,
  onMarkRead,
  marking,
}: {
  n: NotificationResponse;
  onMarkRead: (pid: string) => void;
  marking: boolean;
}) {
  const unread = !n.read_at;
  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-2 border-b border-border py-3 last:border-0 ${
        unread ? "" : "opacity-75"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <Badge tone={statusTone(n.kind)}>{n.kind}</Badge>
          {n.title}
          {unread && <Badge tone="warn">unread</Badge>}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {fmtDate(n.created_at)}
        </p>
      </div>
      {unread && (
        <button
          type="button"
          disabled={marking}
          onClick={() => onMarkRead(n.pid)}
          className={secondaryButtonClass}
        >
          Mark read
        </button>
      )}
    </li>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const listQ = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    queryFn: ({ pageParam }: { pageParam: number | undefined }) =>
      pageParam === undefined
        ? notifications.list({ limit: PAGE_LIMIT })
        : notifications.list({ limit: PAGE_LIMIT, after: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.length < PAGE_LIMIT ? undefined : nextCursor(lastPage),
    initialPageParam: undefined as number | undefined,
  });
  const items = listQ.data?.pages.flat() ?? [];

  const unreadQ = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: notifications.unreadCount,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ["notifications", "list"],
    });
    void queryClient.invalidateQueries({
      queryKey: ["notifications", "unread"],
    });
  };

  const markReadM = useMutation({
    mutationFn: (pid: string) => notifications.markRead(pid),
    onSuccess: refresh,
  });

  const markAllM = useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: refresh,
  });

  const unreadCount = unreadQ.data?.unread_count;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-6 py-8">
      <PageHeader
        title="Notifications"
        subtitle="Newest first."
        actions={
          <button
            type="button"
            disabled={markAllM.isPending || !unreadCount}
            onClick={() => {
              if (!window.confirm("Mark all notifications as read?")) return;
              markAllM.mutate();
            }}
            className={buttonClass}
          >
            {markAllM.isPending ? "Marking…" : "Mark all read"}
          </button>
        }
      />

      <Card title="Inbox">
        {unreadQ.isLoading ? (
          <Loading label="Loading unread count…" />
        ) : unreadQ.error ? (
          <ErrorState error={unreadQ.error} />
        ) : (
          <p className="text-sm">
            <Badge tone={unreadCount ? "warn" : "neutral"}>
              {unreadCount ?? 0} unread
            </Badge>
          </p>
        )}

        <div className="mt-3">
          {listQ.isLoading && <Loading label="Loading notifications…" />}
          {listQ.error && <ErrorState error={listQ.error} />}
          {listQ.data && items.length === 0 && (
            <EmptyState
              title="No notifications"
              hint="Activity on your rides, orders, KYC and withdrawals will show up here."
            />
          )}
          {items.length > 0 && (
            <ul>
              {items.map((n) => (
                <NotificationRow
                  key={n.pid}
                  n={n}
                  marking={markReadM.isPending}
                  onMarkRead={(pid) => markReadM.mutate(pid)}
                />
              ))}
            </ul>
          )}
          {(markReadM.error || markAllM.error) && (
            <div className="mt-2">
              <ErrorState error={markReadM.error ?? markAllM.error} />
            </div>
          )}
          {markAllM.isSuccess && (
            <p className="mt-2 text-sm text-emerald-500">
              Marked {markAllM.data.marked_read} as read.
            </p>
          )}
          {listQ.hasNextPage && (
            <button
              type="button"
              onClick={() => void listQ.fetchNextPage()}
              disabled={listQ.isFetchingNextPage}
              className={`${secondaryButtonClass} mt-3`}
            >
              {listQ.isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
