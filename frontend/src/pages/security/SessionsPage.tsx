import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Monitor, Smartphone, Trash2 } from "lucide-react";
import { auth, ApiError } from "@/api";
import type { Session } from "@/api";
import { PageHeader, Card, EmptyState, ErrorState, Loading, Badge, buttonClass } from "@/components/ui/primitives";

/**
 * GET /api/auth/sessions + DELETE /api/auth/sessions/{id}.
 *
 * The backend keeps one row per login device. Deleting a session revokes that
 * device's refresh token; every OTHER device keeps working. Revoking the
 * current device is allowed but signs you out — the UI says so before doing it.
 */
export default function SessionsPage() {
  const queryClient = useQueryClient();

  const sessionsQ = useQuery({
    queryKey: ["sessions"],
    queryFn: auth.sessions,
  });

  const revoke = useMutation({
    mutationFn: (id: string | number) => auth.revokeSession(id),
    onSuccess: () => {
      toast.success("Session revoked.");
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.description : "Revoke failed"),
  });

  const rows = sessionsQ.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <PageHeader
          title="Active sessions"
          subtitle="Every device signed into your account. Revoking one signs out that device only."
        />

        <div className="mt-6 space-y-4">
          {sessionsQ.isLoading && <Loading label="Loading sessions…" />}
          {sessionsQ.error && <ErrorState error={sessionsQ.error} />}

          {sessionsQ.data && rows.length === 0 && (
            <EmptyState title="No other sessions" hint="You are signed in on this device only." />
          )}

          {rows.length > 0 && (
            <Card>
              <ul className="divide-y divide-border">
                {rows.map((s: Session) => {
                  const mobile = /mobile|android|iphone/i.test(String(s.device ?? ""));
                  return (
                    <li key={String(s.id)} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-start gap-3">
                        {mobile ? (
                          <Smartphone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Monitor className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{str(s.device) || "Unknown device"}</p>
                          <p className="text-xs text-muted-foreground">
                            {str(s.ip) ? `${str(s.ip)} · ` : ""}
                            signed in {fmtDate(s.created_at)}
                          </p>
                          <p className="text-xs text-muted-foreground">expires {fmtDate(s.expires_at)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={revoke.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Revoke this session? If it is the device you are using, you will be signed out.",
                            )
                          ) {
                            revoke.mutate(s.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Revoke
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <div className="rounded-lg border border-border bg-white p-4 text-xs text-muted-foreground">
            <Badge tone="neutral">Security</Badge>
            <p className="mt-2">
              Signing out revokes this device's refresh token. If you ever suspect
              someone else has your password, revoke every session here, then change
              your password from the security page — reuse of an old refresh token
              is detected and burns all of that attacker's sessions too.
            </p>
            <Link to="/forgot-password" className={`mt-3 inline-block ${buttonClass}`}>
              Change password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function fmtDate(v: string): string {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString();
}
