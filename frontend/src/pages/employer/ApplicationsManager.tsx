import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Users } from "lucide-react";
import { referrals, listings, ApiError } from "@/api";
import type { Application, ApplicationStatus, ListingResponse } from "@/api";
import { PageHeader, Card, EmptyState, ErrorState, Loading, Badge, statusTone } from "@/components/ui/primitives";

/**
 * Employer console — the backend's employer-only application surface:
 *   GET  /api/my/listings                  (your job posts)
 *   GET  /api/listings/{pid}/applications/list   (applicants; owner-only)
 *   POST /api/applications/{pid}/status          (review FSM, candidate notified)
 *
 * The FSM is enforced server-side: applied→viewed/shortlisted/rejected ·
 * viewed→shortlisted/rejected · shortlisted→hired/rejected · terminal states
 * stick. Sending an illegal move answers 400 with the reason.
 */

const MOVES: Record<string, ApplicationStatus[]> = {
  applied: ["viewed", "shortlisted", "rejected"],
  viewed: ["shortlisted", "rejected"],
  shortlisted: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

function nextMoves(status: string): ApplicationStatus[] {
  return MOVES[status] ?? [];
}

export default function ApplicationsManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<ListingResponse | null>(null);

  const myJobs = useQuery({
    queryKey: ["my-job-listings"],
    queryFn: () => listings.mine(),
  });

  const jobs = (myJobs.data ?? []).filter((l) => l.vertical === "job");

  const applicants = useQuery({
    queryKey: ["applications", selectedListing?.pid],
    queryFn: () => referrals.applicantsFor(selectedListing!.pid),
    enabled: Boolean(selectedListing),
  });

  const setStatus = useMutation({
    mutationFn: ({ appPid, status }: { appPid: string; status: ApplicationStatus }) =>
      referrals.setStatus(appPid, status),
    onSuccess: () => {
      toast.success("Candidate updated and notified.");
      void queryClient.invalidateQueries({ queryKey: ["applications", selectedListing?.pid] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.description : "Update failed"),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <PageHeader
          title="Applicants"
          subtitle="Review applications to your job posts. Every move notifies the candidate."
          actions={
            <button type="button" onClick={() => navigate(-1)} className="rounded-md border border-border px-3 py-1.5 text-sm">
              <span className="inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back</span>
            </button>
          }
        />

        <div className="mt-6 space-y-6">
          <Card title="Your job posts">
            {myJobs.isLoading && <Loading label="Loading your listings…" />}
            {myJobs.error && <ErrorState error={myJobs.error} />}
            {myJobs.data && jobs.length === 0 && (
              <EmptyState title="No job posts yet" hint="Post a job from the Jobs page to receive applications." />
            )}
            {jobs.length > 0 && (
              <ul className="divide-y divide-border">
                {jobs.map((j) => (
                  <li key={j.pid}>
                    <button
                      type="button"
                      onClick={() => setSelectedListing(j)}
                      className={`flex w-full items-center justify-between px-2 py-3 text-left hover:bg-muted/40 rounded-md ${
                        selectedListing?.pid === j.pid ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className="font-medium">{j.title}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" /> select
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {selectedListing && (
            <Card title={`Applicants — ${selectedListing.title}`}>
              {applicants.isLoading && <Loading label="Loading applicants…" />}
              {applicants.error && <ErrorState error={applicants.error} />}
              {applicants.data && applicants.data.length === 0 && (
                <EmptyState title="No applicants yet" />
              )}

              <div className="space-y-4">
                {applicants.data?.map((app: Application) => {
                  const moves = nextMoves(String(app.status));
                  const name = strField(app["candidate_name"] ?? app["name"]) ?? "Candidate";
                  const email = strField(app["candidate_email"] ?? app["email"]);
                  const cvUrl = strField(app["cv_url"] ?? app["cv"]);
                  const note = strField(app["cover_note"]);
                  return (
                    <div key={app.pid} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{name}</p>
                          {email && <p className="text-xs text-muted-foreground">{email}</p>}
                        </div>
                        <Badge tone={statusTone(String(app.status))}>{String(app.status)}</Badge>
                      </div>
                      {note && <p className="mt-2 text-sm text-gray-600">{note}</p>}
                      {cvUrl && (
                        <a href={cvUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                          View CV
                        </a>
                      )}
                      {moves.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {moves.map((m) => (
                            <button
                              key={m}
                              type="button"
                              disabled={setStatus.isPending}
                              onClick={() => setStatus.mutate({ appPid: app.pid, status: m })}
                              className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                                m === "hired"
                                  ? "bg-emerald-600 text-white"
                                  : m === "rejected"
                                    ? "border border-destructive text-destructive"
                                    : "border border-primary text-primary"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                      {moves.length === 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">Terminal state — no further moves.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function strField(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
