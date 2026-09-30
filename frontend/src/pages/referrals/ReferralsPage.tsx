import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { referrals } from "@/api";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  Money,
  PageHeader,
  buttonClass,
  statusTone,
} from "@/components/ui/primitives";

export default function ReferralsPage() {
  const dashboardQ = useQuery({
    queryKey: ["referrals", "dashboard"],
    queryFn: referrals.dashboard,
  });
  const [copied, setCopied] = useState(false);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-6 py-8">
      <PageHeader
        title="Referrals"
        subtitle="Invite friends, earn when they complete their first escrow."
      />

      <Card title="How referrals work">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Your referral code is issued lazily — it is created the first time
            this page loads.
          </li>
          <li>
            A code typed at signup that doesn't exist is silently ignored, so a
            friend who signed up "with your code" may not actually be linked to
            you. If they don't appear below, that's what happened.
          </li>
          <li>
            You earn {dashboardQ.data?.reward_naira_display ?? "the configured reward"}{" "}
            when a referred user completes their first escrow (order confirm,
            ride complete or delivery). Daily and lifetime caps may reject
            rewards.
          </li>
        </ul>
      </Card>

      {dashboardQ.isLoading && <Loading label="Loading referrals…" />}
      {dashboardQ.error && <ErrorState error={dashboardQ.error} />}

      {dashboardQ.data && (
        <>
          <Card title="Your code">
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md border border-border px-3 py-2 text-lg font-bold tracking-widest">
                {dashboardQ.data.code}
              </code>
              <button
                type="button"
                onClick={() => void copyCode(dashboardQ.data!.code)}
                className={buttonClass}
              >
                {copied ? "Copied!" : "Copy code"}
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Reward per referral: {dashboardQ.data.reward_naira_display}
            </p>
          </Card>

          <Card title="Stats">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">
                  {dashboardQ.data.stats.total}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Rewarded</p>
                <p className="text-xl font-semibold">
                  {dashboardQ.data.stats.rewarded}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-semibold">
                  {dashboardQ.data.stats.pending}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-xl font-semibold">
                  {dashboardQ.data.stats.rejected}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Earned</p>
                <p className="text-xl font-semibold">
                  <Money
                    kobo={dashboardQ.data.stats.earned_kobo}
                    display={dashboardQ.data.stats.earned_display}
                  />
                </p>
              </div>
            </div>
          </Card>

          <Card title="Referral history">
            {dashboardQ.data.referrals.length === 0 ? (
              <EmptyState
                title="No referrals yet"
                hint="Share your code — referred friends appear here once they sign up."
              />
            ) : (
              <ul>
                {dashboardQ.data.referrals.map((r, i) => (
                  <li
                    key={`${r.created_at}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
                  >
                    <div>
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        joined {r.created_at}
                        {r.rewarded_at ? ` · rewarded ${r.rewarded_at}` : ""}
                      </p>
                    </div>
                    <Money kobo={r.reward_kobo} className="font-medium" />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Friend identities are never shown — only status and reward.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
